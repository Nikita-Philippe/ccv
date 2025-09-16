import { Handlers } from "$fresh/server.ts";
import Card from "@components/UI/Card.tsx";
import ExportButtons from "@islands/Settings/ExportButtons.tsx";
import ImportButton from "@islands/Settings/ImportButton.tsx";
import Button from "@islands/UI/Button.tsx";
import LongPressButton from "@islands/UI/LongPressButton.tsx";
import PushButton from "@islands/UI/NotificationsOptButtons.tsx";
import { IDefaultPageHandler } from "@models/App.ts";
import { getContent } from "@utils/content.ts";
import { NotificationService } from "@utils/notifications.ts";
import { getSettings, setSettings } from "@utils/settings.ts";
import { getHelloPageRedirect, getUserBySession } from "@utils/user/auth.ts";
import { wipeUser } from "@utils/user/index.ts";
import { getPublicUser } from "@utils/user/public.ts";
import { DateTime } from "luxon";

export const handler: Handlers<IDefaultPageHandler> = {
  async POST(req, ctx) {
    const form = await req.formData();

    const { action, settings, ...restForm } = Object.fromEntries(form);

    if (action === "delete_account") {
      const user = await getUserBySession(req, true);
      if (!user?.isAuthenticated) return await ctx.render();
      await wipeUser(user);
      return new Response(null, { status: 303, headers: { Location: "/signout" } });
    }

    // Updating settings
    if (settings) {
      const user = await getUserBySession(req, true);
      if (!user?.isAuthenticated) return await ctx.render();

      // Verify data before processing them
      switch (settings) {
        case "notifications": {
          const { reminder_start, reminder_end } = restForm as Record<string, string>;

          const hasStart = typeof reminder_start === "string" && reminder_start.trim() !== "";
          const hasEnd = typeof reminder_end === "string" && reminder_end.trim() !== "";

          const start = hasStart ? DateTime.fromFormat(reminder_start, "HH:mm", { zone: "utc" }) : null;
          const end = hasEnd ? DateTime.fromFormat(reminder_end, "HH:mm", { zone: "utc" }) : null;

          if ((hasStart && !start!.isValid) || (hasEnd && !end!.isValid)) {
            return await ctx.render({ message: { type: "error", message: "Time format are invalid" } });
          }
          if (hasStart && start!.hour === 0 && start!.minute < 10) {
            return await ctx.render({ message: { type: "error", message: "Start time must be after 00:10" } });
          }
          if (hasEnd && end!.hour === 23 && end!.minute > 50) {
            return await ctx.render({ message: { type: "error", message: "End time must be before 23:50" } });
          }
          if (hasStart && hasEnd && start! > end!) {
            return await ctx.render({ message: { type: "error", message: "Start time must be before end time" } });
          }
          break;
        }
        default:
          break;
      }

      await setSettings(user, {
        notifications: {
          start: restForm.reminder_start as string,
          end: restForm.reminder_end as string,
          discord_webhook: restForm.notif_discord_webhook as string,
        },
      });

      return await ctx.render({ message: { type: "success", message: "Settings updated" } });
    }

    return await ctx.render();
  },
};

export default async function Settings(req: Request) {
  const user = await getUserBySession(req, true);
  if (!user) return getHelloPageRedirect(req.url);

  const content = await getContent(req);

  const publicSession = getPublicUser(req);

  const isSignedIn = user.isAuthenticated;

  const userSettings = isSignedIn ? await getSettings(user) : null;

  const appVersion = Deno.env.get("APP_VERSION") || "local";
  const denoVersion = Deno.version.deno ? ` - Deno ${Deno.version.deno}` : "";
  const deployVersion = Deno.env.get("DENO_DEPLOY") === "1"
    ? ` - Deploy ${Deno.env.get("DENO_DEPLOY_APP_ID")}/${Deno.env.get("DENO_DEPLOY_REVISION_ID")}`
    : "";

  return (
    <div className="flex flex-col gap-4">
      {(isSignedIn && content) && (
        <>
          <ExportButtons content={content} />
          <ImportButton />
        </>
      )}
      <Card title="Sync" sx={{ content: "p-4 flex-col no-wrap relative" }}>
        {isSignedIn
          ? (
            <>
              <p>Welcome back {user.name} !</p>
              <p>Your datas are currently synced.</p>
              <p>Your are signed in using Google with {user.email}.</p>
              <a href="/signout?success_url=/app/settings">
                <Button class="btn w-fit h-fit py-0.5" spinnerProps={{ class: "loading-dots" }}>
                  Sign Out
                </Button>
              </a>
            </>
          )
          : (
            <>
              <p>Your are currently not logged in.</p>
              <p>
                As a public user, your <a className="link" href="/app/config">configuration</a>{" "}
                and daily entries will expire {publicSession!.expires.setLocale("en").toRelative()}.
              </p>
              <p>
                <a href="/signin">
                  <Button class="btn w-fit h-fit py-0.5" spinnerProps={{ class: "loading-dots" }}>
                    Sign In
                  </Button>
                </a>{" "}
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
              Please allow for +/- {globalThis.ccv_config.reminders.delay ?? 10}{" "}
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
              {NotificationService.enabled() && <PushButton user={user} settings={userSettings} />}
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
        title="Danger zone"
        sx={{ content: "border-2 border-error border-dashed p-4 flex-col no-wrap relative", title: "text-error" }}
      >
        <Card sx={{ content: "p-4 flex-col no-wrap" }}>
          <p>If you lost access to your account, recover your daily entries and your configs using the recovery key.</p>
          <a href="/app/recover">
            <Button class="btn w-fit" spinnerProps={{ class: "loading-dots" }}>
              Recover account
            </Button>
          </a>
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
                <span>Delete account</span>
              </LongPressButton>
            </div>
          </Card>
        )}
      </Card>

      <p className="absolute bottom-0 right-0 text-xs text-gray-500">
        Version: {appVersion}
        {denoVersion}
        {deployVersion}
      </p>
    </div>
  );
}
