import Card from "@islands/UI/Card.tsx";
import { IDailyEntry, TField } from "@models/Content.ts";
import { IPartialStat } from "@models/Stats.ts";
import { parseValueForChart } from "@utils/statsParser.ts";
import { max, mean, min, round, sum } from "lodash";

type MetricCardProps = {
  metric: IPartialStat["metrics"][0];
  content?: TField;
  entries: IDailyEntry[];
};

export default function MetricCard(
  { metric, content, entries }: MetricCardProps,
) {
  const mappedEntries = entries.map(
    (entry) => content ? entry.entries.find((e) => e.name === content.name)?.value : [],
  ).filter((v) => v !== undefined) as IDailyEntry["entries"][0]["value"][];

  const parsedFields = content
    ? mappedEntries.map((v) => parseValueForChart(content.type, "heatmap", v)).filter((v) => !isNaN(v))
    : [];

  const getContent = () => {
    if (!mappedEntries.length || !content) return 0;

    switch (metric.content.math) {
      case "sum":
        return sum(parsedFields);
      case "avg":
        return round(mean(parsedFields), 2);
      case "min":
        return min(parsedFields);
      case "max":
        return max(parsedFields);
      case "value":
        return String(parseValueForChart(content.type, "line", mappedEntries.at(-1) ?? "N/A"));
      default:
        return null;
    }
  };

  return content
    ? (
      <Card title={metric.label} sx={{ content: "flex-col justify-between" }}>
        <p className="font-bold text-4xl w-full text-center">
          {getContent()}
        </p>
      </Card>
    )
    : null;
}
