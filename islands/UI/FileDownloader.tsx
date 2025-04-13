import { useEffect } from "preact/hooks";

type Props = {
  data: string;
  filename: string;
  filetype: "application/json" | "text/plain";
  label?: string;
  asButton?: boolean;
};

/** Simple file downloader component.
 *
 * @experimental - To be reworked.
 */
export default function FileDownloader({ data, filename, filetype, asButton, label }: Props) {
  useEffect(() => {
    if (!asButton) prepareDownload();
  }, [data, filename, filetype]);

  const prepareDownload = () => {
    const blob = new Blob([data], { type: filetype });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    a.remove();
  };

  return asButton
    ? (
      <button class="btn w-fit" onClick={prepareDownload}>
        <span class="text-sm">{label ?? filename}</span>
      </button>
    )
    : <></>;
}
