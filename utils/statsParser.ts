import { EConfigCardType, IDailyEntry, TField } from "@models/Content.ts";
import { TAvailableCharts } from "@models/Stats.ts";

export const parseValueForChart = (fieldType: EConfigCardType, chartType: TAvailableCharts, value: any): any => {
  switch (fieldType) {
    case EConfigCardType.boolean: {
      if (chartType === "heatmap") return Number(value);
      return value;
    }
    case EConfigCardType.int:
    case EConfigCardType.textarea:
    case EConfigCardType.string:
    case EConfigCardType.multistring:
      if (typeof value === "string") return normalizeStr(value);
      if (Array.isArray(value)) return value.map((v) => normalizeStr(v));
      return value;
    default:
      return value;
  }
};

const normalizeStr = (str: string) => {
  return str.normalize("NFKC").toLowerCase().trim();
};

/** Parse a string entry to a label. */
export const labelizeString = (str: string) => {
  return str
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .replace(/^\w/, (char) => char.toUpperCase())
    .replace(/-/g, " ");
};

export const normalizeDatas = (field: TField, entries: IDailyEntry[]) => {
};
