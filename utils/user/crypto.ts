import { MinUser } from "@models/User.ts";
import { getCryptoKey } from "@utils/crypto/config.ts";
import { KV_CRYPTO, KV_CRYPTO_KEYS } from "@utils/crypto/constants.ts";
import { generateEncryptionKey } from "@utils/crypto/generators.ts";
import { hashData } from "@utils/crypto/hash.ts";
import { getInKv, setInKv } from "@utils/kv/index.ts";
import { openCryptoKv } from "@utils/kv/instance.ts";

/** Open a crypto kv instance for the user to retrieve his crypto key */
const getUserCryptoKV = async () => {
  const cryptoKey = getCryptoKey("uDEK");
  if (!cryptoKey) throw new Error("DEKs are not init.");

  return await openCryptoKv(cryptoKey);
};

/** Get the encryption key for the user
 *
 * @param {TUser} The user to get the key for
 * @returns {Promise<string>} The crypto key as a string
 * @throws Throws an error if the DEKs are not init or if the key cannot be generated
 */
export const getUUDEK = async (user: MinUser, retry: boolean = false): Promise<string> => {
  const kv = await getUserCryptoKV();

  const userKey = await getUKey(user);
  const res = await getInKv<string>(kv, [
    KV_CRYPTO,
    KV_CRYPTO_KEYS,
    "uDEK",
    userKey,
    KV_CRYPTO_KEYS,
  ]);

  if (!res?.value) {
    if (retry) throw new Error(`Could get uuDek for user ${userKey}`);
    else {
      const res = await generateUUDEK(user);
      if (!res) throw new Error(`Could generate uuDek for user ${userKey}`);
      return await getUUDEK(user, true);
    }
  } else {
    return res.value;
  }
};

/** Get the unique user id key. It will be used as part of the path to store user data in the KV.
 *
 * Authenticated users have a specific prefix, while public users share a common one. This prefix
 * is used to generate the user key, thus ensuring a very low collision probability.
 */
export const getUKey = async (user: MinUser) => {
  return user.isAuthenticated ? await hashData(`${user.provider}_` + String(user.id)) : `public_${String(user.id)}`;
};

/** Generate and store a new uuDEK for the user
 *
 * The uuDEK is a user-unique Data Encryption Key, used to encrypt/decrypt user data.
 *
 * @param user The user to generate the key for
 * @returns True if the key was generated and stored successfully, false otherwise
 * @throws An error if the DEKs are not initialized
 */
const generateUUDEK = async (user: MinUser) => {
  const kv = await getUserCryptoKV();

  const uudek = await generateEncryptionKey();

  const userKey = await getUKey(user);
  const path = [KV_CRYPTO, KV_CRYPTO_KEYS, "uDEK", userKey, KV_CRYPTO_KEYS];

  const res = await setInKv(kv, path, uudek);

  kv.close();

  return res.ok;
};
