import { FreshContext } from "$fresh/server.ts";
import { setCookie } from "@std/http/cookie";
import { createPublicUser, getHelloPageRedirect, isAuthorized, isSessionExpired } from "@utils/auth.ts";
import { PUBLIC_USER_ID } from "@utils/constants.ts";

// List of routes to not check for user authorization
const authorizedRoutes = [
  "/",
  "/app/recover",
  "/signin",
  "/callback",
  "/signout",
];

export async function handler(req: Request, ctx: FreshContext) {
  const { url } = req;
  const route = new URL(url).pathname;

  if (ctx.destination === "route" && !authorizedRoutes.includes(route)) {
    // If no user (or bad id), create a public user and redirect to "hello" page
    if (!await isAuthorized(req)) {
      // API route just returns 401 Unauthorized
      if (route.startsWith("/api")) return new Response("Unauthorized", { status: 401 });

      // Had a session, but expired or invalid. Redirect to signin
      if (await isSessionExpired(req)) {
        // Do NOT reuse headers, to wipe existing cookies
        return new Response("", {
          status: 301,
          headers: {
            Location: `/signin?redirectTo=${encodeURIComponent(route)}`,
          },
        });
      }

      const response = getHelloPageRedirect();

      const newUser = await createPublicUser();
      console.log("Creating public user", newUser.id);

      setCookie(response.headers, {
        name: PUBLIC_USER_ID,
        value: encodeURIComponent(JSON.stringify(newUser)),
        path: "/",
        httpOnly: true,
        expires: newUser.expires,
      });

      return response;
    }
  }

  return await ctx.next();
}
