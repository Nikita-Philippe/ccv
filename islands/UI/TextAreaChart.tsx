import { cn } from "@utils/cn.ts";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import ApexCharts from "apexcharts";
import { IDailyEntry, ITextareaField, TField } from "@models/Content.ts";
import DatePicker from "@islands/Field/DatePicker.tsx";
import { DateTime } from "luxon";
import { TDailyEntryKey } from "@models/Common.ts";
import Card from "@islands/UI/Card.tsx";

type TextAreaChartProps = {
  field: ITextareaField;
  entries: IDailyEntry[];
};

export default function TextAreaChart({ field, entries }: TextAreaChartProps) {
  const [from, setFrom] = useState(entries.at(-1)?.at ?? entries[0].at);
  const [to, setTo] = useState(entries[0].at);

  const displayedEntries: Record<IDailyEntry["at"], string> = useMemo(() => {
    const parsedFrom = DateTime.fromISO(from);
    const parsedTo = DateTime.fromISO(to);
    return entries.reduce((acc, e) => {
      const at = DateTime.fromISO(e.at);
      const foundEntry = e.entries.find((f) => f.name === field.name && Boolean(f.value))?.value;
      if (parsedFrom <= at && at <= parsedTo && foundEntry) acc[e.at] = foundEntry;
      return acc;
    }, {} as Record<IDailyEntry["at"], string>);
  }, [from, to]);

  const [selectedEntry, setSelectedEntry] = useState<string>();

  return (
    <>
      <div class="flex">
        <DatePicker
          defaultValue={from}
          min={entries.at(-1)?.at ?? entries[0].at}
          max={DateTime.fromISO(to).minus({ day: 1 }).toISO() ?? ""}
          onChange={(date) => setFrom(date)}
          customDate={from}
        />
        <DatePicker
          defaultValue={to}
          min={DateTime.fromISO(from).plus({ day: 1 }).toISO() ?? ""}
          max={DateTime.now().toISO() ?? ""}
          onChange={(date) => setTo(date)}
          customDate={to}
        />
      </div>
      <fieldset className="fieldset">
        <legend htmlFor="label" className="fieldset-legend">Entry</legend>
        <select
          defaultValue="Pick an entry"
          className="select"
          value={selectedEntry}
          onChange={(e) =>
            setSelectedEntry((p) => {
              const newVal = e.currentTarget.value;
              if (newVal === p) return undefined;
              return newVal;
            })}
          required
        >
          <option disabled>Pick an entry</option>
          {Object.keys(displayedEntries).map((key) => <option key={key} value={key}>{key}</option>)}
        </select>
      </fieldset>
      {selectedEntry && (
        <Card>
          {displayedEntries[selectedEntry]}
        </Card>
      )}
    </>
  );
}
