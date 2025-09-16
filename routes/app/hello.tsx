import { RouteConfig } from "$fresh/server.ts";
import { getUserBySession } from "@utils/user/auth.ts";
import { DateTime } from "luxon";
import Button from "@islands/UI/Button.tsx";

export const config: RouteConfig = {
  skipInheritedLayouts: true,
};

export default async function Hello(req: Request) {
  const user = await getUserBySession(req, true);
  if (user?.isAuthenticated) return Response.redirect(new URL("/app", req.url));

  const redirectTo = new URL(req.url).searchParams.get("redirectTo");
  if (redirectTo) return Response.redirect(new URL(redirectTo, req.url));

  return (
    <div class="max-w-2xl p-6 mx-auto relative h-screen flex flex-col justify-center  gap-4">
      <h1 class="inline-flex">
        Welcome to <img id="header_logo_first" class="max-h-6 w-auto" src="/logo/logo.svg" alt="CCV" /> !
      </h1>
      <p>
        CCV is a simple, data-focused, free and privacy-first habits tracker.{" "}
        <a class="link text-sm italic" href="/#features" target="_blank">Learn more</a>
      </p>
      <p>
        Create - or pick from a template - your first{" "}
        <a href="/app/config">
          <Button class="btn w-fit h-fit py-0.5" spinnerProps={{ class: "loading-dots" }}>
            configuration
          </Button>
        </a>{"  "}
        and start tracking your habits.
      </p>
      <p>
        You’re currently using a public session. Your configuration and data are stored on this device only and will
        expire {DateTime.fromJSDate(user!.expires).setLocale("en").toRelative()}.
      </p>
      <p>
        <a href="/signin">
          <Button class="btn w-fit h-fit py-0.5" spinnerProps={{ class: "loading-dots" }}>
            Sign In
          </Button>
        </a>{" "}
        now to keep your current data and sync across devices !
      </p>
    </div>
  );
}
