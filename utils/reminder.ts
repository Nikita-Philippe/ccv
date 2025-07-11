import { KV_DAILY_ENTRY } from "@utils/constants.ts";
import { DateTime } from "luxon";
import { Debug } from "./debug.ts";
import { getLastKey } from "./kv.ts";
import { sendDiscordPushNotification } from "./notifications.ts";

/** Types of reminders available. */
export type RemindType = {
  type: "discord";
  query: string;
};

/** Handle a reminder message.
 * @param {IReminderMessage} message - The reminder message to handle.
 * @returns {Promise<void>} - A promise that resolves when the reminder has been handled.
 */
export const handleReminder = async (message: {
  user: string;
  use: RemindType;
}) => {
  const hasMissDay = await checkForDailyAnswer(message.user);
  if (!hasMissDay) {
    if (Debug.get("reminders")) {
      console.log(`User ${message.user} has already answered the daily question today. Skipping reminder.`);
    }
    return;
  }

  if (message.use.type === "discord") {
    if (Debug.get("reminders")) console.log(`Sending reminder to ${message.user} via Discord`);
    const res = await sendDiscordPushNotification({
      content: Deno.env.get("CRON_REMINDERS_MESSAGE") ?? "CCV - reminder",
    }, message.use.query);
    if (!res && Debug.get("reminders")) console.error(`Failed to send reminder to ${message.user}`);
    return;
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
  const currentEntryDate = DateTime.now().minus({ days: 1 }).startOf("day");
  return lastEntryDate < currentEntryDate;
};
