import { INotifications } from "@models/App.ts";
import { KV_DAILY_ENTRY } from "@utils/constants.ts";
import { getLastKey } from "@utils/kv.ts";
import { sendDiscordPushNotification } from "@utils/notifications.ts";
import { DateTime } from "luxon";

/** Interface for a reminder entry.
 * @interface IReminder
 * @property {string} user - The user to remind.
 * @property {INotifications} notifications - The notifications settings for the user.
 */
export interface IReminder {
  user: string;
  notifications: INotifications;
}

/** Types of reminders available. */
export type RemindType = {
  type: "discord";
  query: string;
};

/** Reminder message interface. */
interface IReminderMessage {
  user: string;
  use: RemindType;
}

/** Enqueue an entry reminder, for the user to be notified at a specific time.
 *
 * @param {Deno.Kv} kv - The Deno.KV instance to use for the reminder.
 * @param {string} remind.user - The user to remind. Must be its user key.
 * @param {string} remind.at - The time to remind the user. Must be a valid ISO time string.
 * @param {RemindType} remind.use - The type of reminder to use.
 * @returns
 */
export const enqueueReminder = async (kv: Deno.Kv, remind: { user: string; at: string; use: RemindType }) => {
  const now = DateTime.now();
  const toTime = DateTime.fromISO(remind.at);
  if (!toTime.isValid || now > toTime) {
    console.log("Invalid time for reminder", {
      now: now.toISO(),
      toTime: toTime.toISO(),
      remind,
    });
    return;
  }

  // Calc time diff in ms
  const delay = toTime.diff(now, ["milliseconds"]).milliseconds;
  const message: IReminderMessage = {
    user: remind.user,
    use: remind.use,
  };
  await kv.enqueue(message, { delay });
};

/** Utility function to check if a message is a reminder message.
 * @param {unknown} message - The message to check.
 * @return {boolean} - True if the message is a reminder message, false otherwise.
 */
export function isReminderMessage(message: unknown): message is IReminderMessage {
  return (
    typeof message === "object" &&
    message !== null &&
    "user" in message &&
    "use" in message &&
    typeof (message as IReminderMessage).user === "string" &&
    typeof (message as IReminderMessage).use === "object"
  );
}

/** Handle a reminder message.
 * @param {IReminderMessage} message - The reminder message to handle.
 * @returns {Promise<void>} - A promise that resolves when the reminder has been handled.
 */
export const handleReminder = async (message: IReminderMessage) => {
  const hasMissDay = await checkForDailyAnswer(message.user);
  if (!hasMissDay) return;

  if (message.use.type === "discord") {
    const res = await sendDiscordPushNotification({ content: "TESTING ENQUEUES" }, message.use.query);
    if (!res) {
      console.error(`Failed to send reminder to ${message.user}`);
    }
  }
  console.log(`Sent reminder to ${message.user}`);
};

/** Check if the user has already answered the daily question today.
 *
 * Note: This function is based on the last key (which is entry 'at' date) and not the actual answer. The
 * actual answer is user-based encrypted, so we cannot check it directly.
 *
 * @param {string} userKey - The user key to check.
 * @returns {Promise<boolean>} - A promise that resolves to true if the user has already answered, false otherwise.
 */
export const checkForDailyAnswer = async (userKey: string) => {
  // Base our check on the last key (which is entry 'at' date)
  const lastKey = await getLastKey([KV_DAILY_ENTRY, userKey]);

  // Compare if last entry is before current one, by DAY
  const lastEntryDate = DateTime.fromISO(lastKey ?? "1970-01-01").startOf("day");
  const currentEntryDate = DateTime.now().minus({ days: 1 }).startOf("day");
  return lastEntryDate < currentEntryDate;
};
