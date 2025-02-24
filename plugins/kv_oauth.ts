import type { Plugin } from "$fresh/server.ts";
import { PartialBy } from "@models/Common.ts";
import { IAuthenticatedUser, IGoogleUser } from "@models/User.ts";
import { getHelloPageRedirect } from "@utils/auth.ts";
import { createUser, deleteUserBySession, getUserById, setUserSession } from "@utils/user.ts";
import { createGoogleOAuthConfig, createHelpers } from "jsr:@deno/kv-oauth";
import ky from "ky";

const { signIn, handleCallback, signOut, getSessionId: defaultGetSessionId } = createHelpers(
  createGoogleOAuthConfig({
    redirectUri: Deno.env.get("OAUTH_REDIRECTURI") || "http://localhost:3000/callback",
    scope: Deno.env.get("GOOGLE_OAUTH_SCOPE") || "email",
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
        return await signIn(req);
      },
    },
    {
      path: "/callback",
      async handler(req) {
        const { response, tokens, sessionId } = await handleCallback(req);

        const googleUser = await ky<IGoogleUser | null>("https://www.googleapis.com/oauth2/v1/userinfo", {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        }).json();

        // If no user, redirect to hello page to create a public user
        if (!googleUser) return getHelloPageRedirect();

        const user = await getUserById(googleUser.id.toString());
        if (!user) {
          const userInit: PartialBy<IAuthenticatedUser, "token"> = {
            id: googleUser.id,
            name: googleUser.name,
            email: googleUser.email,
            sessionId,
            isAuthenticated: true,
          };
          await createUser(userInit);
        } else {
          await setUserSession(user, sessionId);
        }

        return response;
      },
    },
    {
      path: "/signout",
      async handler(req) {
        const sessionId = await getSessionId(req);
        if (sessionId) {
          await deleteUserBySession(sessionId);
        }
        return await signOut(req);
      },
    },
  ],
} as Plugin;
