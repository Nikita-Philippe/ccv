import { sendDiscordPushNotification } from "@utils/notifications.ts";
import { DateTime } from "luxon";
import { getEntry } from "@utils/entries.ts";

export const checkForDailyAnswer = async () => {
  const lastEntry = await getEntry();
  
  console.log("Last entry:", lastEntry);
  console.log("Infos:", {
    hasLastEntry: !!lastEntry,
    lastEntryAt: lastEntry?.at,
    now: DateTime.now(),
    isEntryBeforeNow: lastEntry ? DateTime.fromISO(lastEntry.at) < DateTime.now().minus({ days: 1 }) : "notfound",
    isSending: !lastEntry || DateTime.fromISO(lastEntry.at) < DateTime.now().minus({ days: 1 }),
  });

  if (!lastEntry || DateTime.fromISO(lastEntry.at) < DateTime.now().minus({ days: 1 })) {
    const res = await sendDiscordPushNotification({ content: "Answer CCV! 📝" });
    return res.ok;
  }

  return true;
};
