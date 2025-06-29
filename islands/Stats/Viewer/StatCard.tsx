import Card from "@islands/UI/Card.tsx";
import FieldChart from "@islands/UI/FieldChart.tsx";
import TextAreaChart from "@islands/UI/TextAreaChart.tsx";
import { EConfigCardType, IDailyEntry, TField } from "@models/Content.ts";
import { IPartialStat } from "@models/Stats.ts";
import { useMemo } from "preact/hooks";

type Props = {
  chart: IPartialStat["charts"][0];
  content?: TField;
  entries: IDailyEntry[];
};

export default function StatCard(
  { chart, content, entries }: Props,
) {

  const chartGraph = useMemo(() => {
    if (!content) return null;
    if (content.type === EConfigCardType.textarea) {
      return <TextAreaChart key={content.name} field={content} entries={entries} />;
    } else {
      return (
        <FieldChart
          field={content}
          datas={entries}
          options={chart.chart}
        />
      );
    }
  }, [content, entries, chart.chart]);

  return content
    ? (
      <Card title={chart.label} sx={{ content: "flex-col justify-center min-h-30" }}>
        {chartGraph}
      </Card>
    )
    : null;
}
