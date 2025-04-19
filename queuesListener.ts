import { KV_DAILY_ENTRY } from "@utils/constants.ts";
import { getLastKey } from "@utils/kv.ts";
import { sendDiscordPushNotification } from "@utils/notifications.ts";
import { DateTime } from "luxon";

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

/** Utility function to check if a message is a reminder message.
 * @param {unknown} message - The message to check.
 * @return {boolean} - True if the message is a reminder message, false otherwise.
 */
function isReminderMessage(message: unknown): message is IReminderMessage {
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
const handleReminder = async (message: IReminderMessage) => {
  console.log("Handling reminder message:", message);
  const hasMissDay = await checkForDailyAnswer(message.user);
  if (!hasMissDay) {
    console.log(`User ${message.user} has already answered the daily question today. Skipping reminder.`);
    return;
  }

  if (message.use.type === "discord") {
    console.log(`Sending reminder to ${message.user} via Discord`);
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
const checkForDailyAnswer = async (userKey: string) => {
  // Base our check on the last key (which is entry 'at' date)
  const lastKey = await getLastKey([KV_DAILY_ENTRY, userKey]);

  // Compare if last entry is before current one, by DAY
  const lastEntryDate = DateTime.fromISO(lastKey ?? "1970-01-01").startOf("day");
  const currentEntryDate = DateTime.now().minus({ days: 1 }).startOf("day");
  return lastEntryDate < currentEntryDate;
};

const kv = await Deno.openKv();

export default function () {
  // Get a reference to a KV database

  // Listen for messages in the queue
  kv.listenQueue(async (msg: unknown) => {
    try {
      console.log("Received message:", msg);
      if (isReminderMessage(msg)) await handleReminder(msg);
      else console.error("Unknown message received:", msg);
    } catch (error) {
      console.error("Error handling message:", error);
    }
  });
}
