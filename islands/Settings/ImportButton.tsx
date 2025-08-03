import Card from "../../components/UI/Card.tsx";
import ky from "ky";
import { useState } from "preact/hooks";
import { JSX } from "preact/jsx-runtime";
import { IconInfoCircle } from "@icons";

type TImportResponse = {
  message?: string[];
};

export default function ImportButton() {
  const [isExporting, setIsExporting] = useState(false);
  const [file, setFile] = useState<File>();
  const [importOptions, setImportOptions] = useState({
    overwrite_existing: false,
  });
  const [apiResponse, setApiResponse] = useState<JSX.Element>();

  const handleExport = () => {
    if (!file) return;
    setIsExporting(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("overwrite_existing", importOptions.overwrite_existing.toString());
    ky.post<TImportResponse>("/api/settings/import", { body: formData }).json().then(
      (res) => {
        setApiResponse(
          <div className="alert alert-soft w-full items-start max-h-[300px] overflow-auto flex flex-col gap-2">
            <p>Import results:</p>
            <ul className="list-disc pl-4">
              {res.message?.map((msg) => <li key={msg}>{msg}</li>)}
            </ul>
          </div>,
        );
      },
    )
      .catch(async (err) => {
        console.log(JSON.parse(JSON.stringify(err)));
        const errorData: TImportResponse = await err.response.json();
        setApiResponse(
          <div className="alert alert-error w-full items-start max-h-[300px] overflow-auto flex flex-col gap-2">
            <p>Errors occurred:</p>
            <ul className="list-disc pl-4">
              {errorData.message?.map((msg) => <li key={msg}>{msg}</li>)}
            </ul>
          </div>,
        );
      })
      .finally(() => setIsExporting(false));
  };

  const handleImportedFile = (e: Event) => {
    if (!e.target || !(e.target instanceof HTMLInputElement) || !e.target.files) return;
    setFile(e.target.files[0]);
  };

  return (
    <Card title="Import entries">
      <form method="post" encType="multipart/form-data" className="flex flex-col gap-2">
        <div className="flex gap-4">
          <fieldset className="fieldset py-0">
            <input type="file" className="file-input" accept=".csv,.json" onChange={handleImportedFile} />
            <label className="fieldset-label">CSV/JSON. Max size 5MB</label>
          </fieldset>
          <fieldset className="fieldset py-0">
            <input
              type="checkbox"
              className="checkbox"
              name="overwrite_existing"
              value={importOptions.overwrite_existing.toString()}
              onClick={() =>
                setImportOptions({ ...importOptions, overwrite_existing: !importOptions.overwrite_existing })}
            />
            <label
              className="fieldset-label"
              htmlFor="overwrite_existing"
            >
              Overwrite entries
              <div
                class="tooltip"
                data-tip="If imported entries already exists at the same date, they will be replaced."
              >
                <IconInfoCircle size={14} />
              </div>
            </label>
          </fieldset>
        </div>
        <button type="button" class="btn w-fit" disabled={!file || isExporting} onClick={handleExport}>
          Import datas
        </button>
        {apiResponse}
      </form>
    </Card>
  );
}
