import { tree } from "@kitsonk/kv-toolbox/keys";
import { IPublicUser, MinUser } from "@models/User.ts";
import { getCookies, setCookie } from "@std/http/cookie";
import { PUBLIC_USER_COOKIE } from "@utils/constants.ts";
import { signData } from "@utils/crypto/hash.ts";
import { getAllKeyPaths, getInKv, setInKv } from "@utils/kv/index.ts";
import { getUserKVConfig, openKV } from "@utils/kv/instance.ts";
import { KV_USER } from "@utils/user/constant.ts";
import { wipeUser } from "@utils/user/index.ts";
import { DateTime } from "luxon";

/** Create a new public user. Use it uniquely for public users.
 *
 * * @returns The public user, with a random id, a verify token and an expiration date of 7 days.
 */
export const createPublicUser = async (): Promise<IPublicUser> => {
  const id = crypto.randomUUID();
  const token = await signData(id);

  return {
    id,
    isAuthenticated: false,
    provider: "public",
    token,
    expires: DateTime.now().plus({ days: 7 }),
  };
};

/** Get the current public user from the request
 *
 * @param {Request} req The request to get the public user from
 * @returns {IPublicUser | null} The public user, or null if not found
 */
export const getPublicUser = (req: Request): IPublicUser | null => {
  const cookie = getCookies(req.headers)[PUBLIC_USER_COOKIE];
  if (!cookie) return null;
  const user = JSON.parse(decodeURIComponent(cookie));
  return { ...user, expires: DateTime.fromISO(user.expires) } as IPublicUser;
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
  newUser?: MinUser,
): Promise<Response> => {
  const publicUser = getPublicUser(req);
  if (!publicUser) return res;
  setCookie(res.headers, {
    name: PUBLIC_USER_COOKIE,
    value: "",
    path: "/",
    httpOnly: true,
    expires: new Date(0),
  });

  // If new user, copy all the public user datas to the new user, and wipe out the public user
  if (newUser) {
    const { kv: pKv, uKey: puKey } = await getUserKVConfig(req);

    const defaultKv = await openKV();
    const puKeyTree = await tree(defaultKv, [KV_USER, puKey]);
    defaultKv.close();

    const allPublicUserKeys = getAllKeyPaths(puKeyTree);
    const { kv, uKey } = await getUserKVConfig(newUser);

    for (const keyPath of allPublicUserKeys) {
      // Replace the public user key with the new user key
      const newUserKeyPath = keyPath.map((k) => k === puKey ? uKey : k);

      const { value } = await getInKv(pKv, keyPath);
      await setInKv(kv, newUserKeyPath, value);
    }

    await wipeUser(publicUser);

    pKv.close();
    kv.close();
  }

  return res;
};
