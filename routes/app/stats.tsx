import StatsCollection from "@islands/Stats/StatsCollection.tsx";
import StatsCollectionEditor from "@islands/Stats/StatsCollectionEditor.tsx";
import Card from "@islands/UI/Card.tsx";
import { requestTransaction } from "@utils/database.ts";
import { DateTime } from "luxon";

export default async function Stats(req: Request) {
  const isEditMode = new URL(req.url).searchParams.get("edit") === "true";

  const currentContent = await requestTransaction(req, { action: "getContent" });

  if (!currentContent) {
    return (
      <Card sx={{ content: "p-4 flex-col no-wrap relative" }}>
        <h3>
          You don't have any content configured yet.
        </h3>
        <p>
          <button type="button" class="btn w-fit h-fit py-0.5">
            <a href="/app/config">Configure</a>
          </button>{" "}
          now your first form, and start tracking your habits !
        </p>
      </Card>
    );
  }

  const currentStats = await requestTransaction(req, { action: "getStats" });

  const entriesExtract = isEditMode
    ? await requestTransaction(req, {
      action: "exportEntries",
      args: [{
        contentId: currentContent.id,
        from: DateTime.now().minus({ day: 60 }).toISODate(),
        to: DateTime.now().toISODate(),
      }],
    })
    : null;

  return (
    <div class="flex flex-col gap-4 relative">
      <a class="absolute top-0 right-0" href={`/app/stats${!isEditMode ? "?edit=true" : ""}`}>
        <button type="button" class="btn">
          {isEditMode ? "Voir" : "Editer"}
        </button>
      </a>
      {isEditMode
        ? <StatsCollectionEditor stats={currentStats} content={currentContent} entriesExtract={entriesExtract} />
        : <StatsCollection content={currentContent} stats={currentStats} />}
    </div>
  );
}
