import { Handlers } from "$fresh/server.ts";
import ExportButtons from "@islands/Settings/ExportButtons.tsx";
import Card from "@islands/UI/Card.tsx";
import LongPressButton from "@islands/UI/LongPressButton.tsx";
import { getHelloPageRedirect, getPublicUser, getUserBySession } from "@utils/auth.ts";
import { requestTransaction, wipeUser } from "@utils/database.ts";
import { DateTime } from "luxon";

export const handler: Handlers<null> = {
  async POST(req, ctx) {
    const form = await req.formData();

    const { action, ..._ } = Object.fromEntries(form);

    if (action === "delete_account") {
      const user = await getUserBySession(req, true);
      if (!user?.isAuthenticated) return await ctx.render();
      await wipeUser(user);
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

  return (
    <div className="flex flex-col gap-4">
      {content && <ExportButtons content={content} />}
      <Card title={"Sync"} sx={{ content: "p-4 flex-col no-wrap relative" }}>
        {isSignedIn
          ? (
            <>
              <p>Welcome back {user.name} !</p>
              <p>Your datas are currently synced.</p>
              <p>Your are signed in using Google with {user.email}.</p>
              <button class={"btn w-fit h-fit py-0.5"}>
                <a href="/signout?success_url=/app/settings">Sign Out</a>
              </button>
            </>
          )
          : (
            <>
              <p>Your are currently not logged in.</p>
              <p>
                As a public user, your <a className={"link"} href="/app/config">configuration</a>{" "}
                and daily entries will expire {DateTime.fromJSDate(publicSession!.expires).setLocale("en").toRelative()}.
              </p>
              <p>
                <button class={"btn w-fit h-fit py-0.5"}>
                  <a href="/signin">Sign In</a>
                </button>{" "}
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
      <Card
        title={"Danger zone"}
        sx={{ content: "border-2 border-error border-dashed p-4 flex-col no-wrap relative", title: "text-error" }}
      >
        <Card sx={{ content: "p-4 flex-col no-wrap" }}>
          <p>If you lost access to your account, recover your daily entries and your configs using the recovery key.</p>
          <button class={"btn w-fit"}>
            <a href="/app/recover">
              Recover account
            </a>
          </button>
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
    </div>
  );
}
