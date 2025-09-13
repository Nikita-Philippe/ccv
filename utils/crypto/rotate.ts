/** This file exports functions to perform crypto key rotation.
 *
 * @author Nikitap
 */

import { remove } from "@kitsonk/kv-toolbox/blob";
import { CryptoKv } from "@kitsonk/kv-toolbox/crypto";
import { unique } from "@kitsonk/kv-toolbox/keys";
import { getCryptoKey, saveKey } from "@utils/crypto/config.ts";
import { DEKsMap, KV_CRYPTO, KV_CRYPTO_ENV, KV_CRYPTO_KEYS, TCryptoDEKs } from "@utils/crypto/constants.ts";
import { generateDEKs, generateEncryptionKey } from "@utils/crypto/generators.ts";
import { openCryptoKv, openKV } from "@utils/kv/instance.ts";
import { KV_SESSION } from "@utils/session/constants.ts";
import { KV_SETTINGS } from "@utils/constants.ts";

/** Rotate all DEKs (Data Encryption Keys) in the system.
 *
 * @param keys Optional list of DEKs to rotate. If not provided, all DEKs will be rotated.
 * @returns The list of rotated keys with their new values.
 */
export const rotateDEK = async (keys?: typeof DEKsMap) => {
  const parsedKeys = keys?.length ? DEKsMap.filter((k) => keys.includes(k)) : undefined;

  // Retrieve all old and new keys
  const DEKs = await generateDEKs(parsedKeys);

  const kv = await openKV();

  // Read and re-write all entries
  for (const [DEK, values] of Object.entries(DEKs)) {
    const { old, new: newVal } = values;

    await saveKey(DEK as TCryptoDEKs, newVal);

    // First init, no need to rewrite entries
    if (!old) continue;

    const path = [KV_CRYPTO, KV_CRYPTO_KEYS, DEK] as Deno.KvKey;

    const oldKv = await openCryptoKv(old);
    const newKv = await openCryptoKv(newVal);

    // User keys are stored under each user
    if (DEK === "uDEK") {
      const userKeys = await unique(kv, path);
      await reEncryptDatas(oldKv, newKv, userKeys.map((k) => [...k, KV_CRYPTO_KEYS]));
    } else {
      const key = [...path, KV_CRYPTO_KEYS];
      await reEncryptDatas(oldKv, newKv, [key]);
    }

    if (DEK === "ssDEK") await invalidateAllSessions(kv);
    if (DEK === "stDEK") {
      const keys = await unique(kv, [KV_SETTINGS]);
      await reEncryptDatas(oldKv, newKv, keys);
    }

    oldKv.close();
    newKv.close();
  }

  kv.close();

  return Object.entries(DEKs).map(([k, { new: v }]) => ({ k, v }));
};

/** Rotate the sign key,used to sign/verify data (sessions, etc.)
 *
 * @returns The new sign key.
 */
export const rotateSignKey = async () => {
  const newSignKey = await generateEncryptionKey();

  const kv = await openKV();

  // Invalidate all session (they are signed using the sign key)
  await invalidateAllSessions(kv);

  kv.close();

  await saveKey("signK", newSignKey);

  return newSignKey;
};

/** Rotate the KEK (Key Encryption Key), used to encrypt/decrypt all other keys.
 *
 * Calling this function will exit the process, to ensure no data is written using the old KEK. You must
 * update your env file with the new KEK, then restart the app.
 *
 * @returns Nothing, the function will exit the process after rotation.
 * @throws An error if the KEK is not set in envs.
 */
export const rotateKEK = async () => {
  const oldKEK = getCryptoKey("KEK");

  if (!oldKEK) throw new Error(`A 'CRYPTO_KEK' should be set in your envs.`);

  const newKEK = await generateEncryptionKey();

  const oldKV = await openCryptoKv(oldKEK);
  const newKV = await openCryptoKv(newKEK);

  // Re-encrypt datas using new kv
  await reEncryptDatas(oldKV, newKV, [[KV_CRYPTO, KV_CRYPTO_ENV]]);

  console.error("Update your env file using the new key. The app will be paused the time of the change.", { newKEK });

  Deno.exit(0);
};

/** Invalidate all sessions in the KV store. */
const invalidateAllSessions = async (kv: Deno.Kv) => {
  const allSessionKeys = await unique(kv, [KV_SESSION]);
  for (const key of allSessionKeys) {
    await remove(kv, key);
  }
  console.log(`Invalidated ${allSessionKeys.length} sessions.`);
  return;
};

/** Re-encrypt all data from the oldKv to the newKv for the given keys.
 *
 * @param oldKv The old CryptoKv instance.
 * @param newKv The new CryptoKv instance.
 * @param keys The list of keys to re-encrypt.
 */
const reEncryptDatas = async (oldKv: CryptoKv, newKv: CryptoKv, keys: Deno.KvKey[]) => {
  for (const key of keys) {
    try {
      const value = await oldKv.getAsBlob(key, { consistency: "strong" });
      if (value) await newKv.setBlob(key, value);
    } catch (e) {
      console.error("Error re-encrypting data", { key, e });
    }
  }
};
