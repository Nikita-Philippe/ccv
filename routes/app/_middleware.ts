import { FreshContext } from "$fresh/server.ts";
import { getCookies, setCookie } from "@std/http/cookie";
import { getUserBySession } from "@utils/user/auth.ts";
import { ONESIGNAL_EXTERNAL_ID } from "@utils/constants.ts";
import { NotificationService } from "@utils/notifications.ts";
import { getSettings, setSettings } from "@utils/settings.ts";
import { DateTime } from "luxon";

// List of 'normal' where user is expected to be signed in
const normalRoutes = [
  "/app/config",
  "/app",
  "/app/settings",
  "/app/stats",
];

export async function handler(req: Request, ctx: FreshContext) {
  const { url } = req;
  const route = new URL(url).pathname;

  // On page access, check that user settings are synced with OneSignal.
  if (ctx.destination === "route" && normalRoutes.includes(route) && !getCookies(req.headers)[ONESIGNAL_EXTERNAL_ID]) {
    const user = await getUserBySession(req);
    if (user?.isAuthenticated) {
      const settings = await getSettings(user);

      const userExists = await NotificationService.checkOnesignalUser(settings);

      // If user does not exist, remove the onesignal_id from settings (to "sync" with OneSignal).
      if (userExists === false) {
        console.error(`User with ID ${user.id} does not exist in OneSignal. Removing onesignal_id from settings.`);
        await setSettings(user, { notifications: { onesignal_id: undefined, push: undefined, email: undefined } });
      }
    }
  }

  // Invoke resp now as we do not need to do anything prior
  const resp = await ctx.next();

  if (ctx.destination === "route" && normalRoutes.includes(route)) {
    const user = await getUserBySession(req);

    /** If user is signedin and has a onesignal id, set it in the cookie.
     *
     * This is used to log in user at onesignal init script, making user able to receive notifications. */
    if (user?.isAuthenticated) {
      const settings = await getSettings(user);

      if (settings.notifications?.onesignal_id && !getCookies(req.headers)[ONESIGNAL_EXTERNAL_ID]) {
        setCookie(resp.headers, {
          name: ONESIGNAL_EXTERNAL_ID,
          value: settings.notifications.onesignal_id,
          path: "/",
          httpOnly: true,
          expires: DateTime.now().plus({ weeks: 1 }).toJSDate(),
        });
      }
    }
  }

  return resp;
}
