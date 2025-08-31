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
        reader.readAsText(file as Blob);
      } catch (e) {
        console.error("An error occured while trying to read file: ", e);
      }
    }
  };

  return (
    <div className="flex gap-2 items-center ml-auto w-fit order-first md:order-1">
      <div className="tooltip tooltip-bottom" data-tip="Export config as JSON">
        <button type="button" className="btn" onClick={exportConfig}>
          {/* @ts-ignore */}
          <FileExport />
        </button>
      </div>
      <div className="tooltip tooltip-bottom" data-tip="Import config from JSON">
        <input
          type="file"
          className="opacity-0 cursor-pointer absolute left-0 w-full top-0 bottom-0 z-10"
          onChange={importConfig}
          accept="application/json"
        />
        <button type="button" className="btn relative">
          {/* @ts-ignore */}
          <FileImport />
        </button>
      </div>
    </div>
  );
}
