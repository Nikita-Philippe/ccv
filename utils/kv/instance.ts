import { IPublicUser, ISessionUser, MinUser, TUser } from "@models/User.ts";
import { getUKey, getUUDEK } from "../user/crypto.ts";
import { CryptoKv, Encryptor, openCryptoKv as openKVTCryptoKV } from "@kitsonk/kv-toolbox/crypto";
import { KV_PATH } from "./constants.ts";
import { getUserBySession } from "../user/auth.ts";

/** Open an encrypted KV instance for the user.
 *
 * Prefer this method over directly opening a CryptoKv (path and key will be managed).
 *
 * @param user The user to open the KV for
 * @returns The opened CryptoKv instance
 */
export const openUserKV = async (user: MinUser) => {
  const baseDEK = getUUDEK(user);

  // Add the user id, so that the key remain only usable at runtime. Hash it to get 32 bytes
  const uuDEK = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(baseDEK + user.id)));

  return await openKVTCryptoKV(uuDEK, KV_PATH);
};

/** Open a non-encrypted KV instance.
 *
 * Prefer this method over directly opening Deno.Kv (path will be set).
 *
 * @returns The opened Deno.Kv instance
 */
export const openKV = async () => {
  return await Deno.openKv(KV_PATH);
};

/** Open an encrypted KV instance with a provided key.
 *
 * Prefer this method over directly opening a CryptoKv (path will be managed).
 *
 * @param key The key to use for encryption. Can be a string, Uint8Array or Encryptor.
 * @returns The opened CryptoKv instance
 */
export const openCryptoKv = async (key: string | Uint8Array | Encryptor) => {
  return await openKVTCryptoKV(key, KV_PATH);
};

export type TKv = CryptoKv; // | Deno.Kv;

/** The type returned by {@linkcode getUserKVConfig} */
export type UserKVConfig = {
  kv: CryptoKv;
  uKey: string;
  user: TUser | ISessionUser;
};

/** The type of data that can be provided to open a user KV instance */
export type UserKVConfigEntry = Request | MinUser | UserKVConfig;

/** Get the user config for KV operations.
 *
 * @param entry - The request, or the decrypted user
 * @returns The {@linkcode UserKVConfig} containing the opened KV instance, the user key and the user object
 * @throws An error if the user does not exist. This function should be called in a
 * context where the user is known to exist
 */
export const getUserKVConfig = async (entry: UserKVConfigEntry): Promise<UserKVConfig> => {
  if (typeof entry === "object" && "uKey" in (entry as UserKVConfig)) return (entry as UserKVConfig);

  let user: IPublicUser | ISessionUser | null = null;

  if (entry instanceof Request) {
    user = await getUserBySession(entry);
  } else {
    user = entry as IPublicUser | ISessionUser;
  }

  if (!user) throw new Error("Cannot get user config for entry");

  const kv = await openUserKV(user);
  const uKey = await getUKey(user);

  return { kv, uKey, user };
};
