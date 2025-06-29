import { IContent, IDailyEntry } from "@models/Content.ts";
import { IStat, StatsDefaultTimeRanges } from "@models/Stats.ts";
import { getDailyEntryKey } from "@utils/common.ts";
import ky, { HTTPError } from "ky";
import { DateTime } from "luxon";
import { useEffect, useState } from "preact/hooks";
import MetricCard from "./Viewer/MetricCard.tsx";
import StatCard from "./Viewer/StatCard.tsx";

export default function StatsCollection({ content, stats }: {
  content: IContent;
  stats: IStat | null;
}) {
  const [loading, setLoading] = useState<boolean>(true);
  const [timeRange, setTimeRange] = useState<keyof typeof StatsDefaultTimeRanges>("Last month");
  const [datas, setDatas] = useState<IDailyEntry[]>([]);

  useEffect(() => {
    const to = getDailyEntryKey(DateTime.now());
    const from = StatsDefaultTimeRanges[timeRange](to);

    const fetchEntries = () => {
      if (!stats) return;
      setLoading(true);
      ky.get(`/api/entries?id=${content.id}&from=${from}&to=${to}`)
        .json<IDailyEntry[] | null>()
        .then((res) => setDatas(Array.isArray(res) ? res : []))
        .catch(async (e) => {
          const errorBody: HTTPError = await e.response?.json();
          console.error(errorBody);
        })
        .finally(() => {
          setLoading(false);
        });
    };

    fetchEntries();

    return () => {
      setDatas([]);
    };
  }, [timeRange]);

  if (!stats) return <div class="text-center">No stats available</div>;

  return (
    <>
      <fieldset className="fieldset py-0">
        <select
          className="select w-fit"
          value={timeRange}
          onChange={(e) => setTimeRange((e.target as HTMLSelectElement).value as typeof timeRange)}
          required
        >
          <option disabled>Pick a time range</option>
          {Object.keys(StatsDefaultTimeRanges).map((key) => <option key={key} value={key}>{key}</option>)}
        </select>
      </fieldset>

      {!stats && <div class="text-center">No stats available</div>}
      {loading && <div class="text-center">Loading...</div>}
      {!loading && stats?.charts.map((chart) => (
        <StatCard
          key={chart.id}
          chart={chart}
          content={content.fields.find((f) => f.name === chart.content.field)}
          entries={datas}
        />
      ))}
      {!loading && stats?.metrics.map((metric) => (
        <MetricCard
          key={metric.id}
          metric={metric}
          content={content.fields.find((f) => f.name === metric.content.field)}
          entries={datas}
        />
      ))}
    </>
  );
}
