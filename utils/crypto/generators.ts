/** This file exports functions to generate cryptographic keys for ccv.
 *
 * @author Nikitap
 */

import { decodeHex, encodeHex } from "@std/encoding";
import { getCryptoKey } from "./config.ts";
import { DEKsMap, TCryptoDEKs } from "./constants.ts";

/** Generate a cryptographically secure random key of the specified bit length.
 *
 * @param bitLength - The length of the key in bits. Must be 128, 192, or 256. Default is 256.
 * @returns {string} The generated key as a hexadecimal string.
 */
export function generateKey(bitLength: 128 | 192 | 256 = 256): string {
  if (![128, 192, 256].includes(bitLength)) {
    throw new RangeError("Bit length must be 128, 192, or 256.");
  }
  const raw = globalThis.crypto.getRandomValues(new Uint8Array(bitLength / 8));
  return encodeHex(raw);
}

/** Get the crypto key used to encrypt/decrypt various data
 *
 * @param {string} data The data to derive the key from
 * @returns {Promise<CryptoKey>} The crypto key
 */
export const generateCryptoKey = async (data: string): Promise<CryptoKey> => {
  const keyedId = await crypto.subtle.importKey(
    "raw",
    decodeHex(data),
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  );
  return await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: decodeHex(globalThis.ccv_config.crypto?.derive_salt || ""),
      iterations: globalThis.ccv_config.crypto?.derive_iterations || 600000,
    },
    keyedId,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );
};

/** Generate a new encryption key (DEK, KEK, or else) */
export const generateEncryptionKey = async (): Promise<string> => {
  const cryptoKey = await generateCryptoKey(generateKey());
  const rawKey = await crypto.subtle.exportKey("raw", cryptoKey);
  return encodeHex(rawKey);
};

/** Generate all new DEKs (Data Encryption Keys) for all types */
export const generateDEKs = async (keys?: typeof DEKsMap) => {
  const res = {} as Record<TCryptoDEKs, { old: string | undefined; new: string }>;

  for (const dek of (keys ?? DEKsMap)) {
    const newKey = await generateEncryptionKey();
    res[dek] = {
      old: getCryptoKey(dek),
      new: newKey,
    };
  }

  return res;
};
