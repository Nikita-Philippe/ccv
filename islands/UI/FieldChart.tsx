import { cn } from "@utils/cn.ts";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import ApexCharts from "apexcharts";
import Chart from "@islands/UI/Chart.tsx";
import { EConfigCardType, IContent, IDailyEntry } from "@models/Content.ts";
import { chartsForFieldType, MChartConfig, TAvailableCharts } from "@models/Stats.ts";
import { merge } from "lodash";
import { DateTime } from "luxon";
import { labelizeString, parseValueForChart } from "@utils/statsParser.ts";

type FieldChartProps = {
  options: ApexCharts.ApexOptions;
  field: IContent["fields"][0];
  datas: IDailyEntry[];
  sx?: string;
  /** If true, only the chart (no title, etc) is rendered. */
  asOnlyChart?: boolean;
};

type heatmapData = {
  name: string;
  data: Array<{ x: number; y: number }>;
}[];

const rangeColors = ["#750101", "#9e5002", "#949401", "#4b9600", "#019101", "#02964c"];
const getHeatMapColor = (data: heatmapData) => {
  const colorsNb = rangeColors.length;
  const { min, max } = data.reduce((acc, { data }) => {
    const min = Math.min(...data.map((d) => d.y));
    const max = Math.max(...data.map((d) => d.y));
    return {
      min: Math.min(acc.min, min),
      max: Math.max(acc.max, max),
    };
  }, { min: Infinity, max: -Infinity });

  // If boolean parsed
  const isBoolean = min == 0 && max == 1;
  const useColors = isBoolean ? ["#78706a", "#02964c"] : rangeColors;

  return {
    plotOptions: {
      heatmap: {
        shadeIntensity: 0.5,
        radius: 0,
        useFillColorAsStroke: true,
        colorScale: {
          ranges: useColors.map((color, i) => {
            const from = min + ((max - min) / colorsNb) * i;
            const to = min + ((max - min) / colorsNb) * (i + 1);

            let label = from === to ? from : `${from} - ${to}`;
            if (isBoolean) label = from === 0 ? "No" : "Yes";

            return {
              from,
              to,
              name: label,
              color,
            };
          }),
        },
      },
    },
  };
};

const formatEntries = (datas: IDailyEntry[], field: IContent["fields"][0], type: TAvailableCharts) => {
  const mappedEntries = datas.map(
    (entry) => [entry.at, entry.entries.find((e) => e.name === field.name)?.value],
  ).filter(([_, v]) => v !== undefined) as [IDailyEntry["at"], IDailyEntry["entries"][0]["value"]][];

  switch (type) {
    case "line":
    case "area":
      return [{
        data: mappedEntries,
      }];
    case "heatmap": {
      const parsedHeatMap = mappedEntries.reduce((acc, [at, value]) => {
        // Get date as human string MMM YYYY (no day)
        const entryKey = DateTime.fromISO(at).toLocaleString({ month: "short", year: "2-digit" });
        const dayOfMonth = DateTime.fromISO(at).day;
        const accEntry = acc.findIndex((v) => v.name === entryKey);
        const parsedValue = parseValueForChart(field.type, type, value);
        console.log("Parsed value: ", parsedValue);
        if (accEntry !== -1) {
          acc[accEntry].data.push({ x: dayOfMonth, y: parsedValue });
        } else {
          acc.push({ name: entryKey, data: [{ x: dayOfMonth, y: parsedValue }] });
        }
        return acc;
      }, [] as Array<{ name: string; data: Array<{ x: number; y: number }> }>);
      return parsedHeatMap.map((v) => ({ name: v.name, data: v.data.sort((a, b) => a.x - b.x) }));
    }
    case "treemap": {
      const stringOccurences = mappedEntries.reduce((acc, [_, value]) => {
        const parsedValue: string[] = parseValueForChart(field.type, type, [value].flat());
        parsedValue.forEach((v) => !isNaN(acc[v]) ? acc[v] = acc[v] + 1 : acc[v] = 0);
        return acc;
      }, {} as Record<string, number>);

      return [{
        data: Object.entries(stringOccurences).map(([name, value]) => ({ x: labelizeString(name), y: value }))
          .filter(({ x }) => Boolean(x)) // Remove empty strings
          .sort((a, b) => a.y - b.y),
      }];
    }
    default:
      console.error("Chart type not supported", { type, field, datas });
      return null;
  }
};

const initChart = ({ field, options, datas, asOnlyChart }: FieldChartProps): ApexCharts.ApexOptions | null => {
  if (!options.chart?.type || !Object.keys(MChartConfig).includes(options.chart.type)) {
    console.error("Chart missing type or not supported", options);
    return null;
  }

  const chartType = options.chart.type as TAvailableCharts;

  if (!chartsForFieldType[field.type].includes(chartType)) {
    console.error("Chart type not supported for field type", { field, options });
    return null;
  }

  const baseOptions = MChartConfig[chartType];

  const dataset = formatEntries(datas, field, chartType);
  if (!dataset) return null;

  console.log("Chart dataset", dataset);

  return merge(
    { series: dataset },
    baseOptions,
    options,
    !asOnlyChart ? {} : {},
    // chartType === "heatmap" ? getHeatMapColor(dataset as heatmapData) : {},
  ) as ApexCharts.ApexOptions;
};

/** Render a chart, specificaly for an IContent field. */
export default function FieldChart({ options: defaultOptions, field, datas, sx, asOnlyChart }: FieldChartProps) {
  const [options, setOptions] = useState<ApexCharts.ApexOptions | null>(null);
  const isReady = useMemo(() => options !== null, [options]);
  const [chart, setChart] = useState<ApexCharts>();

  useEffect(() => {
    const newOptions = initChart({ options: defaultOptions, field, datas, asOnlyChart });
    if (!newOptions) return;
    setOptions(newOptions);
    // If this is not the first render, update the chart with the new options
    if (options && isReady && chart) chart.updateOptions(newOptions);
  }, [
    JSON.stringify(defaultOptions),
    field.name,
    JSON.stringify(datas.length),
  ]);

  if (isReady && options && options.chart?.type !== "metric") {
    return <Chart sx={cn(sx)} options={options} getChart={setChart} />;
  } else if (isReady && options && options.chart?.type === "metric") {
    return <></>;
  } else {
    return null;
  }
}
