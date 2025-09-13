import { IAuthenticatedUser, IPublicUser, ISessionUser } from "@models/User.ts";
import { getCookies } from "@std/http/cookie";
import { getSessionId } from "../../plugins/kv_oauth.ts";
import { verifyData } from "../crypto/hash.ts";
import { Debug } from "../debug.ts";
import { getUserBySessionId } from "../session/index.ts";
import { getUser } from "./index.ts";
import { getPublicUser } from "./public.ts";

/** Checks that the current user is authorized and verified
 *
 * @param req The request to check
 * @returns True if the user is authorized
 */
export const isAuthorized = async (req: Request) => {
  const user = await getUserBySession(req);
  return !!user;
};

/** Checks if the current user is signed in but his session has expired.
 *
 * @param {Request} req The request to check
 * @returns {Promise<boolean>} True if the session is expired, false otherwise. Returns null if the user is not signed in.
 */
export const isSessionExpired = async (req: Request) => {
  const foundSession = await getSessionId(req);
  if (!foundSession) return null;
  const user = await getUserBySessionId(foundSession);
  return !user;
};

/** Get the user by the request session.
 *
 * @param {Request} req The HTTP request to get the user from
 * @param {boolean} getFullUser If true, the full user object is returned (with authenticated, email etc). If false only the public/session user is returned.
 * @returns {Promise<IAuthenticatedUser | ISessionUser | ReturnType<typeof getPublicUser> | null>} The user object, or null if not found.
 */
export async function getUserBySession(req: Request): Promise<ISessionUser | IPublicUser | null>;
export async function getUserBySession(
  req: Request,
  getFullUser: true,
): Promise<IAuthenticatedUser | IPublicUser | null>;
export async function getUserBySession(
  req: Request,
  getFullUser: false,
): Promise<ISessionUser | IPublicUser | null>;
export async function getUserBySession(
  req: Request,
  getFullUser: boolean = false,
): Promise<ISessionUser | IPublicUser | IAuthenticatedUser | null> {
  const foundSession = await getSessionId(req);
  const user = foundSession ? await getUserBySessionId(foundSession) : getPublicUser(req);

  if (!user) {
    if (Debug.get("user")) {
      console.warn("getUserBySession - User not found", {
        foundSession,
        cookies: getCookies(req.headers),
        reqInfos: {
          url: req.url,
          method: req.method,
          headers: Object.fromEntries(req.headers.entries()),
        },
      });
    }
    return null;
  }
  const isUserValid = await verifyData(user.id, user.token);
  if (!isUserValid) {
    console.warn("getUserBySession - User token is invalid", user.id);
    return null;
  }

  if (!foundSession) return user as IPublicUser;

  // Public user
  if (getFullUser) {
    const fetch = await getUser(user);
    return fetch as IAuthenticatedUser;
  } else {
    return { ...user, isAuthenticated: true } as ISessionUser;
  }
}

/** Get a redirect response to the hello page.
 *
 * @param {string} redirectTo The redirect URL to append to the hello page. If provided, the hello page is just a bridge to
 * the redirect URL. Else fully display the hello page.
 * @param {Response} response The response to append the hello page redirect to. If not provided, a new response is created.
 * @returns The redirect response
 */
export const getHelloPageRedirect = (redirectTo?: string, response?: Response): Response => {
  const headers = new Headers(response?.headers);
  headers.set("Location", `/app/hello${redirectTo ? `?redirectTo=${redirectTo}` : ""}`);

  return new Response(response?.body ?? "", {
    status: 303,
    headers,
  });
};
