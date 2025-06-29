import { PartialBy, TDailyEntryKey } from "@models/Common.ts";
import { EConfigCardType, IContent } from "@models/Content.ts";
import { getDailyEntryKey, getDateTime } from "@utils/common.ts";
import { cloneDeep, merge } from "lodash";
import { DateTime } from "luxon";

export interface IStat {
  id: string;
  config: {
    from: TDailyEntryKey;
    to: TDailyEntryKey;
  };
  charts: IStatChart[];
  metrics: IStatMetric[];
}

export interface IPartialStat {
  id?: string;
  charts: Array<PartialBy<IStatChart, "id">>;
  metrics: Array<PartialBy<IStatMetric, "id">>;
}

interface IStatChart {
  id: string;
  label: string;
  content: {
    id: IContent["id"];
    /** Source is the name of one of the field */
    field: IContent["fields"][0]["name"];
  };
  chart: ApexCharts.ApexOptions;
  // Custom fields, instead of the chart
  customContent?: {
    type: EConfigCardType.textarea;
  };
}

/** Metric is a simpler version of chart with data only */
interface IStatMetric {
  id: string;
  label: string;
  content: {
    id: IContent["id"];
    /** Source is the name of one of the field */
    field: IContent["fields"][0]["name"];
    /** the math op to apply. ex: avg value of last 6 months */
    math: "sum" | "avg" | "value" | "min" | "max";
  };
}

export const StatMetricType: Record<IStatMetric["content"]["math"], string> = {
  "sum": "Sum",
  "avg": "Average",
  "min": "Minimum",
  "max": "Maximum",
  "value": "Last value",
};

export const StatsDefaultTimeRanges = {
  "Last day": (date) => date,
  "Last week": (date) => getDailyEntryKey(getDateTime(date).minus({ weeks: 1 })),
  "Last month": (date) => getDailyEntryKey(getDateTime(date).minus({ months: 1 })),
  "Last 3 months": (date) => getDailyEntryKey(getDateTime(date).minus({ months: 3 })),
  "Last 6 months": (date) => getDailyEntryKey(getDateTime(date).minus({ months: 6 })),
  "Last year": (date) => getDailyEntryKey(getDateTime(date).minus({ years: 1 })),
  "All time": (date) => getDailyEntryKey(getDateTime(date).minus({ years: 20 })), // Limit to 7300 entries
} as const satisfies Record<string, (today: TDailyEntryKey) => TDailyEntryKey>;

type TAllCharts = Required<Required<ApexCharts.ApexOptions>["chart"]>["type"];

/** Here a configured the CCV-available */
export type TAvailableCharts = Extract<TAllCharts, "line" | "area" | "heatmap" | "treemap">;

/** Label for each chart type. */
export const MChartLabel: Record<TAvailableCharts, string> = {
  "line": "Line",
  "area": "Area",
  "heatmap": "Heatmap",
  "treemap": "Treemap",
};

/* Available chart types for each field type. */
export const chartsForFieldType: Record<EConfigCardType, TAvailableCharts[]> = {
  [EConfigCardType.boolean]: ["heatmap"],
  [EConfigCardType.int]: ["line", "area", "heatmap"],
  [EConfigCardType.string]: ["treemap"],
  [EConfigCardType.textarea]: [],
  [EConfigCardType.multistring]: ["treemap"],
};

export const metricChartTypes: Record<string, string> = {
  "last": "Last value",
  "average": "Average",
  "count": "Count",
};

const baseChartConfig: ApexCharts.ApexOptions = {
  chart: {
    parentHeightOffset: 0,
    zoom: {
      enabled: true,
    },
    toolbar: {
      show: false,
      tools: {
        download: true,
        selection: false,
        zoom: false,
        zoomin: false,
        zoomout: false,
        pan: false,
        reset: false,
      },
    },
  },
  noData: {
    text: "No data",
    style: {
      fontSize: "1.5em",
    },
  },
  stroke: {
    curve: "smooth",
    width: 2,
  },
  xaxis: {
    type: "datetime",
    tooltip: {
      enabled: false,
    },
    axisBorder: {
      show: false,
    },
    axisTicks: {
      show: false,
    },
  },
};

const lineAreaConfig = {
  dataLabels: {
    enabled: false,
  },
} satisfies ApexCharts.ApexOptions;

/** Chart options. For now fixed. */
export const MChartConfig: Record<TAvailableCharts, ApexCharts.ApexOptions> = Object.freeze({
  "line": merge(
    cloneDeep(baseChartConfig), // NOTE: spread, because merge mutates original object
    lineAreaConfig,
    {
      chart: {
        type: "line",
      },
    } satisfies ApexCharts.ApexOptions,
  ),
  "area": merge(
    cloneDeep(baseChartConfig),
    lineAreaConfig,
    {
      chart: {
        type: "area",
      },
    } satisfies ApexCharts.ApexOptions,
  ),
  "heatmap": merge(
    cloneDeep(baseChartConfig),
    {
      chart: {
        type: "heatmap",
        height: 300,
      },
      dataLabels: {
        enabled: false,
      },
      grid: {
        show: false,
      },
      tooltip: {
        enabled: true,
        shared: true,
        custom: function ({ _, seriesIndex, dataPointIndex, w }) {
          const dataPoint = w?.config?.series?.[seriesIndex]?.data?.[dataPointIndex];
          const date = getDateTime(dataPoint?.meta).isValid
            ? getDateTime(dataPoint?.meta).toLocaleString(DateTime.DATE_FULL)
            : null;
          return (
            `<div class="p-2 bg-white border-accent rounded-sm font-extrabold">
              <span class="text-xs font-light italic">${date + ": "}</span>${dataPoint?.y}
            </div>`
          );
        },
      },
      legend: {
        position: "bottom",
      },
      xaxis: {
        type: "numeric",
        tickAmount: 6,
        decimalsInFloat: 0,
        labels: {
          show: false,
        },
      },
      plotOptions: {
        heatmap: {
          enableShades: true,
          radius: 4,
        },
      },
    } satisfies ApexCharts.ApexOptions,
  ),
  "treemap": merge(
    cloneDeep(baseChartConfig),
    {
      chart: {
        type: "treemap",
        height: 300,
      },
      dataLabels: {
        enabled: true,
      },
      legend: {
        show: false,
      },
    } satisfies ApexCharts.ApexOptions,
  ),
});
