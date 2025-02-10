import { PartialBy } from "../models/Common.ts";
import { ISettings } from "../models/Content.ts";
import { KV_CONTENT, KV_SETTINGS } from "./constants.ts";

const kv = await Deno.openKv();

export const getSettings = async (id: ISettings["id"]): Promise<ISettings | null> => {
  const { value } = await kv.get<ISettings>([KV_SETTINGS, id]);
  return value;
};

export const setSettings = async (settings: PartialBy<ISettings, "id">): Promise<ISettings | null> => {
  // Set a new id, to create a new settings
  if (!settings.id) settings.id = crypto.randomUUID();
  const res = await kv.set([KV_CONTENT, settings.id], settings);
  if (res.ok) return await getSettings(settings.id);
  else return null;
};