import { CryptoKv } from "@kitsonk/kv-toolbox/crypto";
import { ISettings } from "@models/App.ts";
import { IAuthenticatedUser } from "@models/User.ts";
import { getCryptoKey, hashUserId } from "@utils/crypto.ts";
import { getInKv, setInKv } from "@utils/kv.ts";
import { KV_SETTINGS, KV_SETTINGS_NOTIFICATIONS } from "./constants.ts";

/** Here are all the settings entries available */
const settingsEntries: Record<keyof ISettings, string> = {
  "notifications": KV_SETTINGS_NOTIFICATIONS,
};

/** Get the encrypted settings kv store
 * 
 * @returns {Promise<CryptoKv>} The encrypted kv store
 */
const getSettingsCryptoKv = async () => {
  // Settings Encryption Key
  const SEK = Deno.env.get("CRYPTO_SEK") || "default_settings_secret";
  const cryptoKey = await getCryptoKey(SEK);
  const key = await crypto.subtle.exportKey("raw", cryptoKey);
  const kv = await Deno.openKv(Deno.env.get("KV_PATH"));
  return await new CryptoKv(kv, new Uint8Array(key));
};

/** Get the settings, for a specific user.
 * 
 * @param {string} id The user id to get the settings for
 * @param {boolean} isIdParsed If the id is already parsed as a Deno.KvKey
 * @returns {Promise<ISettings>} The settings for the user. Empty if not found or id is invalid.
 * */
export const getSettings = async (id: IAuthenticatedUser["id"], isIdParsed?: boolean): Promise<ISettings> => {
  if (!id) return {};
  const kv = await getSettingsCryptoKv();
  const kvKeyId = isIdParsed ? id : await hashUserId(id);
  const settings: ISettings = {};
  for (const [key, entryKey] of Object.entries(settingsEntries) as Array<[keyof ISettings, string]>) {
    const { value } = await getInKv<ISettings[typeof key]>(
      kv,
      [KV_SETTINGS, kvKeyId, entryKey],
    );
    if (value) settings[key] = value;
  }
  kv.close();
  return settings;
};

/** Set the settings element, for a specific user.
 * 
 * @param {string} id The user id to set the settings for
 * @param {keyof ISettings} key The key of the settings to set
 * @param {ISettings[keyof ISettings]} value The value of the settings to set. Must be from the key provided.
 * @param {{ force?: boolean }} options Optionnal. Should the value be merge, or override the current value using `force` ?
 * @returns {Promise<ISettings>} The updated settings for the user.
 * @example
 * ```ts
 * const settings = await setSettings(user.id, "notifications", {
 *   discord_webhook: "mydiscordwebhook",
 *   start: "08:00",
 *   end: "18:00",
 * });
 */
export const setSettings = async <T extends keyof ISettings>(
  id: IAuthenticatedUser["id"],
  key: T,
  value: ISettings[T],
  { force = false }: { force?: boolean } = {},
): Promise<ISettings> => {
  if (!settingsEntries[key]) throw new Error("Invalid settings entry");

  const kv = await getSettingsCryptoKv();
  const kvKeyId = await hashUserId(id);

  const { value: currentSettings } = await getInKv<ISettings[typeof key]>(
    kv,
    [KV_SETTINGS, kvKeyId, settingsEntries[key]],
  );

  const updateValue = force ? value : { ...currentSettings, ...value };

  await setInKv(kv, [KV_SETTINGS, kvKeyId, settingsEntries[key]], updateValue);

  kv.close();
  return await getSettings(id);
};
