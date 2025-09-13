import { TDailyEntryKey } from "@models/Common.ts";
import { EConfigCardType, IContent, IDailyEntry, IEntry } from "@models/Content.ts";
import { compareDate, getDailyEntryKey, getDateTime } from "@utils/common.ts";
import { FIELD_MULTISTRING_DELIMITER, KV_DAILY_ENTRY } from "@utils/constants.ts";
import { getInKv, getLastKey, setInKv } from "@utils/kv/index.ts";
import { getUserKVConfig, UserKVConfigEntry } from "@utils/kv/instance.ts";
import { decodeString, encodeString } from "@utils/string.ts";
import { KV_USER } from "@utils/user/constant.ts";
import { getUserDatasExpiry } from "@utils/user/index.ts";
import { DateTime } from "luxon";

/** Save daily entry in the KV store
 *
 * @param entry The {@linkcode UserKVConfigEntry entry} to get the content for.
 * @param args.contentId The id of the content (config) to save the entry for.
 * @param args.entries The entries to save. Must be a valid `IDailyEntry["entries"]` object.
 * @param args.at The date to save the entry for. If not provided, the current date is used.
 * @returns The content. Null if an error occurred.
 */
export const saveEntries = async (
  entry: UserKVConfigEntry,
  { contentId, entries, at }: { contentId: IContent["id"]; entries: IDailyEntry["entries"]; at?: TDailyEntryKey },
) => {
  // Get date, as AAAA-MM-DD
  const date = getDailyEntryKey(at ?? DateTime.now().toJSDate());
  const cfg = await getUserKVConfig(entry);

  const key = [KV_USER, cfg.uKey, KV_DAILY_ENTRY, date];

  // Use key without check to overwrite it if exists (1/day)
  const created = await setInKv(cfg.kv, key, {
    at: date,
    content: contentId,
    entries,
  }, { expireIn: getUserDatasExpiry(cfg.user) });
  if (created.ok) return await getEntry(cfg, date);
  cfg.kv.close();
  return null;
};

/** Get the daily entry for a user
 *
 * @param entry The {@linkcode UserKVConfigEntry entry} to get the content for.
 * @param args.at The date to get the entry for. If not provided, the last entry is returned.
 * @returns The content. Null if not found.
 */
export const getEntry = async (
  entry: UserKVConfigEntry,
  at?: TDailyEntryKey,
): Promise<IDailyEntry | null> => {
  const cfg = await getUserKVConfig(entry);

  let lastEntryKey = at ? getDailyEntryKey(at) : null;
  if (!lastEntryKey) {
    const lastKey = await getLastKey([KV_USER, cfg.uKey, KV_DAILY_ENTRY]);
    if (lastKey) lastEntryKey = lastKey;
    else return null;
  }

  const key = [KV_USER, cfg.uKey, KV_DAILY_ENTRY, lastEntryKey];
  const res = await getInKv<IDailyEntry>(cfg.kv, key);
  cfg.kv.close();
  return res.value;
};

/** Parse a string entry, from a form, to a valid savable entry. */
export const parseEntry = (entry: IEntry, content: IContent): IEntry => {
  const { name, value } = entry;
  let newValue = value;
  const field = content.fields.find((f) => f.name === name);
  if (!field || !value) return entry;

  try {
    switch (field.type) {
      case EConfigCardType.boolean:
        newValue = value === "true" || value === "on";
        break;
      case EConfigCardType.int:
        newValue = parseInt(value as string);
        break;
      case EConfigCardType.multistring:
        newValue = (value as string).split(FIELD_MULTISTRING_DELIMITER);
        break;
      case EConfigCardType.textarea:
      case EConfigCardType.string:
        newValue = encodeString(value as string);
        break;
      default:
    }
  } catch (e) {
    console.error("Error while parsing entry", e);
  }

  return { name, value: newValue };
};

/** Stringify an entry, to be displayed in a form. */
export const stringifyEntryValue = (entry: IEntry, content: IContent): IEntry["value"] => {
  const { name, value } = entry;
  const field = content.fields.find((f) => f.name === name);
  if (!field || !value) return value;

  try {
    switch (field.type) {
      case EConfigCardType.int:
        return value.toString();
      case EConfigCardType.multistring:
        return (value as string[]).join(FIELD_MULTISTRING_DELIMITER);
      case EConfigCardType.textarea:
      case EConfigCardType.string:
        return decodeString(value as string);
      default:
        return value;
    }
  } catch (e) {
    console.error("Error while parsing entry", e);
  }

  return value;
};

/** Get the list of entries missing a value, for a given user and content.
 *
 * @param entry The {@linkcode UserKVConfigEntry entry} to get the content for.
 * @returns The list of missing entries, as an array of `TDailyEntryKey`.
 */
export const missingEntries = async (entry: UserKVConfigEntry, { days }: { days: number }) => {
  const { kv, uKey } = await getUserKVConfig(entry);

  // Minus 1 day, because we save habit of the previous day, not the current one
  const dateTimeFrom = getDateTime(DateTime.now().minus({ day: 1 }));

  const applicableKeys = Array.from({ length: days }).map((_, i) => ([
    KV_USER,
    uKey,
    KV_DAILY_ENTRY,
    getDailyEntryKey(dateTimeFrom.minus({ day: i })),
  ] as Deno.KvKey));

  const missedDays = [];
  for (const key of applicableKeys) {
    const entry = await getInKv<IDailyEntry>(kv, key);
    if (!entry.value) missedDays.push(key[3]);
  }

  kv.close();
  return missedDays;
};

export const isTodayAlreadySaved = async (entry: UserKVConfigEntry) => {
  const lastDay = await getEntry(entry);
  return DateTime.now().minus({ days: 1 }).toISODate() === lastDay?.at;
};

/** Export the entries for a given user and content, between two dates.
 *
 * @param entry The {@linkcode UserKVConfigEntry entry} to get the content for.
 * @param contentId The id of the content to export the entries for.
 * @param from The start date to export the entries from.
 * @param to The end date to export the entries to.
 * @returns The list of entries, as an array of `IDailyEntry`.
 */
export const exportEntries = async (
  entry: UserKVConfigEntry,
  { contentId, from, to }: { contentId: IContent["id"]; from: TDailyEntryKey; to: TDailyEntryKey },
) => {
  // TODO: this can be improved. For now the dataset is not huge so it is enough, but potential performance issues
  // can arise with a lot of entries.
  //before 600 days: export - Listinkv: 383ms export: 472ms
  //before 6000 days: export - Listinkv: 399ms export: 510ms

  //after 600 days: export - Listinkv: 11.1ms export: 188ms
  //after 6000 days: export - Listinkv: 45.7ms export: 999ms

  const compared = compareDate(from, to);

  if (compared.isAfter) {
    console.warn("Start key is greater than end key. Cannot process export.", { from, to });
    return [];
  }

  const { kv, uKey } = await getUserKVConfig(entry);
  const dateTimeFrom = getDateTime(from);

  const applicableKeys = Array.from({ length: Math.abs(compared.diff.days) + 1 }).map((_, i) => ([
    KV_USER,
    uKey,
    KV_DAILY_ENTRY,
    getDailyEntryKey(dateTimeFrom.plus({ day: i })),
  ] as Deno.KvKey));

  const contents = [];
  for (const key of applicableKeys) {
    const entry = await getInKv<IDailyEntry>(kv, key);
    if (entry.value?.content === contentId) contents.push(entry.value);
  }
  kv.close();
  return contents;
};
