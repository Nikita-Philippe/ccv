import { deleteCookie, getCookies, setCookie } from "@std/http/cookie";
import { PartialBy } from "@models/Common.ts";
import { IAuthenticatedUser, IPublicUser, ISessionUser } from "@models/User.ts";
import { PUBLIC_USER_ID } from "@utils/constants.ts";
import { signData, verifyData } from "@utils/crypto.ts";
import { openUserKv, requestTransaction } from "@utils/database.ts";
import { getUserBySessionId } from "@utils/user.ts";
import { OAUTH_COOKIE_NAME, SITE_COOKIE_NAME } from "https://jsr.io/@deno/kv-oauth/0.11.0/lib/_http.ts";
import { getSessionId } from "../plugins/kv_oauth.ts";
import { getDailyEntryKey } from "@utils/common.ts";
import { DateTime } from "luxon";
import { setContent } from "@utils/content.ts";
import { saveEntries } from "@utils/entries.ts";

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

/** Get the user by the session id
 *
 * Prefer to provide the Request, as the sessionId is solely used for signed-in users.
 *
 * @param {Request} req The HTTP request to get the user from
 * @param {boolean} getFullUser If true, the full user object is returned (with authenticated, email etc). If false only the public/session user is returned.
 * @returns {Promise<IAuthenticatedUser | ISessionUser | ReturnType<typeof getPublicUser> | null>} The user object, or null if not found.
 */
export async function getUserBySession(req: Request): Promise<ISessionUser | ReturnType<typeof getPublicUser> | null>;
export async function getUserBySession(
  req: Request,
  getFullUser: boolean,
): Promise<IAuthenticatedUser | ReturnType<typeof getPublicUser> | null>;
export async function getUserBySession(
  req: Request,
  getFullUser: boolean = false,
): Promise<ISessionUser | ReturnType<typeof getPublicUser> | null> {
  const foundSession = await getSessionId(req);
  const user = foundSession ? await getUserBySessionId(foundSession) : getPublicUser(req);

  if (!user) {
    console.warn("getUserBySession - User not found", foundSession);
    return null;
  }
  const isUserValid = await verifyData(user.id, user.token);
  if (!isUserValid) {
    console.warn("getUserBySession - User token is invalid", user.id);
    return null;
  }

  // Public user
  if (getFullUser && !foundSession) {
    return user as ReturnType<typeof getPublicUser>;
  }

  if (getFullUser) {
    const res = await requestTransaction(req, { action: "getUserById" });
    return res;
  } else {
    return { ...user, isAuthenticated: !!foundSession } as ISessionUser;
  }
}

/** Create a new public user. Use it uniquely for public users.
 *
 * * @returns The public user, with a random id, a verify token and an expiration date of 7 days.
 */
export const createPublicUser = async (): Promise<IPublicUser> =>
  await tokenizeUser({
    id: crypto.randomUUID(),
    isAuthenticated: false,
    expires: DateTime.now().plus({ days: 7 }).toJSDate(),
  });

/** Get the current public user from the request
 *
 * @param {Request} req The request to get the public user from
 * @returns {IPublicUser | null} The public user, or null if not found
 */
export const getPublicUser = (req: Request): IPublicUser | null => {
  const cookie = getCookies(req.headers)[PUBLIC_USER_ID];
  if (!cookie) return null;
  const user = JSON.parse(decodeURIComponent(cookie)) as IPublicUser;
  return { ...user, expires: new Date(user.expires) };
};

/** Remove the current public user in the request
 *
 * @param req The request to remove the public user from
 * @param res The returned cleaned response
 * @param newUserId The new user id to migrate the datas/configs to. If not provided, the public user is simply removed.
 * * @returns The cleaned response
 */
export const cleanupPublicUser = async (
  req: Request,
  res: Response,
  newUserId?: IAuthenticatedUser["id"],
): Promise<Response> => {
  const publicUser = getPublicUser(req);
  if (!publicUser) return res;
  setCookie(res.headers, {
    name: PUBLIC_USER_ID,
    value: "",
    path: "/",
    httpOnly: true,
    expires: new Date(0),
  });

  if (newUserId) {
    const content = await requestTransaction(req, { action: "getContent" });

    if (content) {
      const { id: contentId, ...restContent } = content;
      const allEntries = await requestTransaction(req, {
        action: "exportEntries",
        args: [{
          contentId,
          from: getDailyEntryKey(DateTime.now().minus({ years: 10 })),
          to: getDailyEntryKey(DateTime.now()),
        }],
      });

      const user = { id: newUserId, isAuthenticated: true } as IAuthenticatedUser;
      const cryptoKv = await openUserKv(user);

      await setContent(cryptoKv, user, { content: restContent });
      for (const { entries, at } of (allEntries || [])) {
        await saveEntries(cryptoKv, user, { contentId, entries, at });
      }
      cryptoKv.close();
    }
  }

  return res;
};

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

/** Adds a verification token to the user object. The token is generated using the user's id.
 *
 * @param user The user to tokenize
 * @returns The user with the new token
 */
export async function tokenizeUser<T extends PartialBy<IPublicUser, "token"> | PartialBy<IAuthenticatedUser, "token">>(
  user: T,
): Promise<T & { token: string }> {
  const token = await signData(user.id);
  return { ...user, token };
}

/** Cleanup the session cookies from oauth and site.
 *
 * * @param res The response to clean up
 * @returns The cleaned response
 */
export const cleanupSession = (res: Response) => {
  deleteCookie(res.headers, OAUTH_COOKIE_NAME || "");
  deleteCookie(res.headers, SITE_COOKIE_NAME || "");
  return res;
};
