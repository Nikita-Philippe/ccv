import { KV_DAILY_ENTRY } from "@utils/constants.ts";
import { DateTime } from "luxon";
import { getLastKey } from "./kv.ts";
import { compareDate } from "./common.ts";

/** Check if the user has already answered the daily question today.
 *
 * Note: This function is based on the last key (which is entry 'at' date) and not the actual answer. The
 * actual answer is user-based encrypted, so we cannot check it directly.
 *
 * @param {string} userKey - The user key to check.
 * @returns {Promise<boolean>} - A promise that resolves to true if the user has already answered, false otherwise.
 */
export const checkForDailyAnswer = async (userKey: string) => {
  // Base our check on the last key (which is entry 'at' date)
  const lastKey = await getLastKey([KV_DAILY_ENTRY, userKey]);

  return compareDate(lastKey ?? "1970-01-01", DateTime.now().minus({ day: 1 })).isSameOrAfter;
};
