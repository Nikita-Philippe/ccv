import Card from "@islands/UI/Card.tsx";
import { chartsForFieldType, IPartialStat, IStat, MChartConfig, MChartLabel } from "@models/Stats.ts";
import { useEffect, useMemo, useState } from "preact/hooks";
import { EConfigCardType, IContent, IDailyEntry } from "@models/Content.ts";
import { ChangeEvent } from "preact/compat";
import { cn } from "@utils/cn.ts";
import DatePicker from "@islands/Field/DatePicker.tsx";
import { IconCopy as Copy, IconTrash as Trash } from "@icons";
import { set } from "lodash";
import Chart from "@islands/UI/Chart.tsx";
import FieldChart from "@islands/UI/FieldChart.tsx";
import TextAreaChart from "@islands/UI/TextAreaChart.tsx";

type Chart = IPartialStat["charts"][0];

type Props = {
  availableFields: IContent["fields"];
  entriesExtract: IDailyEntry[] | null;
  config: Chart;
  bubbleConfig: (config: Chart) => void;
  removeConfig: () => void;
  duplicateConfig: () => void;
};

const flexRow = "flex flex-row gap-2 [&_*]:grow";

export default function StatCard(
  { availableFields, bubbleConfig, removeConfig, duplicateConfig, config: initialConfig, entriesExtract }: Props,
) {
  const [config, setConfig] = useState<Chart>(initialConfig);
  const currentField = useMemo(() => availableFields.find((f) => f.name === config.content.field), [
    config.content.field,
  ]);

  useEffect(() => bubbleConfig(config), [JSON.stringify(config)]);

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const target = e.target as HTMLInputElement | HTMLSelectElement;
    if (!target.name || !target.value) return;
    setConfig((p) => ({ ...set(p, target.name, target.value) }));
  }

  function handleSelectChart(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const target = e.target as HTMLInputElement | HTMLSelectElement;
    if (!target.name || !target.value) return;
    const foundConfig = MChartConfig[target.value as keyof typeof MChartConfig];
    console.log("chart Config", { path: target.name, value: foundConfig });
    setConfig((p) => ({ ...set(p, target.name, foundConfig) }));
  }

  // Reset chart if filed changes
  useEffect(() => {
    if (
      currentField && config.chart.chart?.type &&
      !chartsForFieldType[currentField.type].includes(config.chart.chart?.type as keyof typeof MChartLabel)
    ) {
      setConfig((p) => ({
        ...set(p, "chart", {
          chart: {
            chart: {},
          },
        }),
      }));
    }
  }, [config.content.field]);

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
            value={config.label}
            onChange={handleChange}
          />
        </fieldset>
        <fieldset className="fieldset">
          <legend htmlFor="label" className="fieldset-legend">Field</legend>
          <select
            defaultValue="Pick a field"
            className="select"
            value={config.content.field}
            onChange={handleChange}
            name="content.field"
            required
          >
            <option disabled>Pick a field</option>
            {availableFields.map((field) => <option key={field.name} value={field.name}>{field.label}</option>)}
          </select>
        </fieldset>
      </div>
      {(currentField && chartsForFieldType[currentField.type].length > 0) && (
        <div className={flexRow}>
          <fieldset className="fieldset">
            <legend htmlFor="label" className="fieldset-legend">Chart</legend>
            <select
              defaultValue="Pick a chart type"
              className="select"
              value={config.chart?.chart?.type}
              onChange={handleSelectChart}
              name="chart"
              required
            >
              <option disabled>Pick a chart type</option>
              {Object.entries(MChartLabel).map(([type, label]) =>
                // Render only available chart types for the current type
                chartsForFieldType[currentField.type].includes(type as keyof typeof MChartLabel) && (
                  <option key={type} value={type}>{label}</option>
                )
              )}
            </select>
          </fieldset>
        </div>
      )}
      {config.chart.chart?.type && currentField &&
        (
          <FieldChart
            field={currentField}
            datas={entriesExtract || []}
            options={config.chart}
          />
        )}
      {currentField?.type === EConfigCardType.textarea && (
        <TextAreaChart field={currentField} entries={entriesExtract || []} />
      )}

      <div className="flex gap-2 mt-2 justify-end">
        <button type="button" className="btn" onClick={duplicateConfig}>
          <Copy size={20} />
        </button>
        <button type="button" className="btn btn-error" onClick={remove}>
          <Trash size={20} />
        </button>
      </div>
    </Card>
  );
}
