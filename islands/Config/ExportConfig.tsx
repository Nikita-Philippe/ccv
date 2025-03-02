import { IconFileImport as FileImport, IconCloudDownload as FileExport } from "@icons";
import { IPartialContent } from "@models/Content.ts";
import { getDailyEntryKey } from "@utils/common.ts";
import { DateTime } from "luxon";

/** Display a export/import config
 */
export default function ExportConfig({ config, replaceConfig }: {
  config: IPartialContent;
  replaceConfig: (content: IPartialContent) => void;
}) {
  const exportConfig = () => {
    const jsonStr = JSON.stringify(config, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `ccv-config-${getDailyEntryKey(DateTime.now())}.json`;
    a.click();

    URL.revokeObjectURL(url);
    a.remove();
  };

  const importConfig = (e: Event) => {
    if (e.target && e.target instanceof HTMLInputElement && e.target.files) {
      try {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = () => {
          const res = JSON.parse(reader.result as string ?? "{}");
          if ("fields" in res && "id" in res) {
            delete res.id; // Delete id to force creation of a new entry, avoiding conflicts
            replaceConfig(res as IPartialContent);
          }
        };
        reader.readAsText(file);
      } catch (e) {
        console.error("An error occured while trying to read file: ", e);
      }
    }
  };

  return (
    <div className={"flex space-x-2 absolute top-6 right-6"}>
      <div className="tooltip tooltip-bottom" data-tip="Exporter la config en JSON">
        <button className={"btn"} onClick={exportConfig}>
          <FileExport />
        </button>
      </div>
      <div className="tooltip tooltip-bottom" data-tip="Importer une config en JSON">
        <input
          type="file"
          className={"opacity-0 cursor-pointer absolute left-0 w-full top-0 bottom-0 z-10"}
          onChange={importConfig}
          accept={"application/json"}
        />
        <button className={"btn relative"}>
          <FileImport />
        </button>
      </div>
    </div>
  );
}
