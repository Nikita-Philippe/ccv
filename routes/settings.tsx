import ExportButtons from "@islands/Settings/ExportButtons.tsx";
import Card from "@islands/UI/Card.tsx";
import { getHelloPageRedirect, getPublicUser, getUserBySession } from "@utils/auth.ts";
import { DateTime } from "luxon";
import { getContent } from "../utils/content.ts";

export default async function Settings(req: Request) {
  const user = await getUserBySession({ req });
  if (!user) return getHelloPageRedirect(req.url);

  const content = await getContent({ user });

  const publicSession = getPublicUser(req);

  const isSignedIn = user.isAuthenticated && !publicSession;

  // TODO: continue page, if connected/no content, etc..

  return (
    <div>
      {content && <ExportButtons content={content} />}
      <Card title={"Sync"} sx={{ content: "p-4 flex-col no-wrap relative" }}>
        {isSignedIn
          ? (
            <>
              <p>Welcome back {user.name} !</p>
              <p>Your datas are currently synced.</p>
              <p>Your are signed in using Google with {user.email}.</p>
              <button class={"btn w-fit h-fit py-0.5"}>
                <a href="/signout?success_url=/settings">Sign Out</a>
              </button>
            </>
          )
          : (
            <>
              <p>Your are currently not logged in.</p>
              <p>
                As a public user, your <a className={"link"} href="/config">configuration</a>{" "}
                and daily entries will expire {DateTime.fromISO(publicSession!.expires).setLocale("en").toRelative()}.
              </p>
              <p>
                <button class={"btn w-fit h-fit py-0.5"}>
                  <a href="/signin">Sign In</a>
                </button>{" "}
                to keep your current datas, and to sync your data across devices !
              </p>
              {/* <p className={"w-full text-right text-sm italic opacity-50"}>Your assigned user id: {user.id}</p> */}
            </>
          )}
      </Card>
    </div>
  );
}
