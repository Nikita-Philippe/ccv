import { getCookies, setCookie } from "$std/http/cookie.ts";
import { PartialBy } from "@models/Common.ts";
import { IAuthenticatedUser, IPublicUser, TUser } from "@models/User.ts";
import { PUBLIC_USER_ID } from "@utils/constants.ts";
import { getUserBySessionId } from "@utils/user.ts";
import { getSessionId } from "../plugins/kv_oauth.ts";
import { signData, verifyData } from "@utils/crypto.ts";

/** Checks that the current user is authorized and verified
 *
 * @param req The request to check
 * @returns True if the user is authorized
 * @throws Error if neither req or sessionId is provided
 */
export const isAuthorized = async (req: Request) => {
  const user = await getUserBySession({ req });
  return !!user;
};

type TgetUserBySession = (
  data: { req: Request; sessionId?: string } | { req?: Request; sessionId: string },
) => Promise<TUser | null>;

/** Get the user by the session id
 *
 * Prefer to provide the Request, as the sessionId is solely used for signed-in users.
 *
 * @param {Request} data.req The request to get the user from
 * @param {string} data.sessionId The session id to get the user from
 * @returns The user, or null if not found or unauthorized
 * @throws Error if neither req or sessionId is provided
 */
export const getUserBySession: TgetUserBySession = async (data) => {
  const { req, sessionId } = data;
  if (!req && !sessionId) throw new Error("Either req or sessionId must be provided");
  const foundSession = sessionId ?? await getSessionId(req!);
  const user = foundSession ? await getUserBySessionId(foundSession) : getPublicUser(req!);

  if (!user) return null;

  const isUserValid = await verifyData(user.id, user.token);
  if (!isUserValid) console.warn("User token is invalid", user.id);
  return isUserValid ? user : null;
};

/** Create a new public user */
export const createPublicUser = async (): Promise<IPublicUser> =>
  await tokenizeUser({
    id: crypto.randomUUID(),
    isAuthenticated: false,
  });

/** Get the current public user from the request
 * 
 * @param req The request to get the public user from
 * @returns The public user, or null if not found */
export const getPublicUser = (req: Request): IPublicUser & { expires: string } | null => {
  const cookie = getCookies(req.headers)[PUBLIC_USER_ID];
  return cookie ? JSON.parse(decodeURIComponent(cookie)) : null;
};

/** Remove the current public user the request
 * 
 * @param resp The response to remove the public user from */
export const removePublicUser = (req: Request, res: Response) => {
  if (!getPublicUser(req)) return res;
  setCookie(res.headers, {
    name: PUBLIC_USER_ID,
    value: "",
    path: "/",
    httpOnly: true,
    expires: new Date(0),
  });
  return res;
};

/** Get a redirect response to the hello page.
 *
 * @param redirectTo The page to redirect on hello page access, if no error.
 * @returns The redirect response
 */
export const getHelloPageRedirect = (redirectTo?: string): Response => {
  const response = new Response("", {
    status: 303,
    headers: {
      Location: `/hello${redirectTo ? `?redirectTo=${redirectTo}` : ""}`,
    },
  });

  return response;
};

export async function tokenizeUser(user: PartialBy<IPublicUser, "token">): Promise<IPublicUser>;
export async function tokenizeUser(user: PartialBy<IAuthenticatedUser, "token">): Promise<IAuthenticatedUser>;

/** Tokenize the user, creating a new token for the specified user
 *
 * @param user The user to tokenize
 * @returns The user with the new token
 */
export async function tokenizeUser(user: PartialBy<IPublicUser, "token"> | PartialBy<IAuthenticatedUser, "token">) {
  const token = await signData(user.id);
  return { ...user, token };
}
