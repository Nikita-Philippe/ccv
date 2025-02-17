import { getCookies } from "$std/http/cookie.ts";
import { encodeHex } from "jsr:@std/encoding/hex";

export const verifyBetaCode = async (code: string, isHashed?: boolean) => {
  let hash = code;
  if (!isHashed) {
    hash = await getHashedCode(code);
  }

  const envHashDelimiter = "/*BC*/";

  const codes = Deno.env.get("BETA_CODES")?.split(envHashDelimiter).map((code) => code.trim());

  return codes?.includes(hash);
};

export const getHashedCode = async (code: string) => {
  const hex = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(code));
  return encodeHex(hex);
};
