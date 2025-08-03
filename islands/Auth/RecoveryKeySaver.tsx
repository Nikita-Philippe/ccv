import { useState } from "preact/hooks";
import { getDailyEntryKey } from "@utils/common.ts";
import { IconCircleCheck as ClipboardCheck, IconClipboard as Clipboard, IconFileText as FileDL } from "@icons";
import Card from "../../components/UI/Card.tsx";

/** Component displaying the recovery key and allowing to copy it to clipboard or download it as a file. */
export default function RecoveryKeySaver({ recoveryKey }: { recoveryKey: string }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(recoveryKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadKey = () => {
    const element = document.createElement("a");
    const file = new Blob([recoveryKey], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `ccv-recovery-key-${getDailyEntryKey(new Date())}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div role="alert" className="alert w-full alert-[#fbbf24] alert-soft flex">
      <p class="overflow-auto whitespace-pre-wrap grow py-2">
        {recoveryKey}
      </p>
      <div class="flex gap-2">
        <Card sx={{ content: "p-1" }}>
          <div className="tooltip tooltip-bottom h-6" data-tip="Copy to clipboard">
            <button
              onClick={copyToClipboard}
              disabled={copied}
            >
              {copied ? <ClipboardCheck /> : <Clipboard />}
            </button>
          </div>
        </Card>
        <Card sx={{ content: "p-1" }}>
          <div className="tooltip tooltip-bottom h-6" data-tip="Download key">
            <button
              onClick={downloadKey}
            >
              <FileDL />
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
