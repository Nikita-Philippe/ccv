import { handleReminder, isReminderMessage } from "@utils/reminder.ts";

export default async function () {
  // Get a reference to a KV database
  const kv = await Deno.openKv();

  // Listen for messages in the queue
  kv.listenQueue((msg: unknown) => {
    console.log("Received message:", msg);
    if (isReminderMessage(msg)) handleReminder(msg);
    else console.error("Unknown message received:", msg);
  });
}
