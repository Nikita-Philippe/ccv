import { INotifications } from "@models/App.ts";
import { KV_NOTIFICATIONS_REMINDERS } from "@utils/constants.ts";
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
    console.error("Invalid time for reminder", {
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
  await kv.enqueue(message, {
    delay,
    keysIfUndelivered: [[KV_NOTIFICATIONS_REMINDERS], [remind.user], [remind.at.toString()]],
  });
};
