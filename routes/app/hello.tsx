import { RouteConfig } from "$fresh/server.ts";
import { getUserBySession } from "@utils/auth.ts";
import { DateTime } from "luxon";
import Button from "@islands/UI/Button.tsx";

export const config: RouteConfig = {
  skipInheritedLayouts: true,
};

export default async function Hello(req: Request) {
  const user = await getUserBySession(req, true);
  // if (user?.isAuthenticated) return Response.redirect(new URL("/app", req.url));

  const redirectTo = new URL(req.url).searchParams.get("redirectTo");
  if (redirectTo) return Response.redirect(new URL(redirectTo, req.url));

  return (
    <div class="max-w-2xl p-6 mx-auto relative h-screen flex flex-col justify-center  gap-4">
      <h1>Welcome to CCV !</h1>
      <p>
        CCV is a habits tracking app that aims for a simple, fast and minimalistic interface
      </p>
      <p>
        Create your first{" "}
        <Button class="btn w-fit h-fit py-0.5" spinnerProps={{ class: "loading-dots" }}>
          <a href="/app/config">configuration</a>
        </Button>{" "}
        and start tracking your habits.
      </p>
      <p>
        You are currently connected as a public user. All of your config and datas will only be available on this
        device, and will expire {DateTime.fromJSDate(user!.expires).setLocale("en").toRelative()}.
      </p>
      <p>
        <Button class="btn w-fit h-fit py-0.5" spinnerProps={{ class: "loading-dots" }}>
          <a href="/signin">Sign In</a>
        </Button>{" "}
        now to keep your current datas, and to sync your data across devices !
      </p>
    </div>
  );
}
