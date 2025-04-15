import { INotifications } from "@models/App.ts";
import { KV_SETTINGS, KV_DAILY_ENTRY } from "@utils/constants.ts";
import { getLastKey } from "@utils/kv.ts";
import { sendDiscordPushNotification } from "@utils/notifications.ts";
import { DateTime } from "luxon";
import { unique } from "@kitsonk/kv-toolbox/keys";
import { getSettings } from "@utils/settings.ts";

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
export const initReminders = async () => {
  const kv = await Deno.openKv();
  console.log("Checking for daily answer");

  const allSettings = await unique(kv, [KV_SETTINGS]);

  const usersToSendReminder: IReminder[] = [];
  for (const users of allSettings) {
    const userKey = (users as string[]).pop();
    if (!userKey) continue;
    const settings = await getSettings(userKey, true);
    if (settings?.notifications) usersToSendReminder.push({ user: userKey, notifications: settings.notifications });
  }

  console.log(`Found ${usersToSendReminder.length} users to send reminder`);

  for (const { user, notifications } of usersToSendReminder) {
    let type: RemindType | null = null;
    if (notifications.discord_webhook) type = { type: "discord", query: notifications.discord_webhook };

    if (!type) continue;

    if (notifications.start) await enqueueReminder(kv, { user, at: notifications.start, use: type });
    if (notifications.end) await enqueueReminder(kv, { user, at: notifications.end, use: type });

    console.log(`Enqueued reminder for user ${user} at ${notifications.start} and ${notifications.end}`);
  }

  console.log("Closing kv");
  kv.close();
};

/** Enqueue an entry reminder, for the user to be notified at a specific time.
 *
 * @param {Deno.Kv} kv - The Deno.KV instance to use for the reminder.
 * @param {string} remind.user - The user to remind. Must be its user key.
 * @param {string} remind.at - The time to remind the user. Must be a valid ISO time string.
 * @param {RemindType} remind.use - The type of reminder to use.
 * @returns
 */
const enqueueReminder = async (kv: Deno.Kv, remind: { user: string; at: string; use: RemindType }) => {
  // Set the timezone to Paris time FIXME: for now use Paris time, but should be set to the user's timezone in the 'at' field
  const now = DateTime.now().setZone("Europe/Paris").startOf("minute");
  const toTime = DateTime.fromISO(remind.at);
  if (!toTime.isValid) {
    console.log("Invalid time for reminder", {
      now: now.toISO(),
      toTime: toTime.toISO(),
      remind,
    });
    return;
  }

  // Calc time diff in ms
  const delay = Math.abs(toTime.diff(now, ["milliseconds"]).milliseconds ?? 0);
  const message: IReminderMessage = {
    user: remind.user,
    use: remind.use,
  };
  if (!delay) return;
  console.log("Enqueue reminder", {
    now: now.toISO(),
    toTime: toTime.toISO(),
    delay,
    message,
  });

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
  try {
    const hasMissDay = await checkForDailyAnswer(message.user);
    console.log("Handled reminder", {
      message,
      hasMissDay,
    });
    if (!hasMissDay) {
      console.log("User has not missed a day. Returning");
      return;
    }

    if (message.use.type === "discord") {
      const res = await sendDiscordPushNotification({ content: "ANSWER CCV GOOO" }, message.use.query);
      console.log("Discord push notification response", res);
      if (!res) {
        console.error(`Failed to send reminder to ${message.user}`);
      }
    }
    console.log(`Sent reminder to ${message.user}`);
  } catch (e) {
    console.trace("Error while sending reminder");
    console.error(message);
    console.error(e);
  }
};

/** Check if the user has already answered the daily question today.
 *
 * Note: This function is based on the last key (which is entry 'at' date) and not the actual answer. The
 * actual answer is user-based encrypted, so we cannot check it directly.
 *
 * @param {string} userKey - The user key to check.
 * @returns {Promise<boolean>} - A promise that resolves to true if the user has already answered, false otherwise.
 */
const checkForDailyAnswer = async (userKey: string) => {
  // Base our check on the last key (which is entry 'at' date)
  const lastKey = await getLastKey([KV_DAILY_ENTRY, userKey]);

  // Compare if last entry is before current one, by DAY
  const lastEntryDate = DateTime.fromISO(lastKey ?? "1970-01-01").startOf("day");
  const currentEntryDate = DateTime.now().setZone("Europe/Paris").minus({ days: 1 }).startOf("day");
  return lastEntryDate < currentEntryDate;
};
