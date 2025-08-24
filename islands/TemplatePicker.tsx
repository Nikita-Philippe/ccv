import Card from "@components/UI/Card.tsx";
import useModal from "@hooks/useModal.tsx";
import { IconInfoCircle } from "@icons";
import Field from "@islands/Field/index.tsx";
import { IPartialContent } from "@models/Content.ts";
import { AvailableTemplateType, ITemplate } from "@models/Template.ts";
import ky from "ky";
import { capitalize } from "lodash";
import { useEffect, useState } from "preact/hooks";

type TField = IPartialContent["fields"][0];

type TemplatePickerProps = {
  type: AvailableTemplateType;
  replaceConfig: (content: IPartialContent) => boolean;
};

/** Template picker, fetches templates from the server and allows to preview and select one.
 * 
 * @param type Type of template to fetch (content, stats, etc.)
 * @param replaceConfig Function to call when a template is selected. Should return true if the config was replaced.
 */
export default function TemplatePicker({ type, replaceConfig }: TemplatePickerProps) {
  const { Dialog, isOpen, setIsOpen } = useModal({ dialog: { boxProps: { class: "overflow-visible" } } });

  const [templates, setTemplates] = useState<ITemplate[]>();
  const [selected, setSelected] = useState<ITemplate>();

  const selectTemplate = (template: ITemplate | undefined) => {
    setSelected((p) => {
      const v = !p ? template : undefined;
      setIsOpen(!!v);
      return v;
    });
  };

  useEffect(() => {
    if (!isOpen) selectTemplate(undefined);
  }, [isOpen]);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      const fetchedTemplates = await ky.get<ITemplate[] | null>(`/api/template/${type}`, { retry: 0 }).json();

      if (!fetchedTemplates || !isMounted) return;

      setTemplates(fetchedTemplates);
    };

    init();

    return () => {
      isMounted = false;
    };
  }, []);

  const entriesContent = selected?.content.fields.reduce((acc, field) => {
    const group = field.group ?? "";
    const entry = acc.find((e) => e.group === group);
    if (entry) entry.fields.push(field);
    else acc.push({ group, fields: [field] });
    return acc;
  }, [] as { group: TField["group"]; fields: TField[] }[]).sort((a, b) => b.group.localeCompare(a.group));

  return (templates ?? []).length
    ? (
      <>
        <select value="default" className="select w-full md:w-auto">
          <option value="default" disabled>Pick a template</option>
          {templates!.map((t) => (
            <option
              key={`template_option_${t.label}`}
              onClick={() => selectTemplate(t)}
            >
              {t.label}
            </option>
          ))}
        </select>
        <Dialog>
          {selected && (
            <div class="flex flex-col gap-4">
              <p class="md:text-xl font-semibold">{selected.description.title}</p>
              <p>{selected.description.description}</p>
              {selected.description.image && <img src={selected.description.image} />}
              <Card
                title={
                  <div class="flex gap-2 items-end">
                    <p>Habits display</p>
                    <div
                      className="tooltip tooltip-bottom"
                      data-tip="For example only, the actual display may vary."
                    >
                      {/* @ts-ignore */}
                      <IconInfoCircle class="mb-0.5" size={18} />
                    </div>
                  </div>
                }
                sx={{ content: "flex-col flex-nowrap justify-start max-h-[300px] overflow-y-auto" }}
              >
                {entriesContent?.map(({ group, fields }) => (
                  <Card key={group} title={capitalize(group)}>
                    {/* TODO: fix typing on configs refacto */}
                    {fields.map((field) => <Field key={field.name} field={field as any} />)}
                  </Card>
                ))}
              </Card>

              <div class="mt-6 flex flex-wrap justify-end items-center gap-2">
                <button
                  type="button"
                  className="btn"
                  onClick={() => selectTemplate(undefined)}
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={() => {
                    if (replaceConfig(selected.content)) setIsOpen(false);
                  }}
                >
                  Use this configuration
                </button>
              </div>
            </div>
          )}
        </Dialog>
      </>
    )
    : null;
}
