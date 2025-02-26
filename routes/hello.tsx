import { RouteConfig } from "$fresh/server.ts";
import { getPublicUser } from "@utils/auth.ts";
import { DateTime } from "luxon";

export const config: RouteConfig = {
  skipInheritedLayouts: true,
};

// deno-lint-ignore require-await
export default async function Hello(req: Request) {
  const publicSession = getPublicUser(req);

  if (!publicSession) {
    return new Response("", {
      status: 303,
      headers: {
        Location: `/404?error=${
          encodeURIComponent("An unexpected error occured... Please try to access page again.")
        }&redirectTo=/hello`,
      },
    });
  }

  return (
    <div class="max-w-2xl p-6 mx-auto relative h-screen flex flex-col justify-center  gap-4">
      <h1>Welcome to CCV !</h1>
      <p>
        CCV is a habits tracking app that aims for a simple, fast and minimalistic interface
      </p>
      <p>
        Create your first{" "}
        <button class={"btn w-fit h-fit py-0.5"}>
          <a href="/config">configuration</a>
        </button>{" "}
        and start tracking your habits.
      </p>
      <p>
        You are currently connected as a public user. All of your config and datas will only be available on this
        device, and will expire {DateTime.fromISO(publicSession!.expires).setLocale("en").toRelative()}.
      </p>
      <p>
        <button class={"btn w-fit h-fit py-0.5"}>
          <a href="/signin">Sign In</a>
        </button>{" "}
        now to keep your current datas, and to sync your data across devices !
      </p>
    </div>
  );
}
