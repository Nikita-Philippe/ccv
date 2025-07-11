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

/** Compare two daily entry keys. The first arg is the current date, the second is the date to compare against.
 *
 * @param current The current date to compare.
 * @param last The last date to compare.
 * @returns An object with three boolean properties: isBefore, isAfter and isSame.
 * @example
 * ```ts
 * const result = compareDate("2023-10-01", "2023-10-02");
 * console.log(result.isBefore); // true
 * ```
 */
export const compareDate = (current: TDailyEntryKey, last: TDailyEntryKey) => {
  const currentDate = getDateTime(current).startOf("day");
  const lastDate = getDateTime(last).startOf("day");

  return {
    isBefore: currentDate < lastDate,
    isAfter: currentDate > lastDate,
    isSame: +currentDate === +lastDate,
    isSameOrBefore: currentDate <= lastDate,
    isSameOrAfter: currentDate >= lastDate,
    diff: currentDate.diff(lastDate, ["days", "hours", "minutes", "seconds"]),
  };
};
