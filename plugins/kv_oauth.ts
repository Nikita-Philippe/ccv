import type { Plugin } from "$fresh/server.ts";
import { PartialBy } from "@models/Common.ts";
import { IAuthenticatedUser, IGoogleUser } from "@models/User.ts";
import { cleanupPublicUser, getHelloPageRedirect } from "@utils/auth.ts";
import { createUserRecoveryKey } from "@utils/crypto.ts";
import { fetchSignedInUser, requestTransaction } from "@utils/database.ts";
import { deleteUserBySession } from "@utils/user.ts";
import { createGoogleOAuthConfig, createHelpers } from "jsr:@deno/kv-oauth";
import ky from "ky";
import { NotificationService, userCreatedTemplate } from "@utils/notifications.ts";

const { signIn, handleCallback, signOut, getSessionId: defaultGetSessionId } = createHelpers(
  createGoogleOAuthConfig({
    redirectUri: Deno.env.get("OAUTH_REDIRECTURI") ?? "http://localhost:3000/callback",
    scope: Deno.env.get("GOOGLE_OAUTH_SCOPE") || "email openid profile",
  }),
);

export const getSessionId = defaultGetSessionId;

/** Simple Google OAuth plugin, utilizing deno/kv-oauth
 *
 * @example fresh.config.ts
 * ```
 * import kv_oauth from "./plugins/kv_oauth.ts";
 *
 * export default defineConfig({
 *   plugins: [kv_oauth],
 * ```
 */
export default {
  name: "kv-oauth",
  routes: [
    {
      path: "/signin",
      async handler(req) {
        // Cleanup the session if it exists
        const sessionId = await getSessionId(req);
        if (sessionId) await deleteUserBySession(sessionId);
        return await signIn(req);
      },
    },
    {
      path: "/callback",
      async handler(req) {
        try {
          const allSearchParams = Object.fromEntries(new URL(req.url).searchParams.entries());

          // Simple debug log
          if (allSearchParams.error) {
            console.error("Error in callback", {
              error: allSearchParams.error,
              code: allSearchParams.code,
              state: allSearchParams.state,
              headers: req.headers,
            });
          }

          // If no code in the query params, redirect to hello page
          if (!allSearchParams.code || !allSearchParams.state || allSearchParams.error) {
            throw new Error("Query missing params");
          }

          const { response, tokens, sessionId } = await handleCallback(req);

          const googleUser = await ky<IGoogleUser | null>("https://www.googleapis.com/oauth2/v1/userinfo", {
            headers: {
              Authorization: `Bearer ${tokens.accessToken}`,
            },
          }).json();

          // If no user, redirect to hello page to create a public user
          if (!googleUser) throw new Error(`No google user found for token "${tokens.accessToken}"`);

          const user = await fetchSignedInUser(googleUser);

          if (!user) {
            const recoveryKey = await createUserRecoveryKey(googleUser);

            const userInit: PartialBy<IAuthenticatedUser, "token"> = {
              id: googleUser.id,
              name: googleUser.name,
              email: googleUser.email,
              sessionId,
              isAuthenticated: true,
            };
            await requestTransaction(req, { action: "createUser", args: [userInit] });

            NotificationService.sendAdminEmail({ event: "user_update", email: userCreatedTemplate(googleUser.name) });

            response.headers.set("Location", encodeURI(`/app/firstConnexion?recovery=${recoveryKey}`));
          } else {
            await requestTransaction(req, { action: "setUserSession", args: [user, { sessionId }] });
          }

          // Return response cleanup of the public user, with migrated datas if applicable
          return await cleanupPublicUser(req, response, !user ? googleUser.id : undefined);
        } catch (e) {
          console.error("Error in callback", e);
          return getHelloPageRedirect("/app");
        }
      },
    },
    {
      path: "/signout",
      async handler(req) {
        const sessionId = await getSessionId(req);
        if (sessionId) await deleteUserBySession(sessionId);
        return await signOut(req);
      },
    },
  ],
} as Plugin;
