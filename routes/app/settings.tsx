import { Handlers } from "$fresh/server.ts";
import ExportButtons from "@islands/Settings/ExportButtons.tsx";
import Card from "@islands/UI/Card.tsx";
import LongPressButton from "@islands/UI/LongPressButton.tsx";
import { getHelloPageRedirect, getPublicUser, getUserBySession } from "@utils/auth.ts";
import { requestTransaction, wipeUser } from "@utils/database.ts";
import { DateTime } from "luxon";
import { IDefaultPageHandler, ISettings } from "@models/App.ts";
import { getSettings, setSettings } from "@utils/settings.ts";
import ImportButton from "@islands/Settings/ImportButton.tsx";
import PushButton from "@islands/UI/NotificationsOptButtons.tsx";
import Button from "@islands/UI/Button.tsx";

export const handler: Handlers<IDefaultPageHandler> = {
  async POST(req, ctx) {
    const form = await req.formData();

    const { action, settings, ...restForm } = Object.fromEntries(form);

    if (action === "delete_account") {
      const user = await getUserBySession(req, true);
      if (!user?.isAuthenticated) return await ctx.render();
      await wipeUser(user);
    }

    // Updating settings
    if (settings) {
      const user = await getUserBySession(req, true);
      if (!user?.isAuthenticated) return await ctx.render();

      const userSettings = await getSettings(user.id);

      // Verify data before processing them
      switch (settings) {
        case "notifications": {
          const { reminder_start, reminder_end, notif_discord_webhook } = restForm;
          const start = DateTime.fromFormat(reminder_start as string, "HH:mm", { zone: "utc" });
          const end = DateTime.fromFormat(reminder_end as string, "HH:mm", { zone: "utc" });
          if (!start.isValid || !end.isValid) return await ctx.render({ message: { type: "error", message: "Time format are invalid" } });
          if (start.hour === 0 && start.minute < 10) {
            return await ctx.render({ message: { type: "error", message: "Start time must be after 00:10" } });
          }
          if (end.hour === 23 && end.minute > 50) return await ctx.render({ message: { type: "error", message: "End time must be before 23:50" } });
          if (start > end) return await ctx.render({ message: { type: "error", message: "Start time must be before end time" } });
          if (!userSettings?.notifications?.discord_webhook && !notif_discord_webhook) {
            return await ctx.render({ message: { type: "error", message: "Please provide a notification method" } });
          }
          break;
        }
        default:
          break;
      }

      await setSettings(user.id, settings as keyof ISettings, {
        start: restForm.reminder_start as string,
        end: restForm.reminder_end as string,
        discord_webhook: restForm.notif_discord_webhook as string,
      });

      return await ctx.render({ message: { type: "success", message: "Settings updated" } });
    }

    return await ctx.render();
  },
};

export default async function Settings(req: Request) {
  const user = await getUserBySession(req, true);
  if (!user) return getHelloPageRedirect(req.url);

  const content = await requestTransaction(req, { action: "getContent" });

  const publicSession = getPublicUser(req);

  const isSignedIn = user.isAuthenticated;

  const userSettings = isSignedIn ? await getSettings(user.id) : null;

  return (
    <div className="flex flex-col gap-4">
      {content && (
        <>
          <ExportButtons content={content} />
          <ImportButton />
        </>
      )}
      <Card title={"Sync"} sx={{ content: "p-4 flex-col no-wrap relative" }}>
        {isSignedIn
          ? (
            <>
              <p>Welcome back {user.name} !</p>
              <p>Your datas are currently synced.</p>
              <p>Your are signed in using Google with {user.email}.</p>
              <Button class="btn w-fit h-fit py-0.5" spinnerProps={{ class: "loading-dots" }}>
                <a href="/signout?success_url=/app/settings">Sign Out</a>
              </Button>
            </>
          )
          : (
            <>
              <p>Your are currently not logged in.</p>
              <p>
                As a public user, your <a className={"link"} href="/app/config">configuration</a>{" "}
                and daily entries will expire{" "}
                {DateTime.fromJSDate(publicSession!.expires).setLocale("en").toRelative()}.
              </p>
              <p>
                <Button class="btn w-fit h-fit py-0.5" spinnerProps={{ class: "loading-dots" }}>
                  <a href="/signin">Sign In</a>
                </Button>{" "}
                to keep your current datas, and to sync your data across devices !
              </p>
              {content?.id && (
                <div className="alert alert-soft w-full flex flex-col gap-2 items-start">
                  <p>If you have any configs, don't worry ! Your datas will be safely migrated to your new account.</p>
                  <div className="alert alert-info w-full flex flex-col gap-2 items-start">
                    <p>
                      Please note that connecting to an already signed in account will delete your current public
                      account and all its datas.
                    </p>
                    <p>Make sure to export your datas before signing if you made changes while signed out.</p>
                  </div>
                </div>
              )}
            </>
          )}
      </Card>
      {isSignedIn && (
        <Card title="Notifications" sx={{ content: "p-4 flex-col no-wrap" }}>
          <p>Each day, you can configure up to two notifications, sent to remind you to fill your daily entry !</p>
          <div className="alert alert-info">
            <p className="italic">
              Please allow for +/- {Deno.env.get("CRON_REMINDERS_DELAY") ?? 10}{" "}
              minutes of variation. Notifications will only be sent if no entry has been filled at the time.
            </p>
          </div>
          <form method="POST">
            <div className="flex flex-col items-center gap-1 mb-2">
              <div className="w-full flex items-start gap-2">
                <input type="hidden" name="settings" value="notifications" />
                <fieldset class="fieldset grow max-w-40">
                  <legend class="fieldset-legend">First reminder</legend>
                  <input
                    type="time"
                    class="input"
                    name="reminder_start"
                    defaultValue={userSettings?.notifications?.start}
                  />
                </fieldset>
                <fieldset class="fieldset grow max-w-40">
                  <legend class="fieldset-legend">Last reminder</legend>
                  <input
                    type="time"
                    class="input"
                    name="reminder_end"
                    defaultValue={userSettings?.notifications?.end}
                  />
                </fieldset>
              </div>
              {(userSettings?.notifications?.start || userSettings?.notifications?.end) && (
                <p className="text-sm text-gray-500 italic">
                  You will receive a notification (if no entry has been filled) everyday at{" "}
                  {userSettings?.notifications?.start} UTC and {userSettings?.notifications?.end} UTC.
                </p>
              )}
            </div>
            <Card title="Methods" sx={{ content: "p-4 flex-col no-wrap" }}>
              <PushButton user={user} settings={userSettings} />
              <fieldset class="fieldset">
                <legend class="fieldset-legend pt-0">Discord webhook</legend>
                <input
                  type="text"
                  name="notif_discord_webhook"
                  class="input"
                  placeholder="Discord webhook URL"
                  defaultValue={userSettings?.notifications?.discord_webhook}
                />
                <p class="fieldset-label">
                  Webhook are server based notification.{" "}
                  <a
                    className="link"
                    href="https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks"
                    target="_blank"
                  >
                    Learn more
                  </a>
                </p>
              </fieldset>
            </Card>
            <Button class="btn w-fit mt-2" type="submit">
              Save notifications settings
            </Button>
          </form>
        </Card>
      )}
      <Card
        title={"Danger zone"}
        sx={{ content: "border-2 border-error border-dashed p-4 flex-col no-wrap relative", title: "text-error" }}
      >
        <Card sx={{ content: "p-4 flex-col no-wrap" }}>
          <p>If you lost access to your account, recover your daily entries and your configs using the recovery key.</p>
          <Button class="btn w-fit" spinnerProps={{ class: "loading-dots" }}>
            <a href="/app/recover">
              Recover account
            </a>
          </Button>
        </Card>
        {user.isAuthenticated && (
          <Card sx={{ content: "p-4 flex-col no-wrap" }}>
            <p>
              Delete your account and all your data. This action is irreversible.
            </p>
            <div role="alert" className="alert alert-error alert-soft w-full">
              <p>
                I understand that this operation is destructive. After deletion, my account and all associated datas
                will be unrecoverable.
              </p>
              <form method="POST" id="delete_form" className="hidden">
                <input type="hidden" name="action" value="delete_account" />
              </form>
              <LongPressButton
                className="btn-error w-fit whitespace-nowrap"
                pressDuration={2000}
                formId="delete_form"
              >
                <>Delete account</>
              </LongPressButton>
            </div>
          </Card>
        )}
      </Card>

      <p className="absolute bottom-0 right-0 text-xs text-gray-500">
        APP Version: {Deno.env.get("DENO_DEPLOYMENT_ID") || "local"} - Deno Version: {Deno.version.deno}
      </p>
    </div>
  );
}
