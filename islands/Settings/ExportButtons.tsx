import { IContent } from "@models/Content.ts";
import ky from "ky";
import { DateTime } from "luxon";
import { useState } from "preact/hooks";

type ExportButtonsProps = {
  content: IContent;
};

export default function ExportButtons({ content }: ExportButtonsProps) {
  const [range, setRange] = useState<{ from: string; to: string }>({
    from: DateTime.now().minus({ months: 1 }).toISODate(),
    to: DateTime.now().toISODate(),
  });

  const handleExport = (type: "json" | "csv") => {
    ky.get(encodeURI(`/api/settings/export?id=${content.id}&from=${range.from}&to=${range.to}&type=${type}`)).then(
      (res) => {
        if (res.ok) {
          res.blob().then((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            const disposition = res.headers.get("Content-Disposition") || "";
            const filename = disposition.split("filename=")[1]?.replace(/^"|"$/g, "") ??
              `export-${DateTime.now().toISODate()}.${type}`;
            a.download = filename;
            a.click();
          });
        }
      },
    );
  };

  return (
    <div>
      <div>
        <label>From</label>
        <input type="date" value={range.from} onChange={(e) => setRange({ ...range, from: e.currentTarget.value })} />
        <label>To</label>
        <input type="date" value={range.to} onChange={(e) => setRange({ ...range, to: e.currentTarget.value })} />
      </div>
      <div>
        <button onClick={() => handleExport("json")}>
          Export to JSON
        </button>
        <button onClick={() => handleExport("csv")}>
          Export to CSV
        </button>
      </div>
    </div>
  );
}
