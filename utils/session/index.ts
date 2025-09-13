import { remove } from "@kitsonk/kv-toolbox/blob";
import { IAuthenticatedUser, ISessionUser } from "@models/User.ts";
import { deleteCookie } from "@std/http/cookie";
import { getCryptoKey } from "@utils/crypto/config.ts";
import { hashData, signData, verifyData } from "@utils/crypto/hash.ts";
import { getInKv, setInKv } from "@utils/kv/index.ts";
import { getUserKVConfig, openCryptoKv, openKV, UserKVConfigEntry } from "@utils/kv/instance.ts";
import { KV_SESSION, SESSION_TIMEOUT } from "@utils/session/constants.ts";
import { KV_USER, KV_USER_DATA } from "@utils/user/constant.ts";
import { OAUTH_COOKIE_NAME, SITE_COOKIE_NAME } from "https://jsr.io/@deno/kv-oauth/0.11.0/lib/_http.ts";

const openSessionKV = async () => {
  const key = getCryptoKey("ssDEK");
  if (!key) throw new Error("DEKs are not init.");
  return await openCryptoKv(key);
};

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

/** Get a user by the session id
 *
 * @param sessionId The session id of the user
 * @returns The user, or null if not found
 */
export async function getUserBySessionId(sessionId: string) {
  const kv = await openSessionKV();

  const ssKey = await hashData(sessionId);

  let res = await getInKv<ISessionUser>(kv, [KV_SESSION, ssKey], { consistency: "eventual" });
  if (!res.value) res = await getInKv<ISessionUser>(kv, [KV_SESSION, ssKey]);

  kv.close();

  if (res.value) {
    // Validate data
    if (!await verifyData(res.value.id, res.value.token)) {
      await deleteUserBySession(sessionId);
      return null;
    }
  }

  return res.value;
}

/** Set the user session in the KV store.
 *
 * This will clear out any previous session id, and set the new one.
 *
 * @param entry The {@linkcode UserKVConfigEntry entry} to get the content for.
 * @param args.sessionId The session id for the user.
 */
export async function setUserSession(
  entry: UserKVConfigEntry,
  { sessionId }: { sessionId: string },
) {
  try {
    const { kv, uKey, user } = await getUserKVConfig(entry);
    const userRes = await getInKv<IAuthenticatedUser>(kv, [KV_USER, uKey, KV_USER_DATA]);
    assertIsEntry<IAuthenticatedUser>(userRes);

    const token = await signData(user.id);
    const sessionUser: ISessionUser = {
      id: user.id,
      token,
      isAuthenticated: true,
      provider: user.provider,
      expires: Date.now().valueOf() + SESSION_TIMEOUT,
    };

    const sessionKv = await openSessionKV();
    const ssKey = await hashData(sessionId);
    await setInKv(sessionKv, [KV_SESSION, ssKey], sessionUser, { expireIn: SESSION_TIMEOUT });
    sessionKv.close();
  } catch (e) {
    console.error(`User session could not be set: ${sessionId}`, e);
    throw new Error(`User session could not be set: ${sessionId}`, e as Error);
  }
}

/** Delete a user, in the user session store, by the session id.
 *
 * @param sessionId The session id of the user to delete
 */
export async function deleteUserBySession(sessionId: string) {
  const ssKey = await hashData(sessionId);
  const kv = await openKV();
  await remove(kv, [KV_SESSION, ssKey]).finally(() => kv.close());
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
