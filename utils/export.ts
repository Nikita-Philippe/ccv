import { IContent, IDailyEntry } from "@models/Content.ts";
import { lowerCase, uniq } from "lodash";
import { APP_EXPORT_CSV_DELIMITER, APP_EXPORT_CSV_NOTFOUND } from "@utils/constants.ts";
import { DateTime } from "luxon";
import { stringifyEntryValue } from "@utils/entries.ts";

type TExportFunction = { filename: string; content: string };

export const datasToJSON = (data: IDailyEntry[]): TExportFunction => {
  return {
    filename: `export-${DateTime.now().toISODate()}.json`,
    content: JSON.stringify(data),
  };
};

export const datasToCSV = (data: IDailyEntry[], content: IContent): TExportFunction => {
  const allEntryKeys = uniq(data.map((d) => d.entries.map((e) => lowerCase(e.name))).flat());

  const header = ["at", ...allEntryKeys];

  const rows = data.map((d) => [
    d.at,
    // allEntryKeys.map((key) => d.entries.find((e) => lowerCase(e.name) === key)?.value ?? APP_EXPORT_CSV_NOTFOUND),
    allEntryKeys.map((key) => {
      const found = d.entries.find((e) => lowerCase(e.name) === key);
      return found ? stringifyEntryValue(found, content) : APP_EXPORT_CSV_NOTFOUND;
    }),
  ]);

  return {
    filename: `export-${DateTime.now().toISODate()}.csv`,
    content: [header, ...rows].map((r) => r.join(APP_EXPORT_CSV_DELIMITER)).join("\n"),
  };
};
