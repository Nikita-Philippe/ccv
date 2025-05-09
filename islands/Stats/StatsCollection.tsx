import { IStat } from "@models/Stats.ts";
import { DateTime } from "luxon";
import { useCallback, useEffect, useState } from "preact/hooks";
import FromToDatePicker from "@islands/UI/FromToDatePicker.tsx";
import { EConfigCardType, IContent, IDailyEntry } from "@models/Content.ts";
import TextAreaChart from "@islands/UI/TextAreaChart.tsx";
import FieldChart from "@islands/UI/FieldChart.tsx";
import ky, { HTTPError } from "ky";
import { getDailyEntryKey } from "@utils/common.ts";

export default function StatsCollection({ content, stats }: {
  content: IContent;
  stats: IStat | null;
}) {
  const [loading, setLoading] = useState<boolean>(true);
  const [timeRange, setTimeRange] = useState<[DateTime, DateTime]>([
    DateTime.now().minus({ days: 7 }),
    DateTime.now(),
  ]);
  const [datas, setDatas] = useState<IDailyEntry[]>([]);

  useEffect(() => {
    console.log("Date range changed", { from: getDailyEntryKey(timeRange[0]), to: getDailyEntryKey(timeRange[1]) });
    fetchEntries();
    return () => {
      setDatas([]);
    };
  }, [JSON.stringify(timeRange.map((t) => t.toUnixInteger()))]);

  const fetchEntries = useCallback(() => {
    if (!stats) return;
    console.log("fetching entries", {
      id: content.id,
      from: getDailyEntryKey(timeRange[0]),
      to: getDailyEntryKey(timeRange[1]),
    });
    setLoading(true);
    ky.get(`/api/entries?id=${content.id}&from=${getDailyEntryKey(timeRange[0])}&to=${getDailyEntryKey(timeRange[1])}`)
      .json<IDailyEntry[] | null>()
      .then((res) => setDatas(Array.isArray(res) ? res : []))
      .catch(async (e) => {
        const errorBody: HTTPError = await e.response?.json();
        console.error(errorBody);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [JSON.stringify(timeRange.map((t) => t.toUnixInteger()))]);

  if (!stats) return <div class="text-center">No stats available</div>;

  return (
    <>
      <FromToDatePicker
        setFromDate={(from) => setTimeRange((p) => [from, p[1]])}
        setToDate={(to) => setTimeRange((p) => [p[0], to])}
        min={DateTime.now().minus({ years: 10 })}
        max={DateTime.now()}
        defaultFrom={timeRange[0]}
        defaultTo={timeRange[1]}
      />
      {!stats && <div class="text-center">No stats available</div>}
      {loading && <div class="text-center">Loading...</div>}
      {!loading && stats?.charts.map((chart) => {
        const currentField = content.fields.find((f) => f.name === chart.content.field);
        if (!currentField) {
          console.error("Field not found", { fieldId: chart.content.field, contentId: content.id });
          return null;
        }
        if (currentField.type === EConfigCardType.textarea) {
          return <TextAreaChart key={currentField.name} field={currentField} entries={datas} />;
        } else {
          return (
            <FieldChart
              field={currentField}
              datas={datas}
              options={chart.chart}
            />
          );
        }
      })}
    </>
  );
}
