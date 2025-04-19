/** Tool used to convert the legacy export to the new format.
 * Uses the very old csv format, and the bit newer json format from Svelte CCV. */

import { parse, stringify } from "jsr:@std/csv";
import { normalizeString } from "jsr:@iharuya/string";

type PossibleValue = boolean | string | string[] | number;

type JSONDatas = {
  id: string;
  date: string; // as Date
  content: {
    name: string;
    value: PossibleValue;
  }[];
}[];

type CSVToStringify = {
  at?: string;
} & Record<string, PossibleValue>;

try {
  const rawFile = await Deno.readTextFile("./scripts/export.json");

  const allEntries: JSONDatas = JSON.parse(rawFile);

  const columns = [
    "at",
    ...Array.from(allEntries.reduce((acc, entry) => {
      const entryKeys = entry.content.map((c) => c.name);
      entryKeys.forEach((k) => {
        if (!acc.has(k)) acc.add(k);
      });
      return acc;
    }, new Set() as Set<string>)),
  ];

  const datas = allEntries.map((entry) =>
    ({
      at: new Date(entry.date).toISOString().split("T")[0],
      ...entry.content.reduce((acc, c) => {
        acc[c.name] = c.value;
        return acc;
      }, {} as Record<string, typeof allEntries[0]["content"][0]["value"]>),
    }) as CSVToStringify
  );

  const normalizeStr = (str: string) => {
    return normalizeString(str).toLowerCase();
  };

  const rawLegacyExport = await Deno.readTextFile("./scripts/legacy_export.csv");
  const legacyExport = parse(rawLegacyExport) as string[][];

  const legacyColumns = legacyExport[0];

  const mappedColumns = [...legacyColumns, ...columns].reduce((acc, col) => {
    if (!acc.includes(normalizeStr(col))) acc.push(normalizeStr(col));
    return acc;
  }, [] as string[]);

  console.log("legacyToNewColumnsMap", mappedColumns);

  const fullArray = legacyExport.slice(1).map((line) => {
    const parsedEntries: CSVToStringify = line.reduce((acc, entry, i) => {
      const correspondingKey = mappedColumns[i];

      let value: PossibleValue = entry;

      switch (correspondingKey) {
        case "troispersdelajourn":
          value = entry.split(" ");
          if (value.length > 3 || value.length < 3) console.log("troispersdelajourn", entry, value);
          break;
        case "localisation":
          value = !value ? "" : value;
          break;
        case "remarques":
          value = !value ? "" : value;
          break;
      }

      if (value === "TRUE") value = true;
      else if (value === "FALSE") value = false;
      else if (!isNaN(Number(value))) value = Number(value);

      acc[correspondingKey] = value;
      return acc;
    }, {} as CSVToStringify);
    return parsedEntries;
  }, [] as CSVToStringify[]);

  fullArray.push(...datas.map((entry) => {
    const keys = Object.keys(entry);
    const res: CSVToStringify = {};
    for (const key of keys) {
      let value = entry[key];

      switch (normalizeStr(key)) {
        case "localisation":
          if (!value) value = "";
          if (Array.isArray(value)) value = value[0];
          break;
        case "remarques":
          if (!value) value = "";
          if (Array.isArray(value)) value = value[0];
          break;
      }

      res[normalizeStr(key) as keyof CSVToStringify] = value;
    }
    return res;
  }));

  const cleanedfullArray = fullArray;

  const csv = stringify(cleanedfullArray, { columns: mappedColumns });
  await Deno.writeTextFile("./scripts/full_export.csv", csv);
} catch (e) {
  console.error(e);
}
