import { StateUpdater, useCallback, useContext, useEffect, useMemo, useRef, useState } from "preact/hooks";
import { EConfigCardType, IContent, IPartialContent } from "@models/Content.ts";
import ConfigCard from "@islands/Config/card.tsx";
import { PartialBy } from "@models/Common.ts";
import { isEqual } from "lodash";
import ky from "ky";

const baseContent: IPartialContent = {
  fields: [],
};

export default function ConfigCollection({ content: defaultContent }: {
  content: IContent | null;
}) {
  const [content, setContent] = useState<IPartialContent>(defaultContent ?? baseContent);

  // TODO: better modification detection
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
        },
      ],
    }));
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
    ky.put("/api/config", { json: { content } })
      .json<IContent | null>()
      .then((res) => setContent((p) => res ?? p))
      .catch((e) => console.error(e));
  }, [content]);

  return (
    <div>
      {content?.fields.map((field, index) => (
        <ConfigCard
          key={field.id}
          config={field}
          bubbleConfig={(cfg) => setField(index, cfg)}
          removeConfig={() => removeField(index)}
        />
      ))}
      <div>
        <button
          onClick={addBlankEntry}
        >
          Add field
        </button>
      </div>
      {isModified && (
        <button
          onClick={saveContent}
        >
          Save
        </button>
      )}
    </div>
  );
}
