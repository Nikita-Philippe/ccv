import { useSignal } from "@preact/signals";
import { getContent } from "../utils/content.ts";
import ConfigCollection from "@islands/Config/index.tsx";
import { DateTime } from "luxon";
import { exportEntries } from "@utils/entries.ts";
import ExportButtons from "@islands/Settings/ExportButtons.tsx";

export default async function Settings() {

    const content = await getContent();

  return (
    <div>
      {content && <ExportButtons content={content} />}
    </div>
  );
}
