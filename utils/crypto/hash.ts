/** This file exports functions to sign and hash datas for ccv.
 *
 * @author Nikitap
 */

import { decodeHex, encodeHex } from "@std/encoding";
import { getCryptoKey } from "./config.ts";

const getSigningKey = async () => {
  const key = getCryptoKey("signK");
  if (!key) throw new Error("No signing key found in envs.");

  return await crypto.subtle.importKey(
    "raw",
    decodeHex(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
};

/** Encode a string to hex format
 *
 * @param {string} str The string to encode
 * @returns {string} The encoded string
 */
export const encodeStrToHex = (str: string) => {
  // Make sure to return a hex string
  str = encodeHex(new TextEncoder().encode(str));

  // Ensure data is in hex format and compatible (divisible by 2)
  if (str.length % 2 !== 0) str = str + "0";

  return str;
};

/** Sign the provided data.
 *
 * Signing means it encrypts the data. Use it to verify authenticity (ex.
 * a user id is the correct one expected)
 *
 * @param {string} data The data to sign
 * @returns {Promise<string>} The signature of the data
 */
export async function signData(data: string): Promise<string> {
  const key = await getSigningKey();
  const signature = await crypto.subtle.sign("HMAC", key, decodeHex(encodeStrToHex(data)));
  return encodeHex(signature);
}

/** Verify the provided data
 *
 * @param {string} data The data to verify
 * @param {string} signature The signature to verify
 * @returns {Promise<boolean>} True if the signature is valid, false otherwise
 */
export async function verifyData(data: string, signature: string): Promise<boolean> {
  try {
    const key = await getSigningKey();
    return await crypto.subtle.verify("HMAC", key, decodeHex(signature), decodeHex(encodeStrToHex(data)));
  } catch (e) {
    console.error("Error verifying data", e);
    return false;
  }
}

/** Hash the provided data
 *
 * @param {string} data The data to sign
 * @returns {Promise<string>} The signature of the data
 */
export async function hashData(data: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-512", decodeHex(encodeStrToHex(data)));
  return encodeHex(new Uint8Array(hash));
}
