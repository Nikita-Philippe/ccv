import { IconPlus as Plus } from "@icons";
import ConfigCard from "@islands/Config/card.tsx";
import ExportConfig from "@islands/Config/ExportConfig.tsx";
import Card from "@islands/UI/Card.tsx";
import useToast from "@hooks/useToast.tsx";
import { PartialBy } from "@models/Common.ts";
import { EConfigCardType, IContent, IPartialContent } from "@models/Content.ts";
import { HTTPError } from "@models/Errors.ts";
import ky from "ky";
import { isEqual } from "lodash";
import { useCallback, useMemo, useState } from "preact/hooks";

const baseContent: IPartialContent = {
  fields: [],
};

export default function ConfigCollection({ content: defaultContent }: {
  content: IContent | null;
}) {
  const { notif } = useToast();
  const [submitState, setSubmitState] = useState<"idle" | "loading">("idle");
  const [content, setContent] = useState<IPartialContent>(defaultContent ?? baseContent);

  const isModified = useMemo(() => !isEqual((defaultContent ?? baseContent).fields, content.fields), [
    JSON.stringify(content.fields),
  ]);

  const addBlankEntry = () => {
    setContent((prev) => ({
      ...prev,
      fields: [
        ...prev.fields,
        {
          name: "",
          label: "",
          type: EConfigCardType.string,
          icon: "",
          group: "",
        },
      ],
    }));
  };

  const duplicateField = (index: number) => {
    setContent((prev) => {
      const fields = [...prev.fields];
      fields.splice(index, 0, { ...fields[index] });
      return { ...prev, fields };
    });
  };

  const removeField = (index: number) => {
    setContent((prev) => {
      const fields = [...prev.fields];
      fields.splice(index, 1);
      return { ...prev, fields };
    });
  };

  const setField = (index: number, field: PartialBy<IPartialContent["fields"][0], "id">) => {
    setContent((prev) => {
      const fields = [...prev.fields];
      fields[index] = field;
      return { ...prev, fields };
    });
  };

  const saveContent = useCallback((forceContent?: IPartialContent) => {
    setSubmitState("loading");
    ky.put("/api/config", { json: { content: forceContent ?? content }, retry: 0 })
      .json<IContent | null>()
      .then((res) => {
        setContent((p) => res ?? p);
        notif?.open({ type: "success", message: "Your content has been saved." });
        setSubmitState("idle");
      })
      .catch(async (e) => {
        const errorBody: HTTPError = await e.response?.json();
        notif?.open({
          type: "error",
          message: errorBody?.error?.message ?? "An error occurred while saving your content." + errorBody?.error?.details?.join("\n"),
        });
        setSubmitState("idle");
      });
  }, [content]);

  const replaceByImportedContent = (newContent: IPartialContent) => {
    if (
      globalThis.confirm(
        "Are you sure you want to replace the whole config ? The current config will be entirely replaced",
      )
    ) {
      saveContent(newContent);
    }
  };

  return (
    <>
      <ExportConfig config={content} replaceConfig={replaceByImportedContent} />
      {/* 2 items per line (if space available), gap of 2 */}
      <div className="grid gap-4 grid-cols-2">
        {content?.fields.map((field, index) => (
          <ConfigCard
            key={field.id}
            config={field}
            bubbleConfig={(cfg) => setField(index, cfg)}
            removeConfig={() => removeField(index)}
            duplicateConfig={() => duplicateField(index)}
          />
        ))}
        <Card>
          <button
            className={"w-full h-full flex justify-center items-center cursor-pointer"}
            onClick={addBlankEntry}
          >
            <Plus size={42} />
          </button>
        </Card>
      </div>
      {isModified && (
        <button
          className={"btn fixed bottom-2 right-2 min-w-32"}
          onClick={() => saveContent()}
          disabled={submitState === "loading"}
        >
          {submitState === "loading" ? "Saving..." : "Save"}
        </button>
      )}
    </>
  );
}
