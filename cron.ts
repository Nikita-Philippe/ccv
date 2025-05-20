import { unique } from "@kitsonk/kv-toolbox/keys";
import { KV_SETTINGS } from "@utils/constants.ts";
import { enqueueReminder, IReminder, RemindType } from "@utils/reminder.ts";
import { getSettings } from "@utils/settings.ts";

export default function () {
  // Check for daily answer at 00:01
  Deno.cron("Check for reminder to send troughout the day", "0 1 * * *", async () => {
    console.log("Checking for daily answer");

    const kv = await Deno.openKv();

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

    kv.close();
  });
}
