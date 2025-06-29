import { CryptoKv, generateKey } from "@kitsonk/kv-toolbox/crypto";
import { IAuthenticatedUser, IGoogleUser, IRecoverEntry } from "@models/User.ts";
import { getDailyEntryKey } from "@utils/common.ts";
import { KV_AUTH_RECOVERY } from "@utils/constants.ts";
import { getContent } from "@utils/content.ts";
import { openUserKv, wipeUser } from "@utils/database.ts";
import { exportEntries } from "@utils/entries.ts";
import { getInKv, setInKv } from "@utils/kv.ts";
import { DateTime } from "luxon";

/** Sign the provided data */
const encoder = new TextEncoder();
const secret = Deno.env.get("COOKIE_SECRET") || "default_secret";

/** Key used to sign & verify the user token */
const key = await crypto.subtle.importKey(
  "raw",
  encoder.encode(secret),
  { name: "HMAC", hash: "SHA-256" },
  false,
  ["sign", "verify"],
);

/** Sign the provided data
 *
 * @param {string} data The data to sign
 * @returns {Promise<string>} The signature of the data
 */
export async function signData(data: string): Promise<string> {
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  // convert signature (ArrayBuffer) to hex string
  const view = new Uint8Array(signature);
  return Array.from(view).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Verify the provided data
 *
 * @param {string} data The data to verify
 * @param {string} signature The signature to verify
 * @returns {Promise<boolean>} True if the signature is valid, false otherwise
 */
export async function verifyData(data: string, signature: string): Promise<boolean> {
  try {
    const sigBuffer = new Uint8Array(
      signature.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)),
    );
    return await crypto.subtle.verify("HMAC", key, sigBuffer, encoder.encode(data));
  } catch (e) {
    console.error("Error verifying data", e);
    return false;
  }
}

/** Returns a hash of the user id, used to sign/identify the user in the kv store.
 *
 * Internally, uses the `signData` function to sign the user id.
 *
 * @param {string} userId The user id to hash
 * @returns {Promise<string>} The hash of the user id
 */
export const hashUserId = async (userId: string): Promise<string> => {
  return await signData(userId);
};

/* ======= USER DATA ENCRYPTION ======= */

/** Key used to encrypt/decrypt/derive user data */
const cypto_data_derive_salt = Deno.env.get("CRYPTO_DATA_DERIVE_SALT") || "default_secret";
const cypto_data_derive_iterations = parseInt(Deno.env.get("CRYPTO_DATA_DERIVE_ITERATIONS") || "600000");

/** Get the crypto key used to encrypt/decrypt user data
 *
 * @param {string} data The data to derive the key from
 * @returns {Promise<CryptoKey>} The crypto key
 */
export const getCryptoKey = async (data: string): Promise<CryptoKey> => {
  const keyedId = await crypto.subtle.importKey(
    "raw",
    encoder.encode(data),
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  );

  return await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: encoder.encode(cypto_data_derive_salt),
      iterations: cypto_data_derive_iterations,
    },
    keyedId,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );
};

/** Get the encryption key for the user
 *
 * @param {IGoogleUser | IAuthenticatedUser} user The user to get the key for
 * @returns {Promise<CryptoKey>} The crypto key
 */
export const getUserEncryptionKey = async (user: IGoogleUser | IAuthenticatedUser): Promise<CryptoKey> => {
  return await getCryptoKey(user.id);
};

/** Create a user's recovery key, used to recover its datas if he lost access to his account.
 *
 * * The recovery key is a random generated string. It is used to encrpyt an entry in the kv store, that contains
 * the user id and email. These datas are single use to retrieve all user datas, and then deleted.
 *
 * * @param {IGoogleUser} user The user to create the recovery key for
 * * @returns {Promise<string>} The recovery key
 */
export const createUserRecoveryKey = async (user: IGoogleUser): Promise<string> => {
  const rawRecoveryKey = generateKey();
  const entryKey = await signData(rawRecoveryKey);

  const kv = await Deno.openKv(Deno.env.get("KV_PATH"));
  const cryptoKv = new CryptoKv(kv, rawRecoveryKey);

  await setInKv(cryptoKv, [KV_AUTH_RECOVERY, entryKey], {
    id: user.id,
    // Save email, to verify user informations when he needs to recover the key
    email: user.email,
  });

  cryptoKv.close();

  return rawRecoveryKey;
};

/** Recover the user account using the recovery key and email
 * 
 * Use the recovery key to decrypt the entry in the kv store, that contains the user id and email.
 * If entry data match, retrieve all users datas and delete all user related datas.
 *
 * @param {string} recoveryKey The recovery key to use
 * @param {string} email The email of the user to recover
 * @param {string} sessionId The session id of the user to recover. Needs to be provided to remove the current users session
 * @returns {Promise<IRecoverEntry | null>} The recovered user datas. Null if recover key is invalid or email doesn't match.
 */
export const recoverUserAccount = async (recoveryKey: string, email: string, sessionId: string) => {
  const entryKey = await signData(recoveryKey);

  const kv = await Deno.openKv(Deno.env.get("KV_PATH"));
  const recoveryKv = new CryptoKv(kv, recoveryKey);
  const recoveryEntry: Deno.KvKey = [KV_AUTH_RECOVERY, entryKey];

  const userDatas = await getInKv<IRecoverEntry | null>(recoveryKv, recoveryEntry);
  recoveryKv.close();

  if (!userDatas.value?.id) return null;
  if (userDatas.value.email.toLowerCase() != email.toLowerCase()) return null;
  const user = { ...userDatas.value, sessionId, isAuthenticated: true } as IAuthenticatedUser;

  const cryptoKv = await openUserKv(user);

  // Export configs
  const configs = await getContent(cryptoKv, user);

  // Export entries
  const entries = await exportEntries(cryptoKv, user, {
    contentId: configs?.id ?? "0",
    from: getDailyEntryKey(DateTime.now().minus({ years: 10 })),
    to: getDailyEntryKey(DateTime.now()),
  });

  cryptoKv.close();

  // Now delete all user-related datas
  await wipeUser(user, recoveryEntry);

  return {
    configs: {
      filename: `recovery_${DateTime.now().toFormat("yyyy-MM-dd")}_configs.json`,
      data: configs,
    },
    entries: {
      filename: `recovery_${DateTime.now().toFormat("yyyy-MM-dd")}_entries.json`,
      data: entries,
    },
  };
};
