/** Crypto path(s) in KV */
export const KV_CRYPTO = "ccv_crypto";
export const KV_CRYPTO_RECOVERYKEYS = "rk";
export const KV_CRYPTO_KEYS = "k";
export const KV_CRYPTO_ENV = "env";

/** All different crypto keys saved in app */
export const allCryptoKeysMap = ["uDEK", "ssDEK", "stDEK", "KEK", "signK"] as const;
/** Data encryptino keys */
export const DEKsMap = allCryptoKeysMap.filter((k) => k.endsWith("DEK"));

export const DEKsLabelMap: Record<string, string> = {
  uDEK: "User DEK",
  ssDEK: "Sessions DEK",
  stDEK: "Settings DEK",
};


export type TCryptoKeys = typeof allCryptoKeysMap[number];
export type TCryptoDEKs = typeof DEKsMap[number];
export type TKVCryptoEnv = Record<TCryptoKeys, string>;

/** Env name for the all crypto keys. Every keys can be changed using key rotation */
export const CryptoEnvMap: Record<TCryptoKeys, string> = {
    'KEK': `CRYPTO_KEK`,
    'signK': `CRYPTO_SIGNKEY`,
    'uDEK': `CRYPTO_uDEK`,
    'ssDEK': `CRYPTO_ssDEK`,
    'stDEK': `CRYPTO_stDEK`,
}