import { remove } from "@kitsonk/kv-toolbox/blob";
import { CryptoKv } from "@kitsonk/kv-toolbox/crypto";
import { unique } from "@kitsonk/kv-toolbox/keys";
import { IAuthenticatedUser, IGoogleUser, TUser } from "@models/User.ts";
import { getUserBySession } from "@utils/auth.ts";
import { KV_CONTENT, KV_DAILY_ENTRY, KV_SETTINGS, KV_STATS } from "@utils/constants.ts";
import { getContent, setContent } from "@utils/content.ts";
import { getCryptoKey, getUserEncryptionKey, hashUserId } from "@utils/crypto.ts";
import { exportEntries, getEntry, missingEntries, saveEntries } from "@utils/entries.ts";
import { getStats, setStats } from "@utils/stats.ts";
import { createUser, deleteUser, getUserById, setUserSession } from "@utils/user.ts";
import { Debug } from "./debug.ts";
import { getSAdminStats } from "./admin.ts";

export type TKv = CryptoKv;

const KV_PATH = Deno.env.get("KV_PATH");

/** Open the encrypted KV store with the provided key
 *
 * @param dek The data encryption key
 * @returns The KV store
 */
export const openUserKv = async (user: IAuthenticatedUser | IGoogleUser) => {
  const dek = await getUserEncryptionKey(user);
  const key = await crypto.subtle.exportKey("raw", dek);
  const kv = await Deno.openKv(KV_PATH);
  return new CryptoKv(kv, new Uint8Array(key));
};

/** Open an public all-purpose kv instance.
 *
 * **Should only be used for public users**
 */
const openPublicKv = async () => {
  const dek = await getCryptoKey(Deno.env.get("PUBLIC_DEK") || "public_dek");
  const key = await crypto.subtle.exportKey("raw", dek);
  const kv = await Deno.openKv(KV_PATH);
  return new CryptoKv(kv, new Uint8Array(key));
};

/** Close the encrypted KV store */
const closeKv = async (kv: TKv) => await kv.close();

const availableActions = {
  "getContent": getContent,
  "setContent": setContent,
  "saveEntries": saveEntries,
  "getEntry": getEntry,
  "missingEntries": missingEntries,
  "exportEntries": exportEntries,
  "getUserById": getUserById,
  "createUser": createUser,
  "setUserSession": setUserSession,
  "getStats": getStats,
  "setStats": setStats,
  "getSAdminStats": getSAdminStats
};

// deno-lint-ignore no-explicit-any
type RestParameters<T extends unknown[]> = T extends [any, any, ...infer U] ? U : never;

/** Request a transaction to the KV store.
 *
 * Use this function for all transactions to the kv store, as it uses encryption and
 * handles the user session.
 *
 * @param req The request object. Used to get the correct user session.
 * @param transaction The transaction to execute. Should be an object with the action and the arguments.
 * Check availableActions for the available functions.
 * @param transaction.args The arguments to pass to the function. Should be an array of arguments of the available function.
 * @returns The result of the transaction. The type is inferred from the function.
 */
export const requestTransaction = async <K extends keyof typeof availableActions>(
  req: Request,
  transaction: {
    action: K;
    args?: RestParameters<Parameters<typeof availableActions[K]>>;
  },
): Promise<(ReturnType<typeof availableActions[K]> | null)> => {
  if (Debug.get("perf_kv")) console.time(`kv:${transaction.action}`);
  /** Get user from the request. Disable for some actions that can trigger a recursive call. */
  const getFullUser = !["getUserById"].includes(transaction.action);

  /** Special actions that don't require a user
   * - createUser: Needs a user object (not yet in session) to create a new user
   * - setUserSession: Needs a user object (not yet in session) to save the session */
  const specialActions = ["createUser", "setUserSession"].includes(transaction.action);
  const user = specialActions ? transaction.args?.[0] as TUser : await getUserBySession(req, getFullUser);

  if (!user) {
    if (Debug.get("kv")) {
      console.error("requestTransaction - User not found", {
        action: transaction.action,
        args: transaction.args,
      });
    }
    return null;
  }

  let kv: TKv;
  if (Debug.get("perf_crypto")) console.time(`opening-crypto:${transaction.action}`);
  if (user.isAuthenticated) {
    kv = await openUserKv(user);
  } else {
    kv = await openPublicKv();
  }
  if (Debug.get("perf_crypto")) console.timeEnd(`opening-crypto:${transaction.action}`);

  // Execute transaction with the correct typing
  const actionFunction = availableActions[transaction.action];

  // @ts-ignore - TODO: This should be correctly typed, as for now there is some issues with the typing of the function parameters
  const res: ReturnType<typeof availableActions[K]> = await actionFunction(
    kv,
    user,
    ...((transaction.args as []) ?? []),
  );

  await closeKv(kv);
  if (Debug.get("perf_kv")) console.timeEnd(`kv:${transaction.action}`);
  return res;
};

/** Fetch the freshly signed-in user.
 *
 * Differs from the requestTransaction function as it does not require a request object, when
 * the user is in the callback state.
 */
export const fetchSignedInUser = async (user: IGoogleUser): Promise<IAuthenticatedUser | null> => {
  const kv = await openUserKv(user);
  return getUserById(kv, user as unknown as IAuthenticatedUser);
};

/** Wipe out every user-related data from the KV store.
 *
 * @param user The user to wipe out. Must be a signed-in user (public ones are auto-deleted after x time) or
 * directly the hashed user id.
 * @param recoveryEntry Optional recovery key entry. Specify it if called from the recovery page.
 */
export const wipeUser = async (user: IAuthenticatedUser | string, recoveryEntry?: Deno.KvKey) => {
  const isUserId = typeof user === "string";
  const key = isUserId ? user : await hashUserId(user.id);
  const kv = await Deno.openKv(KV_PATH);
  // Remove/delete does not delete deeply, so iterate over all keys
  const configKey = await unique(kv, [KV_CONTENT, key]);
  const entryKey = await unique(kv, [KV_DAILY_ENTRY, key]);
  const settingsKey = await unique(kv, [KV_SETTINGS, key]);
  const statsKey = await unique(kv, [KV_STATS, key]);
  for await (const key of [...configKey, ...entryKey, ...settingsKey, ...statsKey]) {
    await remove(kv, key);
  }

  if (Debug.get("user")) console.log(`Wiping user ${isUserId ? user : user.id}`, { user, key });
  if (recoveryEntry) await remove(kv, recoveryEntry);
  await deleteUser(user);
  kv.close();
};
