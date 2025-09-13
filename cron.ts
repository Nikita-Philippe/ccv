import { unique } from "@kitsonk/kv-toolbox/keys";
import { KV_SETTINGS } from "@utils/constants.ts";
import { Debug } from "@utils/debug.ts";
import { NotificationService } from "@utils/notifications.ts";
import { getSettings } from "@utils/settings.ts";
import { DateTime } from "luxon";
import { checkForDailyAnswer } from "@utils/reminder.ts";
import { backupDB } from "@utils/backup.ts";

const parseTimeToday = (timeString: string | undefined): DateTime => {
  if (!timeString) return DateTime.invalid("no time");
  const today = DateTime.now().setZone("utc").startOf("day");
  const time = DateTime.fromFormat(timeString as string, "HH:mm", { zone: "utc" });
  return today.set({ hour: time.hour, minute: time.minute });
};

export default function () {
  const cronDelay = globalThis.ccv_config.reminders?.delay ?? 10;
  // Check for daily answer at 00:01
  Deno.cron(
    "Check for reminder to send troughout the day",
    { minute: { every: cronDelay } },
    async () => {
      if (Debug.get("perf_cron")) console.time("cron:reminders");
      const kv = await Deno.openKv(globalThis.ccv_config.kv?.basePath);
      try {
        const now = DateTime.now().setZone("utc");
        const nextCheck = now.plus({ minutes: cronDelay });

        const allSettings = await unique(kv, [KV_SETTINGS]);

        const usersToSendReminder: {
          user: string;
          notifications: NonNullable<Awaited<ReturnType<typeof getSettings>>["notifications"]>;
        }[] = [];

        for (const users of allSettings) {
          const userKey = (users as string[]).pop();
          if (!userKey) continue;
          const settings = await getSettings(userKey);
          if (settings?.notifications) {
            let sendNotification = false;
            const notifications = settings.notifications;

            const start = parseTimeToday(notifications.start);
            const end = parseTimeToday(notifications.end);

            if (start.isValid && start >= now && start < nextCheck) sendNotification = true;
            if (!sendNotification && end.isValid && end >= now && end < nextCheck) sendNotification = true;

            if (!sendNotification) continue;

            const hasAlreadyAnswered = await checkForDailyAnswer(userKey);

            if (hasAlreadyAnswered) continue;

            usersToSendReminder.push({ user: userKey, notifications: settings.notifications });
          }
        }

        if (Debug.get("cron")) console.log(`Found ${usersToSendReminder.length} users to send reminder`);

        // Send onesignal notifications (in bulk)
        const pushIds: string[] = usersToSendReminder.map(({ notifications: n }) => n.push ? n.onesignal_id : null)
          .filter((i) => typeof i === "string");
        const emailIds: string[] = usersToSendReminder.map(({ notifications: n }) => n.email ? n.onesignal_id : null)
          .filter((i) => typeof i === "string");
        if (pushIds.length > 0) NotificationService.sendPush({ event: "reminder", target: pushIds });
        if (emailIds.length > 0) NotificationService.sendEmail({ event: "reminder", target: emailIds });

        // Send discord webhook notifications
        const discordWebhooks: string[] = usersToSendReminder.map(({ notifications: n }) => n.discord_webhook).filter((i) => typeof i === "string");
        if (discordWebhooks.length > 0) NotificationService.sendDiscordWebhook({ event: 'reminder', target: discordWebhooks })

      } catch (error) {
        console.error("Error in cron reminders:", error);
      } finally {
        kv.close();
        if (Debug.get("perf_cron")) console.timeEnd("cron:reminders");
      }
    },
  );

  Deno.cron("Daily GCS backup", "15 0 * * *", backupDB);
}
