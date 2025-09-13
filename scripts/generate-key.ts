import { decodeHex, encodeHex } from "https://deno.land/std@0.216.0/encoding/hex.ts";

function generateKey(bitLength: 128 | 192 | 256 = 256): string {
  if (![128, 192, 256].includes(bitLength)) {
    throw new RangeError("Bit length must be 128, 192, or 256.");
  }
  const raw = globalThis.crypto.getRandomValues(new Uint8Array(bitLength / 8));
  return encodeHex(raw);
}

const generateCryptoKey = async (data: string): Promise<CryptoKey> => {
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
      salt: decodeHex(generateKey()),
      iterations: 600000,
    },
    keyedId,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );
};

const generateEncryptionKey = async (): Promise<string> => {
  const cryptoKey = await generateCryptoKey(generateKey());
  const rawKey = await crypto.subtle.exportKey("raw", cryptoKey);
  return encodeHex(rawKey);
};

generateEncryptionKey().then((key) => {
  console.log("Generated encryption key:", key);
});
