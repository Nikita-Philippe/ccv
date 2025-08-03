import { IconPlus as Plus } from "@icons";
import Card from "../../components/UI/Card.tsx";
import { IContent, IDailyEntry } from "@models/Content.ts";
import { HTTPError } from "@models/Errors.ts";
import { IPartialStat, IStat } from "@models/Stats.ts";
import ky from "ky";
import { cloneDeep, isEqual, merge, set } from "lodash";
import { DateTime } from "luxon";
import { useCallback, useMemo, useState } from "preact/hooks";
import MetricCardEditor from "./Editor/MetricCard.tsx";
import StatCardEditor from "./Editor/StatCard.tsx";
import useToast from "@hooks/useToast.tsx";

const getNewEntryKey = (key: "metrics" | "charts") => `${key}-${DateTime.now().toUnixInteger()}`;

export default function StatsCollectionEditor({ stats: defaultStats, content, entriesExtract }: {
  stats: IStat | null;
  content: IContent;
  entriesExtract: IDailyEntry[] | null;
}) {
  const { notif } = useToast();
  const [submitState, setSubmitState] = useState<"idle" | "loading">("idle");
  const [stats, setStats] = useState<IPartialStat | null>(cloneDeep(defaultStats ?? null));
  const isModified = useMemo(() => !isEqual(defaultStats, stats), [
    JSON.stringify(stats),
  ]);

  const addBlankEntry = (key: "metrics" | "charts") =>
    setStats((p) =>
      Object.assign(
        {},
        set(
          p ?? {},
          `${key}.${(p?.[key] ?? []).length}`,
          (() => {
            switch (key) {
              case "metrics":
                return {
                  id: getNewEntryKey(key),
                  label: "",
                  content: {
                    id: content.id,
                    field: "",
                    math: "avg",
                  },
                };
              case "charts":
                return {
                  id: getNewEntryKey(key),
                  label: "",
                  content: {
                    id: content.id,
                    field: "",
                  },
                  chart: {
                    chart: {},
                  },
                };
            }
          })(),
        ) as IPartialStat,
      )
    );

  const setField = (path: string, value: IPartialStat["charts"][0] | IPartialStat["metrics"][0]) => {
    setStats((prev) =>
      merge(
        (prev ?? {}) as IPartialStat,
        set(prev ?? {}, path, value),
      )
    );
  };

  const removeField = (path: string) => {
    setStats((prev) => {
      const [arrayKey, indexStr] = path.split(".");
      if (!prev || !indexStr) return prev;
      const index = parseInt(indexStr);

      const newStats = cloneDeep(prev);
      const key = arrayKey as keyof IPartialStat;
      if (Array.isArray(newStats[key]) && index >= 0 && index < newStats[key].length) {
        newStats[key].splice(index, 1);
      }

      return newStats;
    });
  };

  const saveStats = useCallback(() => {
    setSubmitState("loading");
    ky.put("/api/stats", { json: { stats }, retry: 0 })
      .json<IStat | null>()
      .then((res) => {
        setStats((p) => res ?? p);
        notif?.open({ type: "success", message: "Your stats have been saved." });
        setSubmitState("idle");
      })
      .catch(async (e) => {
        const errorBody: HTTPError = await e.response?.json();
        notif?.open({
          type: "error",
          message: errorBody?.error?.message ?? "An error occurred while saving your stats." + errorBody?.error?.details?.join("\n"),
        });
        setSubmitState("idle");
      });
  }, [stats]);

  return (
    <>
      <div className="flex flex-col gap-4 w-full mt-12">
        {stats?.metrics?.map((metric, index) =>
          metric
            ? (
              <MetricCardEditor
                key={`metric-${metric.id ?? index}`}
                metric={metric}
                entriesExtract={entriesExtract}
                availableFields={content.fields}
                bubbleConfig={(cfg) => setField(`metrics.${index}`, cfg)}
                removeConfig={() => removeField(`metrics.${index}`)}
                duplicateConfig={() =>
                  setField(`metrics.${stats.metrics.length}`, { ...cloneDeep(metric), id: getNewEntryKey("metrics") })}
              />
            )
            : null
        )}
        {stats?.charts?.map((chart, index) => (
          <StatCardEditor
            key={chart.id}
            entriesExtract={entriesExtract}
            availableFields={content.fields}
            config={chart}
            bubbleConfig={(cfg) => setField(`charts.${index}`, cfg)}
            removeConfig={() => removeField(`charts.${index}`)}
            duplicateConfig={() =>
              setField(`charts.${stats.charts}`, { ...cloneDeep(chart), id: getNewEntryKey("charts") })}
          />
        ))}
        <Card>
          <details className="dropdown w-full h-full flex justify-center items-center cursor-pointer">
            <summary className="btn m-1">
              {/* @ts-ignore */}
              <Plus size={42} />
            </summary>
            <ul className="menu dropdown-content bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm">
              <li>
                <button type="button" onClick={() => addBlankEntry("charts")}>
                  Statistic
                </button>
              </li>
              <li>
                <button type="button" onClick={() => addBlankEntry("metrics")}>
                  Metric
                </button>
              </li>
            </ul>
          </details>
        </Card>
        {isModified && (
          <button
            type="button"
            className="btn min-w-32"
            onClick={() => saveStats()}
            disabled={submitState === "loading"}
          >
            {submitState === "loading" ? "Saving..." : "Save"}
          </button>
        )}
      </div>
    </>
  );
}
