import { IconCopy as Copy, IconTrash as Trash } from "@icons";
import Card from "@islands/UI/Card.tsx";
import { IContent, IDailyEntry } from "@models/Content.ts";
import { IPartialStat, StatMetricType } from "@models/Stats.ts";
import { cn } from "@utils/cn.ts";
import { set } from "lodash";
import { ChangeEvent } from "preact/compat";
import { useEffect, useMemo, useState } from "preact/hooks";
import MetricCard from "../Viewer/MetricCard.tsx";

type MetricCardProps = {
  availableFields: IContent["fields"];
  entriesExtract: IDailyEntry[] | null;
  metric: IPartialStat["metrics"][0];
  bubbleConfig: (metric: IPartialStat["metrics"][0]) => void;
  removeConfig: () => void;
  duplicateConfig: () => void;
};

const flexRow = "flex flex-wrap flex-row gap-2 [&_>_*]:flex-1 [&_>_*]:min-w-28";

export default function MetricCardEditor(
  { metric: initialMetric, availableFields, entriesExtract, bubbleConfig, removeConfig, duplicateConfig }:
    MetricCardProps,
) {
  const [metric, setMetric] = useState<IPartialStat["metrics"][0]>(initialMetric);
  const currentField = useMemo(() => availableFields.find((f) => f.name === metric.content.field), [
    metric.content.field,
  ]);

  useEffect(() => bubbleConfig(metric), [JSON.stringify([metric.label, metric.content])]);

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const target = e.target as HTMLInputElement | HTMLSelectElement;
    if (!target.name || !target.value) return;
    setMetric((p) => ({ ...set(p, target.name, target.value) }));
  }

  const remove = () => {
    if (!currentField || (currentField && confirm("Are you sure you want to remove this field?"))) removeConfig();
  };

  return (
    <Card sx={{ content: "flex-col justify-between" }}>
      <div className={flexRow}>
        <fieldset className="fieldset">
          <legend htmlFor="label" className="fieldset-legend">Label</legend>
          <input
            id="label"
            name="label"
            type="text"
            className={cn("input input-bordered w-full")} //, configErrors.label && "input-error")}
            value={metric.label}
            onChange={handleChange}
          />
        </fieldset>
        <fieldset className="fieldset">
          <legend htmlFor="label" className="fieldset-legend">Field</legend>
          <select
            className="select"
            value={metric.content.field}
            onChange={handleChange}
            name="content.field"
            required
          >
            <option disabled>Pick a field</option>
            {availableFields.map((field) => <option key={field.name} value={field.name}>{field.label}</option>)}
          </select>
        </fieldset>
        <fieldset className="fieldset">
          <legend htmlFor="label" className="fieldset-legend">Field</legend>
          <select
            className="select"
            value={metric.content.math}
            onChange={handleChange}
            name="content.math"
            required
          >
            <option disabled>Pick an operation</option>
            {Object.entries(StatMetricType).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </fieldset>
      </div>

      {(currentField && Array.isArray(entriesExtract)) && (
        <div className="min-w-full">
          <MetricCard metric={metric} entries={entriesExtract} content={currentField} />
        </div>
      )}

      <div className="flex gap-2 mt-2 justify-end">
        <button type="button" className="btn" onClick={duplicateConfig}>
          {/* @ts-ignore */}
          <Copy size={20} />
        </button>
        <button type="button" className="btn btn-error" onClick={remove}>
          {/* @ts-ignore */}
          <Trash size={20} />
        </button>
      </div>
    </Card>
  );
}
