import { initCryptoKeys } from "@utils/crypto/config.ts";

// This file is used to check and initialize env in app.
const logAndQuit = (message: string) => {
  console.trace(message);
  throw new Error(`ENV: Error - ${message}`);
};

export default async function () {
  // Get and set app config
  const configFilePath = Deno.env.get("APP_CONFIG") ?? "./ccv.json";
  const configText = Deno.readTextFileSync(configFilePath);
  try {
    const config = JSON.parse(configText);
    globalThis.ccv_config = config;
    console.log(`Loaded config at ${configFilePath}`);
  } catch {
    logAndQuit(`Could not parse ccv config file at ${configFilePath}`);
  }

  const loadedEnvs = Deno.env.toObject();

  // On build, only set GOOGLE envs (mandatory to build)
  if (Deno.args.includes("build") && !["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"].every((e) => !!loadedEnvs[e])) {
    console.warn("ENV: Warning - missing envs. Generate default ones");
    Deno.env.set("GOOGLE_CLIENT_ID", "default_client_id");
    Deno.env.set("GOOGLE_CLIENT_SECRET", "default_client_secret");
  }

  if (Deno.args.includes("build")) return;

  // Check KV path
  if (!!globalThis.ccv_config.kv?.basePath && loadedEnvs.DENO_DEPLOYMENT_ID) {
    logAndQuit("`config.kv.basePath`should not be set in your config when using Deno deploy.");
  }
  if (!globalThis.ccv_config.kv?.basePath && !loadedEnvs.DENO_DEPLOYMENT_ID) {
    logAndQuit("`config.kv.basePath` is not set in your config. Please set it, for data stability.");
  }

  // Check crypto keys
  try {
    await initCryptoKeys();
  } catch (e) {
    logAndQuit(`Crypto keys error: ${(e as Error).message}`);
  }

  // Check and set app version
  if (!loadedEnvs.APP_VERSION) {
    try {
      const config = JSON.parse(Deno.readTextFileSync("deno.json").trim());
      if (config.version) Deno.env.set("APP_VERSION", config.version);
      else throw new Error("Deno.json needs version");
    } catch {
      logAndQuit("`version` not set or could not be read in deno.json config file.");
    }
  }
}
