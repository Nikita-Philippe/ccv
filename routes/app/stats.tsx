import { RouteConfig } from "$fresh/server.ts";
import { getUserBySession } from "@utils/auth.ts";
import { DateTime } from "luxon";
import { requestTransaction } from "@utils/database.ts";
import StatsCollectionEditor from "../../islands/Stats/StatsCollectionEditor.tsx";
import Card from "@islands/UI/Card.tsx";
import StatsCollection from "@islands/Stats/StatsCollection.tsx";

export default async function Stats(req: Request) {
  const isEditMode = new URL(req.url).searchParams.get("edit") === "true";

  const currentStats = await requestTransaction(req, { action: "getStats" });
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

  console.log("content id", currentContent.id);

  // TODO: export entries seems to not work properly
  const entriesExtract = await requestTransaction(req, {
    action: "exportEntries",
    args: [{
      contentId: currentContent.id,
      // from: DateTime.now().minus({ day: 500 }).toISODate(),
      from: DateTime.now().minus({ day: 60 }).toISODate(),
      to: DateTime.now().toISODate(),
    }],
  });

  console.log("ebntries length", entriesExtract?.length);

  return (
    <>
      <a href={`/app/stats${!isEditMode ? "?edit=true" : ""}`}>
        <button type="button" class="btn absolute right-0">
          {isEditMode ? "Revenir aux statistiques" : "Editer les statistiques"}
        </button>
      </a>
      {isEditMode
        ? <StatsCollectionEditor stats={currentStats} content={currentContent} entriesExtract={entriesExtract} />
        : <StatsCollection content={currentContent} stats={currentStats} />}
    </>
  );
}
