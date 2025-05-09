import { IconPlus as Plus } from "@icons";
import StatCard from "@islands/Stats/StatCard.tsx";
import Card from "@islands/UI/Card.tsx";
import { Toaster } from "@islands/UI/Toast/Toaster.tsx";
import { useToast } from "@islands/UI/Toast/useToast.tsx";
import { IContent, IDailyEntry } from "@models/Content.ts";
import { HTTPError } from "@models/Errors.ts";
import { IPartialStat, IStat } from "@models/Stats.ts";
import ky from "ky";
import { isEqual } from "lodash";
import { useCallback, useEffect, useMemo, useState } from "preact/hooks";

export default function StatsCollectionEditor({ stats: defaultStats, content, entriesExtract }: {
  stats: IStat | null;
  content: IContent;
  entriesExtract: IDailyEntry[] | null;
}) {
  const { toast } = useToast();
  const [submitState, setSubmitState] = useState<"idle" | "loading">("idle");
  const [stats, setStats] = useState<IPartialStat | null>(defaultStats);
  const isModified = useMemo(() => !isEqual(defaultStats?.charts, stats?.charts), [
    JSON.stringify(stats?.charts),
  ]);

  useEffect(() => console.log("stats", stats), [stats]);

  const addBlankEntry = () => {
    setStats((p) => ({
      ...p,
      charts: [
        ...p?.charts ?? [],
        {
          label: "",
          content: {
            id: content.id,
            field: "",
          },
          chart: {
            chart: {},
          },
        },
      ],
    }));
  };

  const setField = (index: number, chartEntry: IPartialStat["charts"][0]) => {
    setStats((prev) => {
      if (!prev) return prev;
      const charts = [...prev.charts];
      charts[index] = chartEntry;
      return { ...prev, charts };
    });
  };

  const duplicateField = (index: number) => {
    setStats((prev) => {
      if (!prev) return prev;
      const charts = [...prev.charts];
      charts.splice(index, 0, { ...charts[index] });
      return { ...prev, charts };
    });
  };

  const removeField = (index: number) => {
    setStats((prev) => {
      if (!prev) return prev;
      const charts = [...prev.charts];
      charts.splice(index, 1);
      return { ...prev, charts };
    });
  };

  const saveStats = useCallback(() => {
    setSubmitState("loading");
    ky.put("/api/stats", { json: { stats }, retry: 0 })
      .json<IStat | null>()
      .then((res) => {
        setStats((p) => res ?? p);
        toast({
          description: "Your content has been saved.",
        });
        setSubmitState("idle");
      })
      .catch(async (e) => {
        const errorBody: HTTPError = await e.response?.json();
        toast({
          title: errorBody?.error?.message ?? "Error",
          description: errorBody?.error?.details?.join("\n"),
        });
        setSubmitState("idle");
      });
  }, [stats]);

  return (
    <>
      <div className="flex flex-col gap-4 w-full">
        {stats?.charts.map((chart, index) => (
          <StatCard
            key={chart.id}
            entriesExtract={entriesExtract}
            availableFields={content.fields}
            config={chart}
            bubbleConfig={(cfg) => setField(index, cfg)}
            removeConfig={() => removeField(index)}
            duplicateConfig={() => duplicateField(index)}
          />
        ))}
        <Card>
          <button
            type="button"
            className="w-full h-full flex justify-center items-center cursor-pointer"
            onClick={addBlankEntry}
          >
            {/* @ts-ignore */}
            <Plus size={42} />
          </button>
        </Card>
      </div>
      {isModified && (
        <button
          type="button"
          className="btn fixed bottom-2 right-2 min-w-32"
          onClick={() => saveStats()}
          disabled={submitState === "loading"}
        >
          {submitState === "loading" ? "Saving..." : "Save"}
        </button>
      )}
      <Toaster />
    </>
  );
}
