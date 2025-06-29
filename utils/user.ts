// Heavily inspired by https://github.com/cdoremus/deno-fresh-oauth

import { IAuthenticatedUser, IPublicUser, ISessionUser } from "@models/User.ts";
import { KV_USER, KV_USER_SESSION } from "@utils/constants.ts";
import { PartialBy } from "@models/Common.ts";
import { tokenizeUser } from "@utils/auth.ts";
import { hashUserId } from "@utils/crypto.ts";
import { TKv } from "@utils/database.ts";
import { getInKv, setInKv } from "@utils/kv.ts";
import { remove } from "@kitsonk/kv-toolbox/blob";
import { DateTime } from "luxon";

const defaultKv = await Deno.openKv(Deno.env.get("KV_PATH"));
const SESSION_TIMEOUT = 1000 * 60 * 60 * 24 * 7; // Keep active signedin session for 7 days

/** Create a new user in the KV store.
 *
 * Should be called when creating a new **signed-in** AND **verified user**.
 *
 * @param kv The KV store to use. If not provided, the default KV store is used.
 * @param baseUser The base user to create. The token will be generated afterwards.
 * @param _ Optional parameter used for the `requestTransaction` function.
 * @returns {IAuthenticatedUser} The created user.
 * @throws Error if the user already exists
 */
export async function createUser(kv: TKv, baseUser: PartialBy<IAuthenticatedUser, "token">, _?: unknown) {
  const user = await tokenizeUser(baseUser);
  const kvKeyId = await hashUserId(user.id);
  const userKey = [KV_USER, kvKeyId];
  const usersBySessionKey = [KV_USER_SESSION, user.sessionId];
  const sessionUser: ISessionUser = {
    id: user.id,
    token: user.token,
  };

  // TODO: Here use atomic operations with CryptoKv (check())
  try {
    await setInKv(kv, userKey, user);

    // Session does not uses crypto, so we can use the default kv
    await defaultKv.set(usersBySessionKey, sessionUser, {
      expireIn: SESSION_TIMEOUT,
    });
  } catch (e) {
    console.error(`User already exists: ${user.id}`, e);
    throw new Error(`User already exists: ${user.id}`, e as Error);
  }

  return user;
}

/** Get a full user by its id
 *
 * @param kv The user's cryptoKv store. Set by default using `requestTransaction`.
 * @param user The user to get. Set by default using `getUserBySession`.
 * @returns The fully populated user object, or null if not found
 */
export async function getUserById(kv: TKv, user: IAuthenticatedUser) {
  const { id } = user;
  const userKey = await hashUserId(id);
  const res = await getInKv<IAuthenticatedUser>(kv, [KV_USER, userKey]);
  return res.value;
}

/** Get a user by the session id
 *
 * @param sessionId The session id of the user
 * @returns The user, or null if not found
 */
export async function getUserBySessionId(sessionId: string) {
  // Session id is not encrypted, so we can use the default kv
  let res = await defaultKv.get<ISessionUser>([KV_USER_SESSION, sessionId], {
    consistency: "eventual",
  });
  if (!res.value) {
    res = await defaultKv.get<ISessionUser>([KV_USER_SESSION, sessionId]);
  }
  return res.value;
}

function isEntry<T>(entry: Deno.KvEntryMaybe<T>) {
  return entry.versionstamp !== null;
}

function assertIsEntry<T>(
  entry: Deno.KvEntryMaybe<T>,
): asserts entry is Deno.KvEntry<T> {
  if (!isEntry(entry)) {
    throw new Error(`${entry.key} does not exist`);
  }
}

/** Set the user session in the KV store.
 *
 * This will clear out any previous session id, and set the new one.
 *
 * @param kv The user's cryptoKv store. Set by default using `requestTransaction`.
 * @param user The user to set the session for. Set by default using `getUserBySession`.
 * @param _ Optional parameter used for the `requestTransaction` function.
 * @param args.sessionId The session id for the user.
 */
export async function setUserSession(
  kv: TKv,
  user: IAuthenticatedUser,
  _: unknown,
  { sessionId }: { sessionId: string },
) {
  const kvKeyId = await hashUserId(user.id);
  const usersKey = [KV_USER, kvKeyId];
  const usersBySessionKey = [KV_USER_SESSION, sessionId];

  try {
    const userRes = await getInKv<IAuthenticatedUser>(kv, usersKey);
    assertIsEntry<IAuthenticatedUser>(userRes);

    user = await tokenizeUser({ ...user } as IAuthenticatedUser);
    const sessionUser: ISessionUser = {
      id: user.id,
      token: user.token,
    };
    // Session does not uses crypto, so we can use the default kv
    await defaultKv.set(usersBySessionKey, sessionUser, {
      expireIn: SESSION_TIMEOUT,
    });
  } catch (e) {
    console.error(`User session could not be set: ${user.id}`, e);
    throw new Error(`User session could not be set: ${user.id}`, e as Error);
  }
}

/** Fully delete a user from the KV store
 *
 * @param user The user to delete. If sessionId is provided, will also clean up the session store.
 * @throws Error if the user could not be deleted
 */
export async function deleteUser(user: PartialBy<IAuthenticatedUser, "sessionId">) {
  const kvKeyId = await hashUserId(user.id);
  const usersKey = [KV_USER, kvKeyId];
  await remove(defaultKv, usersKey);
  if (user.sessionId) await deleteUserBySession(user.sessionId);
}

/** Delete a user, in the user session store, by the session id.
 *
 * @param sessionId The session id of the user to delete
 */
export async function deleteUserBySession(sessionId: string) {
  try {
    const key = [KV_USER_SESSION, String(sessionId)];
    const exists = await defaultKv.get(key);
    const result = await defaultKv.atomic()
      .check({ key, versionstamp: exists.versionstamp })
      .delete(key)
      .commit();
    return result.ok;
  } catch (error) {
    throw error;
  }
}

/** Get the users datas expiry in the kv store.
 * 
 * The expiry is the time left before the public users expire.
 * 
 * * @param user The user to get the expiry for. If the user is authenticated, datas does not expire.
 * * @returns The expiry in milliseconds, or undefined if the user is authenticated.
 */
export const getUserDatasExpiry = (user: IAuthenticatedUser | IPublicUser) => {
  if (user.isAuthenticated) return undefined;
  const now = DateTime.now().toMillis();
  const expiry = DateTime.fromJSDate(user.expires).toMillis();
  return expiry - now;
}