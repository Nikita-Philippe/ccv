import DatePicker, { DateToFR } from "@islands/Field/DatePicker.tsx";
import Card from "../components/UI/Card.tsx";
import { cn } from "@utils/cn.ts";
import { getDailyEntryKey } from "@utils/common.ts";
import { difference } from "lodash";
import { DateTime } from "luxon";
import { JSX } from "preact";
import { useCallback, useState } from "preact/hooks";
import Button from "@islands/UI/Button.tsx";

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
      <div className="flex items-center gap-2">
        <Button type="submit" class="btn btn-primary grow" onClick={handleClick}>
          Save
        </Button>
        <label className={"input max-w-[220px]"}>
          <span className={"label"}>Entry date</span>
          <DatePicker defaultValue={chosenDate} onChange={(date) => setChosenDate(date)} customDate={chosenDate} />
          <input type="hidden" name="date" value={chosenDate} />
        </label>
      </div>
      {(missingDays ?? []).length > 0 && (
        <Card
          title="Missing entries"
          sx={{ container: "h-fit", content: "grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))]" }}
        >
          {missingDays.map((day) => (
            <button
              type="button"
              class={cn("btn whitespace-nowrap", chosenDate === day && "btn-primary")}
              onClick={() => setChosenDate(day)}
              key={day}
            >
              {DateToFR(day)}
            </button>
          ))}
        </Card>
      )}
    </>
  );
}
