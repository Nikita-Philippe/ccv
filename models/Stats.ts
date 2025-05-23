import { EConfigCardType, IContent } from "@models/Content.ts";
import { PartialBy, TDailyEntryKey } from "@models/Common.ts";

export interface IStat {
  id: string;
  charts: IStatChart[];
}

export interface IPartialStat {
  id?: string;
  charts: Array<PartialBy<IStatChart, "id">>;
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

type TAllCharts = Required<Required<ApexCharts.ApexOptions>["chart"]>["type"];

/** Here a configured the CCV-available */
export type TAvailableCharts = Extract<TAllCharts, "line" | "area" | "heatmap" | "treemap" | "metric">;

/** Label for each chart type. */
export const MChartLabel: Record<TAvailableCharts, string> = {
  "line": "Line",
  "area": "Area",
  "heatmap": "Heatmap",
  "treemap": "Treemap",
  "metric": "Metric",
};

/* Available chart types for each field type. */
export const chartsForFieldType: Record<EConfigCardType, TAvailableCharts[]> = {
  [EConfigCardType.boolean]: ["heatmap", "metric"],
  [EConfigCardType.int]: ["line", "area", "heatmap", "metric"],
  [EConfigCardType.string]: ["treemap", "metric"],
  [EConfigCardType.textarea]: [],
  [EConfigCardType.multistring]: ["treemap", "metric"],
};

export const metricChartTypes: Record<string, string> = {
  "last": "Last value",
  "average": "Average",
  "count": "Count",
};


const baseChartConfig: ApexCharts.ApexOptions = {
  theme: {
    // monochrome: {
    //   enabled: true,
    //   color: '#255aee',
    //   shadeTo: 'light',
    //   shadeIntensity: 0.65
    // }
    palette: "palette1",
  },
};

/** Chart options. For now fixed. */
export const MChartConfig: Record<TAvailableCharts, ApexCharts.ApexOptions> = {
  "line": {
    ...baseChartConfig,
    chart: {
      type: "line",
      height: 350,
      zoom: {
        enabled: false,
      },
    },
    stroke: {
      curve: "smooth",
    },
    xaxis: {
      type: "datetime",
    },
    tooltip: {
      x: {
        format: "dd/MM/yy",
      },
    },
  },
  "area": {
    ...baseChartConfig,
    chart: {
      type: "area",
      height: 350,
      zoom: {
        enabled: false,
      },
    },
    stroke: {
      curve: "smooth",
    },
    xaxis: {
      type: "datetime",
    },
    tooltip: {
      x: {
        format: "dd/MM/yy HH:mm",
      },
    },
  },
  "heatmap": {
    ...baseChartConfig,
    chart: {
      type: "heatmap",
      height: 300,
      zoom: {
        enabled: false,
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      width: 1,
    },
  },
  "treemap": {
    ...baseChartConfig,
    chart: {
      type: "treemap",
      height: 300,
      zoom: {
        enabled: false,
      },
    },
    dataLabels: {
      enabled: true,
    },
    legend: {
      show: false,
    },
  },
  "metric": {},
};
