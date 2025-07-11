import { unique } from "@kitsonk/kv-toolbox/keys";
import { KV_SETTINGS } from "@utils/constants.ts";
import { handleReminder, RemindType } from "@utils/reminder.ts";
import { getSettings } from "@utils/settings.ts";
import { DateTime } from "luxon";
import { isDebug } from "@utils/common.ts";

const parseTimeToday = (timeString: string | undefined): DateTime => {
  if (!timeString) return DateTime.invalid("no time");
  const today = DateTime.now().setZone("utc").startOf("day");
  const time = DateTime.fromFormat(timeString as string, "HH:mm", { zone: "utc" });
  return today.set({ hour: time.hour, minute: time.minute });
};

export default function () {
  // Check for daily answer at 00:01
  Deno.cron(
    "Check for reminder to send troughout the day",
    { minute: { every: parseInt(Deno.env.get("CRON_REMINDERS_DELAY") ?? "10") } },
    async () => {
      console.time("cron:reminders");
      const kv = await Deno.openKv(Deno.env.get("KV_PATH"));
      try {
        const allSettings = await unique(kv, [KV_SETTINGS]);

        const usersToSendReminder: {
          user: string;
          notifications: NonNullable<Awaited<ReturnType<typeof getSettings>>["notifications"]>;
        }[] = [];

        for (const users of allSettings) {
          const userKey = (users as string[]).pop();
          if (!userKey) continue;
          const settings = await getSettings(userKey, true);
          if (settings?.notifications) {
            usersToSendReminder.push({ user: userKey, notifications: settings.notifications });
          }
        }

        if (isDebug()) console.log(`Found ${usersToSendReminder.length} users to send reminder`);

        const now = DateTime.now().setZone("utc");
        const nextCheck = now.plus({ minutes: parseInt(Deno.env.get("CRON_REMINDERS_DELAY") ?? "10") });

        for (const { user, notifications } of usersToSendReminder) {
          let sendNotification = false;
          console.log(`Checking reminders for user: ${user}`, notifications);

          const start = parseTimeToday(notifications.start);
          const end = parseTimeToday(notifications.end);

          if (isDebug()) {
            console.log(`Checking reminders for user :`, {
              user,
              start: start.toISO(),
              end: end.toISO(),
              now: now.toISO(),
              nextCheck: nextCheck.toISO(),
              startNum: +start,
              endNum: +end,
              nowNum: +now,
              nextCheckNum: +nextCheck,
              isStartCheck: start.isValid && start >= now && start < nextCheck,
              isEndCheck: end.isValid && end >= now && end < nextCheck,
            });
          }

          // Check if we should send start reminder (current time is at or past start time, and start time is within this check window)
          if (start.isValid && start >= now && start < nextCheck) {
            sendNotification = true;
            if (isDebug()) console.log("Sending START reminder");
          }

          // Check if we should send end reminder (current time is at or past end time, and end time is within this check window)
          if (!sendNotification && end.isValid && end >= now && end < nextCheck) {
            sendNotification = true;
            if (isDebug()) console.log("Sending END reminder");
          }

          if (!sendNotification) continue;

          let type: RemindType | null = null;
          if (notifications.discord_webhook) type = { type: "discord", query: notifications.discord_webhook };

          if (!type) continue;
          else handleReminder({ user, use: type });
        }
      } catch (error) {
        console.error("Error in cron reminders:", error);
      } finally {
        kv.close();
        console.timeEnd("cron:reminders");
      }
    },
  );
}
