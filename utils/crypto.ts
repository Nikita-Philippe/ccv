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
 * @param data The data to sign
 * @returns The signature
 * @throws Error if the data could not be signed
 * @throws Error if the function is called in a client-side context
 */
export async function signData(data: string): Promise<string> {
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  // convert signature (ArrayBuffer) to hex string
  const view = new Uint8Array(signature);
  return Array.from(view).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Verify the provided data
 *
 * @param data The data to verify
 * @param signature The signature to verify the data against
 * @returns True if the data is verified, false otherwise
 * @throws Error if the function is called in a client-side context
 * @throws Error if the data could not be verified
 */
export async function verifyData(data: string, signature: string): Promise<boolean> {
  const sigBuffer = new Uint8Array(
    signature.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)),
  );
  return await crypto.subtle.verify("HMAC", key, sigBuffer, encoder.encode(data));
}
