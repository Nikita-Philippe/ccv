import { FreshContext } from "$fresh/server.ts";
import { setCookie } from "$std/http/cookie.ts";
import { createPublicUser, getHelloPageRedirect, getUserBySession } from "@utils/auth.ts";
import { PUBLIC_USER_ID } from "@utils/constants.ts";
import { DateTime } from "luxon";

// List of routes to not check for user authorization
const authorizedRoutes = [
  "/styles.css",
  "/favicon.ico",
];

export async function handler(req: Request, ctx: FreshContext) {
  const { url } = req;
  const route = new URL(url).pathname;

  if (!authorizedRoutes.includes(route)) {
    const user = await getUserBySession({ req });

    // If no user (or bad id), create a public user and redirect to "hello" page
    if (!user) {
      const resp = getHelloPageRedirect();

      const newUser = await createPublicUser();
      console.log("Creating public user", newUser.id);

      const expires = DateTime.now().plus({ days: 7 }).toJSDate();
      setCookie(resp.headers, {
        name: PUBLIC_USER_ID,
        value: encodeURIComponent(JSON.stringify({ ...newUser, expires })),
        path: "/",
        httpOnly: true,
        expires,
      });

      return resp;
    }
  }

  return await ctx.next();
}
