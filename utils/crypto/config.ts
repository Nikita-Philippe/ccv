/** This file exports functions to check the crypto config on CCV.
 *
 * @author Nikitap
 */

import {
  allCryptoKeysMap,
  CryptoEnvMap,
  DEKsMap,
  KV_CRYPTO,
  KV_CRYPTO_ENV,
  TCryptoKeys,
  TKVCryptoEnv,
} from "@utils/crypto/constants.ts";
import { rotateDEK, rotateSignKey } from "@utils/crypto/rotate.ts";
import { getInKv, setInKv } from "@utils/kv/index.ts";
import { openCryptoKv } from "@utils/kv/instance.ts";

/** Get the DEK (from env)
 *
 * @param The CRYPTO_DEK type. Accepts the Enum or the litteral string.
 * @returns The env, or undefined if not found
 */
export const getCryptoKey = (k: TCryptoKeys) => Deno.env.get(CryptoEnvMap[k]);

/** Initialize all crypto keys in the system. This function must be called at app start. */
export const initCryptoKeys = async () => {
  const KEK = getCryptoKey("KEK");

  if (!KEK) {
    throw new Error(
      "A 'CRYPTO_KEK' should be set in your envs. Use `deno scripts/generate-key.ts` to generate a valid key.",
    );
  }

  const kv = await openCryptoKv(KEK);

  let entry = await getInKv<TKVCryptoEnv>(kv, [KV_CRYPTO, KV_CRYPTO_ENV]);

  if (DEKsMap.some((k) => !entry.value?.[k])) await rotateDEK();
  if (!entry.value?.["signK"]) await rotateSignKey();

  entry = await getInKv<TKVCryptoEnv>(kv, [KV_CRYPTO, KV_CRYPTO_ENV]);

  if (!entry.value || !allCryptoKeysMap.filter((k) => k !== "KEK").every((k) => Boolean(entry.value?.[k]))) {
    throw new Error("Could not initialize crypto keys.");
  } else {
    Object.entries(entry.value).forEach(([k, v]) => {
      if (CryptoEnvMap[k as TCryptoKeys]) {
        Deno.env.set(CryptoEnvMap[k as TCryptoKeys], v);
      } else {
        console.warn(`Unknown crypto key in KV: ${k}`);
      }
    });
  }
};

/** Save a crypto key in env and in KV
 *
 * @param key The crypto key to save
 * @param value The value to save
 * @returns True if the key was saved, false otherwise
 * @throws Throws an error if the KEK is not set in envs
 */
export const saveKey = async (key: TCryptoKeys, value: string) => {
  const KEK = getCryptoKey("KEK");
  if (!KEK) throw new Error(`A 'CRYPTO_KEK' should be set in your envs.`);

  Deno.env.set(CryptoEnvMap[key], value);

  const kv = await openCryptoKv(KEK);

  const entry = await getInKv<TKVCryptoEnv>(kv, [KV_CRYPTO, KV_CRYPTO_ENV]);

  const res = await setInKv(kv, [KV_CRYPTO, KV_CRYPTO_ENV], {
    ...(entry.value ?? {}),
    [key]: value,
  });

  kv.close();

  return res.ok;
};
