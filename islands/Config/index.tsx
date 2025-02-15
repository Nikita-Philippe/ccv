import { StateUpdater, useCallback, useContext, useEffect, useMemo, useRef, useState } from "preact/hooks";
import { EConfigCardType, IContent, IPartialContent } from "@models/Content.ts";
import ConfigCard from "@islands/Config/card.tsx";
import { PartialBy } from "@models/Common.ts";
import { isEqual } from "lodash";
import ky from "ky";
import { useToast } from "@islands/UI/Toast/useToast.tsx";
import { Toaster } from "@islands/UI/Toast/Toaster.tsx";
import { HTTPError } from "@models/Errors.ts";
import Plus from "@icons/plus.tsx";

const baseContent: IPartialContent = {
  fields: [],
};

export default function ConfigCollection({ content: defaultContent }: {
  content: IContent | null;
}) {
  const { toast } = useToast();
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

  const saveContent = useCallback(() => {
    setSubmitState("loading");
    ky.put("/api/config", { json: { content } })
      .json<IContent | null>()
      .then((res) => {
        setContent((p) => res ?? p);
        toast({
          description: "Your content has been saved.",
        });
        setSubmitState("idle");
      })
      .catch(async (e) => {
        const errorBody: HTTPError = await e.response?.json();
        toast({
          title: errorBody?.error?.message ?? "Error",
          description: errorBody?.error?.details.join("\n"),
        });
        setSubmitState("idle");
      });
  }, [content]);

  return (
    <>
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
        <button
          className={"flex items-center justify-center p-2 border border-gray-200 rounded"}
          onClick={addBlankEntry}
        >
          <Plus size={42} />
        </button>
      </div>
      {isModified && (
        <button
          className={"btn fixed bottom-2 right-2 min-w-32"}
          onClick={saveContent}
          disabled={submitState === "loading"}
        >
          {submitState === "loading" ? "Saving..." : "Save"}
        </button>
      )}
      <Toaster />
    </>
  );
}
