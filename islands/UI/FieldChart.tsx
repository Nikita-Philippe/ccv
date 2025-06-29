import Chart from "@islands/UI/Chart.tsx";
import { IContent, IDailyEntry } from "@models/Content.ts";
import { chartsForFieldType, MChartConfig, TAvailableCharts } from "@models/Stats.ts";
import { cn } from "@utils/cn.ts";
import { generateDataColorScale } from "@utils/colors.ts";
import { labelizeString, parseValueForChart } from "@utils/statsParser.ts";
import ApexCharts, { ApexOptions } from "apexcharts";
import { cloneDeep, merge } from "lodash";
import { DateTime } from "luxon";
import { useEffect, useMemo, useState } from "preact/hooks";

// TODO: how to make this from theme
const mainColor = "#3e40e3";

type FieldChartProps = {
  options: ApexCharts.ApexOptions;
  field: IContent["fields"][0];
  datas: IDailyEntry[];
  sx?: string;
  /** If true, only the chart (no title, etc) is rendered. */
  asOnlyChart?: boolean;
};

const getEntriesRange = (datas: [IDailyEntry["at"], IDailyEntry["entries"][0]["value"]][]) => {
  const filter = datas.map(([_, val]) => !isNaN(parseInt(val as string)) ? parseInt(val as string) : null).filter((v) =>
    v != null
  );
  return { min: Math.min(...filter), max: Math.max(...filter) };
};

const getChartHeight = (type: TAvailableCharts, { seriesNb }: { seriesNb?: number }) => {
  switch (type) {
    case "heatmap":
      if (seriesNb) {
        return Math.max(
          100,
          18.7381 * seriesNb + 65,
        ); // Note: equation found from nb a row  height by eye where it feeled good
      } else {
        return 200;
      }
      // We know that one
    case "line":
    case "area":
    case "treemap":
    default:
      return 200;
  }
};

const getHeatMapRange = (data: ApexAxisChartSeries) => {
  if (data.some((d) => typeof d !== "object")) return { min: Infinity, max: -Infinity };
  return data.reduce((acc, { data }) => {
    /** @ts-ignore */
    const min = Math.min(...data.map((d) => d.y));
    /** @ts-ignore */
    const max = Math.max(...data.map((d) => d.y));
    return {
      min: Math.min(acc.min, min),
      max: Math.max(acc.max, max),
    };
  }, { min: Infinity, max: -Infinity });
};

const getTreeMapRange = (data: ApexAxisChartSeries) => ({ min: 1, max: (data[0]?.data ?? []).length });

const getChartColor = (type: TAvailableCharts, data: ApexOptions["series"]) => {
  if (!data || !Array.isArray(data) || data.length === 0 || typeof data[0] !== "object") return {};
  let range = { min: 0, max: 100 };
  if (type === "heatmap") range = getHeatMapRange(data as ApexAxisChartSeries);
  if (type === "treemap") range = getTreeMapRange(data as ApexAxisChartSeries);
  if (type === "line" || type === "area") {
    range = getEntriesRange(data[0]?.data as [IDailyEntry["at"], IDailyEntry["entries"][0]["value"]][]);
  }

  const { min, max } = range;

  // Generate smooth color scale
  const colorScale = generateDataColorScale(min, max, "#f0f0f0", mainColor);

  return {
    ...((type === "line" || type === "area")
      ? {
        colors: [({ value }: { value?: number }) => (value ?? 0) < 7 ? colorScale.at(-1)?.color : mainColor],
      }
      : {
        colors: colorScale.toReversed().map(({ color }) => color), // Use this color array as fallback for all charts
      }),
    plotOptions: {
      [type]: {
        enableShades: false, // Disable ApexCharts' built-in shading
        radius: 4,
        ...(type === "heatmap" || type === "treemap"
          ? {
            colorScale: {
              ranges: colorScale.map(({ value, color }, index, arr) => {
                const isLast = index === arr.length - 1;
                return {
                  from: value,
                  to: isLast ? value : arr[index + 1]?.value,
                  color: color,
                  name: value.toString(),
                };
              }),
            },
          }
          : {}),
      },
    },
  } as ApexOptions;
};

const createChartConfig = (
  datas: IDailyEntry[],
  field: IContent["fields"][0],
  type: TAvailableCharts,
): ApexOptions | null => {
  const mappedEntries = datas.map(
    (entry) => [entry.at, entry.entries.find((e) => e.name === field.name)?.value],
  ).filter(([_, v]) => v !== undefined) as [IDailyEntry["at"], IDailyEntry["entries"][0]["value"]][];

  switch (type) {
    case "line":
    case "area": {
      const range = getEntriesRange(mappedEntries);
      return {
        yaxis: {
          ...(range.min !== undefined && { min: range.min - 0.5 }),
          ...(range.max !== undefined && { max: range.max + 0.5 }),
        },
        series: [{
          name: field.label,
          data: mappedEntries,
        }] as ApexAxisChartSeries,
      };
    }
    case "heatmap": {
      const parsedHeatMap = mappedEntries.reduce((acc, [at, value]) => {
        // Get date as human string MMM YYYY (no day)
        const entryKey = DateTime.fromISO(at).toLocaleString({ month: "short", year: "2-digit" });
        const dayOfMonth = DateTime.fromISO(at).day;
        const accEntry = acc.findIndex((v) => v.name === entryKey);
        const parsedValue = parseValueForChart(field.type, type, value);
        if (accEntry !== -1) {
          acc[accEntry]?.data.push({ x: dayOfMonth, y: parsedValue, meta: at });
        } else {
          acc.push({ name: entryKey, data: [{ x: dayOfMonth, y: parsedValue, meta: at }] });
        }
        return acc;
      }, [] as Array<{ name: string; data: Array<{ x: number; y: number; meta: string }> }>);
      return {
        series: parsedHeatMap.map((v) => ({ name: v.name, data: v.data.sort((a, b) => a.x - b.x) })),
      };
    }
    case "treemap": {
      const stringOccurences = mappedEntries.reduce((acc, [_, value]) => {
        const parsedValue: string[] = parseValueForChart(field.type, type, [value].flat());
        parsedValue.forEach((v) => (acc[v] !== undefined && !isNaN(acc[v])) ? acc[v] = acc[v] + 1 : acc[v] = 0);
        return acc;
      }, {} as Record<string, number>);

      return {
        series: [{
          data: Object.entries(stringOccurences).map(([name, value]) => ({ x: labelizeString(name), y: value }))
            .filter(({ x }) => Boolean(x)) // Remove empty strings
            .sort((a, b) => a.y - b.y),
        }],
      };
    }
  }
};

const initChart = ({ field, options, datas }: FieldChartProps): ApexCharts.ApexOptions | null => {
  if (!options.chart?.type || !Object.keys(MChartConfig).includes(options.chart.type)) {
    console.error("Chart missing type or not supported", options);
    return null;
  }

  const chartType = options.chart.type as TAvailableCharts;

  if (!chartsForFieldType[field.type].includes(chartType)) {
    console.error("Chart type not supported for field type", { field, options });
    return null;
  }

  const defaultConfig = cloneDeep(MChartConfig[chartType]);

  const config = createChartConfig(datas, field, chartType);
  if (!config) return null;

  return merge(
    defaultConfig,
    config,
    options, // Usually options only contains chart type
    getChartColor(chartType, config.series),
    { chart: { height: getChartHeight(chartType, { seriesNb: config.series?.length }) } },
  ) as ApexCharts.ApexOptions;
};

/** Render a chart, specificaly for an IContent field. */
export default function FieldChart({ options: defaultOptions, field, datas, sx }: FieldChartProps) {
  const [options, setOptions] = useState<ApexCharts.ApexOptions | null>(null);
  const isReady = useMemo(() => options !== null, [options]);
  const [chart, setChart] = useState<ApexCharts>();

  useEffect(() => {
    const newOptions = initChart({ options: defaultOptions, field, datas });
    if (!newOptions) return;
    setOptions(newOptions);
    // If this is not the first render, update the chart with the new options
    if (options && isReady && chart) chart.updateOptions(newOptions);
  }, [
    JSON.stringify(defaultOptions),
    field.name,
    JSON.stringify(datas.length),
  ]);

  return (isReady && options) ? <Chart sx={cn(sx)} options={options} getChart={setChart} /> : null;
}
