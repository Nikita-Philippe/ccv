import { TDailyEntryKey } from "@models/Common.ts";
import { EConfigCardType, IContent, IDailyEntry, IEntry } from "@models/Content.ts";
import { TUser } from "@models/User.ts";
import { compareDate, getDailyEntryKey, getDateTime } from "@utils/common.ts";
import { FIELD_MULTISTRING_DELIMITER, KV_DAILY_ENTRY } from "@utils/constants.ts";
import { hashUserId } from "@utils/crypto.ts";
import { TKv } from "@utils/database.ts";
import { getInKv, getLastKey, listInKv, setInKv } from "@utils/kv.ts";
import { decodeString, encodeString } from "@utils/string.ts";
import { DateTime } from "luxon";
import { getUserDatasExpiry } from "@utils/user.ts";

const getEntryKey = async (userId: string, dailyKey: string): Promise<Deno.KvKey> => {
  const kvKeyId = await hashUserId(userId);
  return [KV_DAILY_ENTRY, kvKeyId, dailyKey];
};

/** Save daily entry in the KV store
 *
 * @param kv The user's cryptoKv store. Set by default using `requestTransaction`.
 * @param user The user to get the content for. Set by default using `getUserBySession`.
 * @param args.contentId The id of the content (config) to save the entry for.
 * @param args.entries The entries to save. Must be a valid `IDailyEntry["entries"]` object.
 * @param args.at The date to save the entry for. If not provided, the current date is used.
 * @returns The content. Null if an error occurred.
 */
export const saveEntries = async (
  kv: TKv,
  user: TUser,
  { contentId, entries, at }: { contentId: IContent["id"]; entries: IDailyEntry["entries"]; at?: TDailyEntryKey },
) => {
  // Get date, as AAAA-MM-DD
  const date = getDailyEntryKey(at ?? DateTime.now().toJSDate());
  const key = await getEntryKey(user.id, date);

  // Use key without check to overwrite it if exists (1/day)
  const created = await setInKv(kv, key, {
    at: date,
    content: contentId,
    entries,
  }, { expireIn: getUserDatasExpiry(user) });
  if (created.ok) return await getEntry(kv, user, date);
  return null;
};

/** Get the daily entry for a user
 *
 * @param kv The user's cryptoKv store. Set by default using `requestTransaction`.
 * @param user The user to get the content for. Set by default using `getUserBySession`.
 * @param args.at The date to get the entry for. If not provided, the last entry is returned.
 * @returns The content. Null if not found.
 */
export const getEntry = async (
  kv: TKv,
  user: TUser,
  at?: TDailyEntryKey,
): Promise<IDailyEntry | null> => {
  const kvKeyId = await hashUserId(user.id);

  let lastEntryKey = at ? getDailyEntryKey(at) : null;
  if (!lastEntryKey) {
    const lastKey = await getLastKey([KV_DAILY_ENTRY, kvKeyId]);
    if (lastKey) lastEntryKey = lastKey;
    else return null;
  }

  const key = await getEntryKey(user.id, lastEntryKey);
  const entry = await getInKv<IDailyEntry>(kv, key);
  return entry.value;
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
 * @param kv The user's cryptoKv store. Set by default using `requestTransaction`.
 * @param user The user to get the content for. Set by default using `getUserBySession`.
 * @returns The list of missing entries, as an array of `TDailyEntryKey`.
 */
export const missingEntries = async (kv: TKv, user: TUser, { days }: { days: number }) => {
  const allDays = Array.from({ length: days }, (_, i) => i).map((i) =>
    getDailyEntryKey(DateTime.now().minus({ days: i + 1 }))
  );
  const kvKeyId = await hashUserId(user.id);
  const entries = await listInKv<IDailyEntry>(kv, { prefix: [KV_DAILY_ENTRY, kvKeyId] }, {
    limit: days,
    reverse: true,
  });
  for await (const entry of entries) {
    if (!entry.value) continue;
    const date = getDailyEntryKey(entry.value.at);
    if (date && allDays.includes(date)) {
      allDays.splice(allDays.indexOf(date), 1);
    }
  }
  return allDays;
};

export const isTodayAlreadySaved = async (kv: TKv, user: TUser) => {
  const lastDay = await getEntry(kv, user);
  return DateTime.now().minus({ days: 1 }).toISODate() === lastDay?.at;
};

/** Export the entries for a given user and content, between two dates.
 *
 * @param kv The user's cryptoKv store. Set by default using `requestTransaction`.
 * @param user The user to get the content for. Set by default using `getUserBySession`.
 * @param contentId The id of the content to export the entries for.
 * @param from The start date to export the entries from.
 * @param to The end date to export the entries to.
 * @returns The list of entries, as an array of `IDailyEntry`.
 */
export const exportEntries = async (
  kv: TKv,
  user: TUser,
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
  
  const kvKeyId = await hashUserId(user.id);
  const dateTimeFrom = getDateTime(from);

  const applicableKeys = Array.from({ length: Math.abs(compared.diff.days) + 1 }).map((_, i) => ([
    KV_DAILY_ENTRY,
    kvKeyId,
    getDailyEntryKey(dateTimeFrom.plus({ day: i })),
  ] as Deno.KvKey));

  const contents = [];
  for (const key of applicableKeys) {
    const entry = await getInKv<IDailyEntry>(kv, key);
    if (entry.value?.content === contentId) contents.push(entry.value);
  }
  return contents;
};
