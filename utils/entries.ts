import { PartialBy } from "@models/Common.ts";
import { EConfigCardType, IContent, IEntry, TField } from "@models/Content.ts";
import { DateTime } from "luxon";
import { FIELD_MULTISTRING_DELIMITER, KV_DAILY_ENTRY } from "@utils/constants.ts";
import { IDailyEntry } from "@models/Content.ts";

const kv = await Deno.openKv();

export const saveEntries = async (contentId: IContent["id"], entries: IDailyEntry["entries"], at?: Date) => {
  // Get date, as AAAA-MM-DD
  const date = (at ? DateTime.fromJSDate(at).toISODate() : DateTime.now().toISODate()) ?? "";

  console.log("Creating entry for", date);

  // If entry exists, overwrite it, else create a new one
  const entry = {
    at: date,
    content: contentId,
    entries,
  };
  const created = await kv.set([KV_DAILY_ENTRY, date], entry);
  console.log("created", created);
  if (created.ok) return await getEntry(date);
  return null;
};

export const getEntry = async (at: Date | string) => {
  const date = typeof at === "string" ? at : DateTime.fromJSDate(at).toISODate() ?? "";
  const entry = await kv.get<IDailyEntry>([KV_DAILY_ENTRY, date]);
  return entry.value;
};

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
      case EConfigCardType.textarea: // TODO: encode textarea
      case EConfigCardType.string:
      default:
    }
  } catch (e) {
    console.error("Error while parsing entry", e);
  }

  return { name, value: newValue };
};
