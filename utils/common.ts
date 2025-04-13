import { DateTime } from "luxon";
import { TDailyEntryKey } from "@models/Common.ts";

/** Get the key for a daily entry. */
export const getDailyEntryKey = (date: TDailyEntryKey): string => {
  let res: string | null = "";
  if (typeof date === "string") res = DateTime.fromISO(date).toISODate();
  else if (date instanceof Date) res = DateTime.fromJSDate(date).toISODate();
  else res = date.toISODate();
  return res ?? "";
};

/** Get a DateTime object from a valid date element.
 * 
 * @param date The date to convert. Can be a string, Date or DateTime object.
 * @returns The DateTime object.
 * @throws Error if the date is not valid.
 */
export const getDateTime = (date: TDailyEntryKey): DateTime => {
  if (typeof date === "string") return DateTime.fromISO(date);
  else if (date instanceof Date) return DateTime.fromJSDate(date);
  else return date;
};
