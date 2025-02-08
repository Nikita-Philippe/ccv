import { sendDiscordPushNotification } from "@utils/notifications.ts";
import { DateTime } from "luxon";
import { getEntry } from "@utils/entries.ts";

export const checkForDailyAnswer = async () => {
  const lastEntry = await getEntry();

  if (!lastEntry || DateTime.fromISO(lastEntry.at) < DateTime.now()) {
    const res = await sendDiscordPushNotification({ content: "Answer CCV! 📝" });
    return res.ok;
  }

  return true;
};
