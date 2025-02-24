import { TUser } from "@models/User.ts";
import { DateTime } from "luxon";
import { PartialBy } from "../models/Common.ts";
import { IContent, TField } from "../models/Content.ts";
import { KV_CONTENT, KV_CONTENT_PUBLIC, KV_SINGLE_FIELD } from "./constants.ts";

const kv = await Deno.openKv();

const getPublicKey = (key: string) => `${KV_CONTENT_PUBLIC}${key}`;

/** Get the key to get the content, for the current user
 *
 * @param user The user to get the key from
 * @returns The kv content key
 */
export const getContentKey = (user: TUser) => user.isAuthenticated ? user.id : getPublicKey(user.id);

/** Get the content from the KV store
 *
 * The content is the full configuration of the daily "form", displayed
 * in the home page.
 *
 * @param user The user to get the content from. Must be verified using the `getUserBySession` function.
 * @param id The id of the content to get. If not provided, the latest content is returned.
 * @returns The content. Null if not found.
 */
export const getContent = async (
  { user, id }: { user: TUser; id?: string },
): Promise<IContent | null> => {
  let entry;

  const key = getContentKey(user);

  if (id) {
    const { value } = await kv.get<IContent>([KV_CONTENT, key, id]);
    entry = value;
  } else {
    // Reverse res and get the first one
    const entries = kv.list<IContent>({ prefix: [KV_CONTENT, key] }, {
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

/** Set the content in the KV store.
 *
 * @param content The content to set. If no id is provided, a new content is created.
 * @param user The user to set the content to. Must be verified using the `getUserBySession` function.
 * @returns The content. Null if not saved.
 */
export const setContent = async ({ content, user }: {
  content: PartialBy<IContent, "id">;
  user: TUser;
}): Promise<IContent | null> => {
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

  const secondaryKey = getContentKey(user);
  // Set a new id, to create a new content. Use date to have a sequencially inserted entries
  if (!content.id) content.id = String(DateTime.now().toUnixInteger());
  const res = await kv.set([KV_CONTENT, secondaryKey, content.id], content);
  if (res.ok) return await getContent({ user, id: content.id });
  else return null;
};
