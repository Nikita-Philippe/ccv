import { checkForDailyAnswer } from "@utils/reminder.ts";

export default function () {
  // Each day at 8 AM UTC
  Deno.cron("Send 8am daily reminder", "0 8 * * *", () => {
    console.log("Checking for daily answer");
    checkForDailyAnswer();
  });

  // Each day at 8 PM UTC
  Deno.cron("Send 8pm daily reminder", "0 20 * * *", () => {
    console.log("Checking for daily answer");
    checkForDailyAnswer();
  });
}
