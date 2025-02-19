import ExportButtons from "@islands/Settings/ExportButtons.tsx";
import { getContent } from "../utils/content.ts";

export default async function Settings() {
  const content = await getContent();

  return (
    <div>
      {content && <ExportButtons content={content} />}
    </div>
  );
}
