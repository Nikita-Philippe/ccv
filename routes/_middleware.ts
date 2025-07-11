import { FreshContext } from "$fresh/server.ts";
import { setCookie } from "@std/http/cookie";
import { createPublicUser, getHelloPageRedirect, isAuthorized, isSessionExpired } from "@utils/auth.ts";
import { PUBLIC_USER_ID } from "@utils/constants.ts";
import { Debug } from "@utils/debug.ts";

// List of routes to not check for user authorization
const authorizedRoutes = [
  "/",
  "/app/recover",
  "/signin",
  "/callback",
  "/signout",
];

const methodColors: Record<string, string> = {
  GET: "green",
  POST: "blue",
  PUT: "orange",
  DELETE: "red",
  PATCH: "purple",
  OPTIONS: "gray",
};

export async function handler(req: Request, ctx: FreshContext) {
  const hitTime = new Date();

  const { url } = req;
  const route = new URL(url).pathname;

  if (Debug.get("http") || ctx.destination === "route") {
    const color = methodColors[req.method] || "black";
    console.log(`%c${req.method} (${ctx.destination}) ${req.url}`, `color: ${color}`);
    if (Debug.get("http") && ctx.destination === "route") {
      console.log("Debug request info:", {
        headers: Object.fromEntries(req.headers.entries()),
        state: ctx.state,
        data: ctx.data,
        error: ctx.error,
        hitTime: hitTime.toISOString(),
      });
    }
  }

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
      if (Debug.get("user")) console.log("Creating public user", newUser.id);

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

  const res = await ctx.next();

  if (Debug.get("http") && ctx.destination === "route") {
    console.log("Debug request info - AFTER:", {
      headers: Object.fromEntries(req.headers.entries()),
      state: ctx.state,
      data: ctx.data,
      error: ctx.error,
      hitTime: new Date().toISOString(),
    });
  }

  if (Debug.get("perf_http") && ctx.destination === "route") {
    const duration = new Date().getTime() - hitTime.getTime();
    console.log(`%cHTTP request to %c${route} %ctook %c${duration}ms`, 
      "color: white", 
      `color: cyan; font-weight: bold`,
      "color: white", 
      `color: orange; font-weight: bold`,
    );
  }

  return res;
}
