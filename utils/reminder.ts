import { sendDiscordPushNotification } from "@utils/notifications.ts";
import { DateTime } from "luxon";
import { getEntry } from "@utils/entries.ts";

export const checkForDailyAnswer = async () => {
  const lastEntry = await getEntry();

  // Compare if last entry is before current one, by DAY
  const lastEntryDate = DateTime.fromISO(lastEntry?.at ?? '1970-01-01').startOf('day')
  const currentEntryDate = DateTime.now().minus({ days: 1 }).startOf('day')

  if (lastEntryDate < currentEntryDate) {
    const res = await sendDiscordPushNotification({ content: "Answer CCV! 📝" });
    return res.ok;
  }

  return true;
};
