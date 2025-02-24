// Heavily inspired by https://github.com/cdoremus/deno-fresh-oauth

import { IAuthenticatedUser } from "@models/User.ts";
import { KV_USER, KV_USER_SESSION } from "@utils/constants.ts";
import { PartialBy } from "@models/Common.ts";
import { tokenizeUser } from "@utils/auth.ts";

const kv = await Deno.openKv();

/** Create a new user in the KV store.
 *
 * Should be called when creating a new signed-in and verified user.
 *
 * @param baseUser The base user to create. The token will be generated afterwards.
 * @returns The created user
 * @throws Error if the user already exists
 */
export async function createUser(baseUser: PartialBy<IAuthenticatedUser, "token">) {
  const user = await tokenizeUser(baseUser);
  const usersKey = [KV_USER, user.id];
  const usersBySessionKey = [KV_USER_SESSION, user.sessionId];
  const res = await kv.atomic()
    .check({ key: usersKey, versionstamp: null })
    .check({ key: usersBySessionKey, versionstamp: null })
    .set(usersKey, user)
    .set(usersBySessionKey, user)
    .commit();

  if (!res.ok) {
    throw res;
  }

  return user;
}

/** Get a user by the id
 *
 * @param id The id of the user
 * @returns The user, or null if not found
 */
export async function getUserById(id: string) {
  const res = await kv.get<IAuthenticatedUser>([KV_USER, id]);
  return res.value;
}

/** Get a user by the session id
 *
 * @param sessionId The session id of the user
 * @returns The user, or null if not found
 */
export async function getUserBySessionId(sessionId: string) {
  let res = await kv.get<IAuthenticatedUser>([KV_USER_SESSION, sessionId], {
    consistency: "eventual",
  });
  if (!res.value) {
    res = await kv.get<IAuthenticatedUser>([KV_USER_SESSION, sessionId]);
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
 * This assumes that the previous session has been cleared
 *
 * @param user The user to set the session to
 * @param sessionId The session id to set
 * @throws Error if the user or session id is invalid
 * @throws Error if the user session could not be set
 */
export async function setUserSession(
  user: IAuthenticatedUser,
  sessionId: string,
) {
  const usersKey = [KV_USER, user.id];
  const usersBySessionKey = [KV_USER_SESSION, sessionId];

  const [
    userRes,
  ] = await kv.getMany<IAuthenticatedUser[]>([
    usersKey,
  ]);

  [
    userRes,
  ].forEach((res) => assertIsEntry<IAuthenticatedUser>(res));

  user = await tokenizeUser({ ...user, sessionId } as IAuthenticatedUser);

  const res = await kv.atomic()
    .check(userRes)
    .check({ key: usersBySessionKey, versionstamp: null })
    .set(usersKey, user)
    .set(usersBySessionKey, user)
    .commit();

  if (!res.ok) {
    throw res;
  }
}

/** Fully delete a user from the KV store
 *
 * @param user The user to delete
 * @throws Error if the user could not be deleted
 */
export async function deleteUser(user: IAuthenticatedUser) {
  const usersKey = [KV_USER, user.id];
  const usersBySessionKey = [KV_USER_SESSION, user.sessionId];

  const [
    userRes,
    userBySessionRes,
  ] = await kv.getMany<IAuthenticatedUser[]>([
    usersKey,
    usersBySessionKey,
  ]);

  const res = await kv.atomic()
    .check(userRes)
    .check(userBySessionRes)
    .delete(usersKey)
    .delete(usersBySessionKey)
    .commit();

  if (!res.ok) {
    throw res;
  }
}

/** Delete a user, in the user session store, by the session id.
 *
 * @param sessionId The session id of the user to delete
 */
export async function deleteUserBySession(sessionId: string) {
  await kv.delete([KV_USER_SESSION, sessionId]);
}
