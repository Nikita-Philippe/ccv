import Card from "../../components/UI/Card.tsx";
import { IDailyEntry, ITextareaField } from "@models/Content.ts";
import { DateTime } from "luxon";
import { useMemo, useState } from "preact/hooks";

type TextAreaChartProps = {
  field: ITextareaField;
  entries: IDailyEntry[];
};

export default function TextAreaChart({ field, entries }: TextAreaChartProps) {
  const from = entries.at(-1)?.at ?? entries[0]?.at;
  const to = entries[0]?.at;

  const displayedEntries: Record<IDailyEntry["at"], string> = useMemo(() => {
    if (!from || !to) return {};
    const parsedFrom = DateTime.fromISO(from);
    const parsedTo = DateTime.fromISO(to);
    return entries.reduce((acc, e) => {
      const at = DateTime.fromISO(e.at);
      const foundEntry = e.entries.find((f) => f.name === field.name && Boolean(f.value))?.value;
      if (parsedFrom <= at && at <= parsedTo && foundEntry) acc[e.at] = String(foundEntry);
      return acc;
    }, {} as Record<IDailyEntry["at"], string>);
  }, [from, to]);

  const [selectedEntry, setSelectedEntry] = useState<string>(Object.keys(displayedEntries)[0] ?? "");

  return ((from && to) || Object.keys(displayedEntries).length > 0)
    ? (
      <>
        <fieldset className="fieldset">
          <legend htmlFor="label" className="fieldset-legend">Entry</legend>
          <select
            defaultValue="Pick an entry"
            className="select"
            value={selectedEntry}
            onChange={(e) => setSelectedEntry(e.currentTarget.value)}
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
    )
    : <p class="text-[1.5em] font-medium text-black mx-auto">No data</p>;
}
