import { PartialBy } from "../models/Common.ts";
import { IContent, TField } from "../models/Content.ts";
import { KV_CONTENT, KV_SINGLE_FIELD } from "./constants.ts";

const kv = await Deno.openKv();

export const getContent = async (
  id?: IContent["id"],
): Promise<IContent | null> => {
  let entry;

  if (id) {
    const { value } = await kv.get<IContent>([KV_CONTENT, id]);
    entry = value;
  } else {
    // Reverse res and get the first one
    const entries = kv.list<IContent>({ prefix: [KV_CONTENT] }, {
      limit: 1,
      reverse: true,
    });
    const contents = [];
    for await (const entry of entries) contents.push(entry.value);
    entry = contents.pop();
  }

  if (entry) {
    const allFields = kv.list<TField>({ prefix: [KV_SINGLE_FIELD] });
    for await (const field of allFields) {
      const { value } = field;
      const idAt = entry.fields.findIndex((f) => f.id === value.id);
      if (idAt !== -1) entry.fields[idAt] = value;
    }

    // Keep only populated fields
    entry.fields = entry.fields.filter((f) => !!f?.id);
    return entry;
  }

  return null;
};

export const setContent = async (content: PartialBy<IContent, "id">): Promise<IContent | null> => {
  // First save each field. If field has been saved, replace by id, else delete it.
  for (let [index, field] of content.fields.entries()) {
    field = {
      ...field,
      ...(!field.id && { id: crypto.randomUUID() }),
    };
    const res = await kv.set([KV_SINGLE_FIELD, field.id], field);
    if (res.ok) content.fields[index].id = field.id;
    else content.fields.slice(index, 1);
  }

  // Set a new id, to create a new content
  // TODO: check whats the best approach here. Keep only new entries, or update existing ones?
  if (!content.id) content.id = crypto.randomUUID();
  const res = await kv.set([KV_CONTENT, content.id], content);
  if (res.ok) return await getContent(content.id);
  else return null;
};