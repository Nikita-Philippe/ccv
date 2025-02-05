import { DateTime } from "luxon";
import { JSX } from "preact";
import { useCallback, useState } from "preact/hooks";
import { getDailyEntryKey } from "@utils/common.ts";
import { difference } from "lodash";

type Props = {
  missingDays: string[];
  daysChecked: number;
};

/** Save button for daily entries form.
 * 
 * Adds also the date picker and the missing days.
 */
export default function SaveButton({ missingDays, daysChecked }: Props) {
  const alreadySavedDays = difference(
    // All days checked
    Array.from({ length: daysChecked }, (_, i) => i).map((i) =>
      getDailyEntryKey(DateTime.now().minus({ days: i + 1 }))
    ),
    missingDays,
  );

  const [chosenDate, setChosenDate] = useState<string>(DateTime.now().minus({ days: 1 }).toISODate());

  const handleClick = useCallback((e: JSX.TargetedMouseEvent<HTMLButtonElement>) => {
    if (alreadySavedDays.includes(chosenDate) && !confirm("You already saved for this day. Continue?")) {
      e.preventDefault();
    }
  }, [alreadySavedDays, chosenDate]);

  return (
    <>
      <button type="submit" onClick={handleClick}>
        Save
      </button>
      <input
        type="date"
        name="date"
        defaultValue={chosenDate}
        onChange={(e) => setChosenDate(e.currentTarget.value)}
      />
      {missingDays?.map((day) => <p>Missing entry for {DateTime.fromISO(day).setLocale("fr").toLocaleString()}</p>)}
    </>
  );
}
