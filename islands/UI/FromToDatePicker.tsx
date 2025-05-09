import { DateTime } from "luxon";
import { useState } from "preact/hooks";
import DatePicker from "@islands/Field/DatePicker.tsx";
import { getDailyEntryKey } from "@utils/common.ts";

type FromToDatePickerProps = {
  setFromDate: (date: DateTime) => void;
  setToDate: (date: DateTime) => void;
  defaultFrom?: DateTime;
  defaultTo?: DateTime;
  min?: DateTime;
  max?: DateTime;
};

export default function FromToDatePicker({
  setFromDate,
  setToDate,
  defaultFrom,
  defaultTo,
  min,
  max,
}: FromToDatePickerProps) {
  const [from, setFrom] = useState(defaultFrom ?? DateTime.now().minus({ day: 7 }));
  const [to, setTo] = useState(defaultTo ?? DateTime.now());

  const handleFromChange = (date: string) => {
    const parsedDate = DateTime.fromISO(date);
    if (!parsedDate.isValid) return;
    setFrom(parsedDate);
    setFromDate(parsedDate);
  };

  const handleToChange = (date: string) => {
    const parsedDate = DateTime.fromISO(date);
    if (!parsedDate.isValid) return;
    setTo(parsedDate);
    setToDate(parsedDate);
  };

  return (
    <div class="flex gap-2">
      <label class="input max-w-48">
        <span class="label">From</span>
        <DatePicker
          defaultValue={getDailyEntryKey(from)}
          min={min ? getDailyEntryKey(min) : undefined}
          max={to.minus({ day: 1 }).toISO() ?? undefined}
          onChange={handleFromChange}
          customDate={getDailyEntryKey(from)}
        />
      </label>
      <label class="input max-w-48">
        <span class="label">To</span>
        <DatePicker
          defaultValue={getDailyEntryKey(to)}
          min={from.plus({ day: 1 }).toISO() ?? undefined}
          max={max ? getDailyEntryKey(max) : undefined}
          onChange={handleToChange}
          customDate={getDailyEntryKey(to)}
        />
      </label>
    </div>
  );
}
