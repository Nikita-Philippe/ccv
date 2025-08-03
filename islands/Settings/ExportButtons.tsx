import DatePicker from "@islands/Field/DatePicker.tsx";
import { IContent } from "@models/Content.ts";
import ky from "ky";
import { DateTime } from "luxon";
import { useState } from "preact/hooks";
import Card from "../../components/UI/Card.tsx";

type ExportButtonsProps = {
  content: IContent;
};

export default function ExportButtons({ content }: ExportButtonsProps) {
  const [range, setRange] = useState<{ from: string; to: string }>({
    from: DateTime.now().minus({ months: 1 }).toISODate(),
    to: DateTime.now().toISODate(),
  });
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = (type: "json" | "csv") => {
    setIsExporting(true);
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
    ).finally(() => setIsExporting(false));
  };

  return (
    <Card title="Export entries">
      <div class="flex gap-2">
        <label class="input">
          <span class={"label"}>From</span>
          <DatePicker defaultValue={range.from} onChange={(from) => setRange({ ...range, from })} />
        </label>
        {/* <input type="date" value={range.from} onChange={(e) => setRange({ ...range, from: e.currentTarget.value })} /> */}
        <label class="input">
          <span class={"label"}>To</span>
          <DatePicker defaultValue={range.to} onChange={(to) => setRange({ ...range, to })} />
        </label>
      </div>
      <div class="flex gap-2">
        <button class="btn" disabled={isExporting} onClick={() => handleExport("json")}>
          Export to JSON
        </button>
        <button class="btn" disabled={isExporting} onClick={() => handleExport("csv")}>
          Export to CSV
        </button>
      </div>
    </Card>
  );
}
