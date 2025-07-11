import { unique } from "@kitsonk/kv-toolbox/keys";
import { KV_SETTINGS } from "@utils/constants.ts";
import { Debug } from "@utils/debug.ts";
import { handleReminder, RemindType } from "@utils/reminder.ts";
import { getSettings } from "@utils/settings.ts";
import { DateTime } from "luxon";

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
      if (Debug.get("perf_cron")) console.time("cron:reminders");
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

        if (Debug.get("cron")) console.log(`Found ${usersToSendReminder.length} users to send reminder`);

        const now = DateTime.now().setZone("utc");
        const nextCheck = now.plus({ minutes: parseInt(Deno.env.get("CRON_REMINDERS_DELAY") ?? "10") });

        for (const { user, notifications } of usersToSendReminder) {
          let sendNotification = false;

          const start = parseTimeToday(notifications.start);
          const end = parseTimeToday(notifications.end);

          if (start.isValid && start >= now && start < nextCheck) sendNotification = true;
          if (!sendNotification && end.isValid && end >= now && end < nextCheck) sendNotification = true;

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
        if (Debug.get("perf_cron")) console.timeEnd("cron:reminders");
      }
    },
  );
}
