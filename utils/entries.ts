import { PartialBy, TDailyEntryKey } from "@models/Common.ts";
import { EConfigCardType, IContent, IEntry, TField } from "@models/Content.ts";
import { DateTime } from "luxon";
import { FIELD_MULTISTRING_DELIMITER, KV_DAILY_ENTRY } from "@utils/constants.ts";
import { IDailyEntry } from "@models/Content.ts";
import { getDailyEntryKey } from "@utils/common.ts";
import { decodeString, encodeString } from "@utils/string.ts";

const kv = await Deno.openKv();

export const saveEntries = async (contentId: IContent["id"], entries: IDailyEntry["entries"], at?: TDailyEntryKey) => {
  // Get date, as AAAA-MM-DD
  const date = getDailyEntryKey(at ?? DateTime.now().toJSDate());

  // If entry exists, overwrite it, else create a new one
  const entry = {
    at: date,
    content: contentId,
    entries,
  };
  const created = await kv.set([KV_DAILY_ENTRY, date], entry);
  if (created.ok) return await getEntry(date);
  return null;
};

export const getEntry = async (at?: TDailyEntryKey): Promise<IDailyEntry | null> => {
  if (at) {
    const entry = await kv.get<IDailyEntry>([KV_DAILY_ENTRY, getDailyEntryKey(at)]);
    return entry.value;
  } else {
    // Reverse res and get the first one
    const entries = kv.list<IDailyEntry>({ prefix: [KV_DAILY_ENTRY] }, {
      limit: 1,
      reverse: true,
    });
    const contents = [];
    for await (const entry of entries) contents.push(entry.value);
    return contents.pop() ?? null;
  }
};

/** Parse a string entry, from a form, to a valid savable entry. */
export const parseEntry = (entry: IEntry, content: IContent): IEntry => {
  const { name, value } = entry;
  let newValue = value;
  const field = content.fields.find((f) => f.name === name);
  if (!field) return entry;

  try {
    switch (field.type) {
      case EConfigCardType.boolean:
        newValue = value === "true" || value === "on";
        break;
      case EConfigCardType.int:
        newValue = parseInt(value);
        break;
      case EConfigCardType.multistring:
        newValue = value.split(FIELD_MULTISTRING_DELIMITER);
        break;
      case EConfigCardType.textarea:
      case EConfigCardType.string:
        newValue = encodeString(value);
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
  if (!field) return value;

  try {
    switch (field.type) {
      case EConfigCardType.int:
        return value.toString();
      case EConfigCardType.multistring:
        return value.join(FIELD_MULTISTRING_DELIMITER);
      case EConfigCardType.textarea:
      case EConfigCardType.string:
        return decodeString(value);
      default:
        return value;
    }
  } catch (e) {
    console.error("Error while parsing entry", e);
  }

  return value;
};

export const missingEntries = async (days: number): Promise<string[]> => {
  const allDays = Array.from({ length: days }, (_, i) => i).map((i) => getDailyEntryKey(DateTime.now().minus({ days: i + 1 })));
  const entries = await kv.list<IDailyEntry>({ prefix: [KV_DAILY_ENTRY] }, {
    limit: days,
    reverse: true,
  });
  for await (const entry of entries) {
    const date = getDailyEntryKey(entry.value.at);
    if (date && allDays.includes(date)) {
      allDays.splice(allDays.indexOf(date), 1);
    }
  }
  return allDays
};

export const isTodayAlreadySaved = async (): Promise<boolean> => {
  const lastDay = await getEntry();
  return DateTime.now().minus({ days: 1 }).toISODate() === lastDay?.at;
}