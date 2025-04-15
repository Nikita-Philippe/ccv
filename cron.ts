import { initReminders } from "@utils/reminder.ts";

export default function () {
  // Each day at 00h00
  Deno.cron("Check for reminder to send troughout the day", { hour: { every: 3 } }, async () => {
    await initReminders();
  });
}
