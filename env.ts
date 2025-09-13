import { initCryptoKeys } from "@utils/crypto/config.ts";
import ccv_config from "./ccv.json" with { type: "json" };
import { IAppConfig } from "@models/App.ts";

// This file is used to check and initialize env in app.
const logAndQuit = (message: string) => {
  console.error(`ENV: Error - ${message}`);
  Deno.exit(1);
};

export default async function () {
  const loadedEnvs = Deno.env.toObject();

  // On build, only set GOOGLE envs (mandatory to build)
  if (Deno.args.includes("build") && !["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"].every((e) => !!loadedEnvs[e])) {
    console.warn("ENV: Warning - missing envs. Generate default ones");
    Deno.env.set("GOOGLE_CLIENT_ID", "default_client_id");
    Deno.env.set("GOOGLE_CLIENT_SECRET", "default_client_secret");
  }

  if (Deno.args.includes("build")) return;

  // Check KV_PATH
  if (loadedEnvs.KV_PATH && loadedEnvs.DENO_DEPLOYMENT_ID) logAndQuit("KV_PATH should not be set in Deno deploy.");
  if (!loadedEnvs.KV_PATH && !loadedEnvs.DENO_DEPLOYMENT_ID) {
    logAndQuit("KV_PATH is not set. Please set it, for data stability.");
  }

  // Check crypto keys
  try {
    await initCryptoKeys();
  } catch (e) {
    logAndQuit(`Crypto keys error: ${(e as Error).message}`);
  }

  // Get and set app config
  globalThis.ccv_config = (ccv_config || {}) as Readonly<IAppConfig>;

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
