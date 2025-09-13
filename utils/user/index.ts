import { remove } from "@kitsonk/kv-toolbox/blob";
import { PartialBy } from "@models/Common.ts";
import { IAuthenticatedUser, IPublicUser, ISessionUser, MinUser } from "@models/User.ts";
import { Debug } from "@utils/debug.ts";
import { getInKv, removeInKv, setInKv } from "@utils/kv/index.ts";
import { getUserKVConfig, openKV, openUserKV, UserKVConfigEntry } from "@utils/kv/instance.ts";
import { deleteUserBySession, setUserSession } from "@utils/session/index.ts";
import { getUserBySession } from "@utils/user/auth.ts";
import { KV_USER, KV_USER_DATA } from "@utils/user/constant.ts";
import { getUKey } from "@utils/user/crypto.ts";
import { DateTime } from "luxon";

/** Create a new user in the KV store.
 *
 * Should be called when creating a new **signed-in** AND **verified user**.
 *
 * @param {IAuthenticatedUser} user The user to create. Must be a fully valid `IAuthenticatedUser` object.
 * @returns {IAuthenticatedUser} The created user.
 * @throws Error if the user already exists
 */
export async function createUser(user: IAuthenticatedUser) {
  const kv = await openUserKV(user);
  const uKey = await getUKey(user);

  try {
    await setInKv(kv, [KV_USER, uKey, KV_USER_DATA], user);
    await setUserSession(user, { sessionId: user.sessionId });
  } catch (e) {
    console.error(`User already exists: ${user.id}`, e);
    throw new Error(`User already exists: ${user.id}`, e as Error);
  }

  kv.close();

  return user;
}

/** Fully delete a user from the KV store
 *
 * @param user The user to delete. If sessionId is provided, will also clean up the session store.
 * @throws Error if the user could not be deleted
 */
export async function deleteUser<U extends PartialBy<IAuthenticatedUser, "sessionId"> | IPublicUser | string>(user: U) {
  const kv = await openKV();
  const uKey = typeof user === "string" ? user : await getUKey(user);
  const usersKey = [KV_USER, uKey];
  await remove(kv, usersKey);
  kv.close();
  if ((user as IAuthenticatedUser)?.sessionId) await deleteUserBySession((user as IAuthenticatedUser).sessionId);
}

/** Wipe out every user-related data from the KV store.
 *
 * @param user The user to wipe out. Must be a signed-in user (public ones are auto-deleted after x time) or
 * directly the hashed user id.
 * @param recoveryEntry Optional recovery key entry. Specify it if called from the recovery page.
 */
export const wipeUser = async (user: MinUser | string, recoveryEntry?: Deno.KvKey) => {
  const isUserId = typeof user === "string";
  const key = isUserId ? user : await getUKey(user);

  if (Debug.get("user")) console.log(`Wiping user ${isUserId ? user : user.id}`, { user, key });

  const kv = await openKV();
  await removeInKv(kv, [KV_USER, key]);

  if (recoveryEntry) await remove(kv, recoveryEntry);
  kv.close();
};

/** Get the full user object from the KV store.
 *
 * @param entry The request, or the decrypted user, or the user KV config
 * @returns The user object, or null if not found
 */
export const getUser = async (entry: UserKVConfigEntry): Promise<IAuthenticatedUser | IPublicUser | null> => {
  try {
    const { kv, uKey } = await getUserKVConfig(entry);
    const res = await getInKv<IAuthenticatedUser | IPublicUser>(kv, [KV_USER, uKey, KV_USER_DATA]);
    kv.close();
    return res?.value;
  } catch {
    return null;
  }
};

/** Get the users datas expiry in the kv store.
 *
 * The expiry is the time left before the public users expire.
 *
 * * @param user The user to get the expiry for. If the user is authenticated, datas does not expire.
 * * @returns The expiry in milliseconds, or undefined if the user is authenticated.
 */
export const getUserDatasExpiry = (user: IAuthenticatedUser | IPublicUser | ISessionUser) => {
  if (user.isAuthenticated) return undefined;
  const now = DateTime.now();
  return +user.expires - +now;
};

export const isSuperAdmin = async (data: Request | IAuthenticatedUser | IPublicUser | ISessionUser | null) => {
  const admins = globalThis.ccv_config.admin_email;
  if (!admins) return false;

  let user;
  if (data instanceof Request) user = await getUserBySession(data, true);
  else user = data;

  return user?.isAuthenticated && (user as IAuthenticatedUser).email &&
    admins.includes((user as IAuthenticatedUser).email ?? "");
};
