import { DateTime } from "luxon";
import { TDailyEntryKey } from "@models/Common.ts";

/** Get the key for a daily entry. */
export const getDailyEntryKey = (date: TDailyEntryKey): string => {
    let res: string | null = ""
    if (typeof date === "string") res = DateTime.fromISO(date).toISODate();
    else if (date instanceof Date) res = DateTime.fromJSDate(date).toISODate();
    else res = date.toISODate();
    return res ?? "";
}