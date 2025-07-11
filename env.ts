// This file is used to check and initialize env in app.
const logAndQuit = (message: string) => {
  console.error(`ENV: Error - ${message}`);
  Deno.exit(1);
};

export default function () {
  const loadedEnvs = Deno.env.toObject();

  // On build, only set GOOGLE envs (mandatory to build)
  if (Deno.args.includes("build") && !["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"].every((e) => !!loadedEnvs[e])) {
    console.warn("ENV: Warning - missing envs. Generate default ones");
    Deno.env.set("GOOGLE_CLIENT_ID", "default_client_id");
    Deno.env.set("GOOGLE_CLIENT_SECRET", "default_client_secret");
  }

  if (Deno.args.includes("build")) return;

  // Check crypto related envs
  ["PUBLIC_DEK", "CRYPTO_DATA_DERIVE_SALT", "CRYPTO_SEK"].map((key) => {
    if (!loadedEnvs[key] || loadedEnvs[key].length < 32) {
      logAndQuit(`${key} is not set or size is < 32.\n Generate one using "deno scripts/generate-key.ts"`);
    }
  });

  // Check KV_PATH
  if (loadedEnvs.KV_PATH && loadedEnvs.DENO_DEPLOYMENT_ID) logAndQuit("KV_PATH should not be set in Deno deploy.")
  if (!loadedEnvs.KV_PATH && !loadedEnvs.DENO_DEPLOYMENT_ID) logAndQuit("KV_PATH is not set. Please set it, for data stability.");

  // General purpose envs
  ["OAUTH_REDIRECTURI"].map((key) => !loadedEnvs[key] ? logAndQuit(`${key} is not set or size is < 32.`) : "");
}
