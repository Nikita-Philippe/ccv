import { ISettings } from "@models/App.ts";
import { DeepPartial } from "@models/Common.ts";
import { MinUser } from "@models/User.ts";
import { KV_SETTINGS } from "@utils/constants.ts";
import { getCryptoKey } from "@utils/crypto/config.ts";
import { getInKv, setInKv } from "@utils/kv/index.ts";
import { openCryptoKv } from "@utils/kv/instance.ts";
import { getUKey } from "@utils/user/crypto.ts";
import { merge } from "lodash";

/** Get the encrypted settings kv store */
const getSettingsCryptoKv = async () => {
  const key = getCryptoKey("stDEK");
  if (!key) throw new Error("DEKs are not init.");
  return await openCryptoKv(key);
};

/** Get the settings, for a specific user.
 *
 * @param {string} id The user id to get the settings for
 * @param {boolean} isIdParsed If the id is already parsed as a Deno.KvKey
 * @returns {Promise<ISettings>} The settings for the user. Empty if not found or id is invalid.
 */
export const getSettings = async (user: MinUser | string): Promise<ISettings> => {
  if (!user) return {};
  const kv = await getSettingsCryptoKv();
  const uKey = typeof user === "string" ? user : await getUKey(user);
  const { value } = await getInKv<ISettings>(kv, [KV_SETTINGS, uKey]);
  kv.close();
  return value ?? {};
};

/** Set the settings element, for a specific user.
 *
 * @param user - The user to set the settings for. If a string is provided, it is considered as the user key.
 * @param value The partial settings to set. Can be a partial of the full settings object. It will user
 * loadash.merge to merge the current settings with the provided one.
 * @param force If true, the provided value will override the current settings. Default is false (merge).
 * @returns The updated settings for the user.
 */
export const setSettings = async (
  user: MinUser,
  value: DeepPartial<ISettings>,
  { force = false }: { force?: boolean } = {},
): Promise<ISettings> => {
  const kv = await getSettingsCryptoKv();
  const uKey = await getUKey(user);

  const { value: currentSettings } = await getInKv<ISettings>(kv, [KV_SETTINGS, uKey]);

  const updateValue: ISettings = force ? value : merge({}, currentSettings ?? {}, value);

  await setInKv(kv, [KV_SETTINGS, uKey], updateValue);

  kv.close();
  return await getSettings(uKey);
};
