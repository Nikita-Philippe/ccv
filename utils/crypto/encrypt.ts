import { decodeHex } from "@std/encoding";
import { blobifyData } from "@utils/kv/index.ts";

const IV_SIZE = 12; // AES-GCM standard

function importKey(key: string | Uint8Array): Promise<CryptoKey> {
  const rawKey = typeof key === "string" ? decodeHex(key) : key;
  return crypto.subtle.importKey(
    "raw",
    rawKey,
    "AES-GCM",
    true,
    ["encrypt", "decrypt"],
  );
}

/** Encrypt the provided data with the provided key.
 *
 * Encryption uses AES-GCM with a 12 bytes IV.
 *
 * Use it only to manually encrpyt datas. Prefer using CryptoKv instead if using on
 * a KV store.
 *
 * @param data The data to encrypt
 * @param baseKey The key to encrypt the data with (hex string or CryptoKey)
 * @returns The encrypted data as a Blob, or null if the data could not be encrypted
 */
export const encryptData = async (data: Parameters<typeof blobifyData>[0], baseKey: string | CryptoKey) => {
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(IV_SIZE));
  const key = typeof baseKey === "string" ? await importKey(baseKey) : baseKey;

  const blob = blobifyData(data);
  if (!blob) return null;

  const buffer = await blob.arrayBuffer();

  const { type } = blob;
  return new Blob([
    iv,
    await globalThis.crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      buffer,
    ),
  ], { type });
};

/** Decrypt the provided data with the provided key.
 *
 * Decryption uses AES-GCM with a 12 bytes IV.
 *
 * @param data The data to decrypt
 * @param baseKey The key to decrypt the data with (hex string or CryptoKey)
 * @returns The decrypted data as a Uint8Array
 */
export const decryptData = async (data: Blob, baseKey: string | CryptoKey) => {
  const key = typeof baseKey === "string" ? await importKey(baseKey) : baseKey;

  const blob = new Uint8Array(await data.arrayBuffer());

  const iv = blob.slice(0, IV_SIZE);
  const message = blob.slice(IV_SIZE);
  return new Uint8Array(
    await globalThis.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      message,
    ),
  );
};
