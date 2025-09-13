import { PartialBy } from "@models/Common.ts";
import { IContent } from "@models/Content.ts";
import { KV_CONTENT } from "@utils/constants.ts";
import { getInKv, getLastKey, setInKv } from "@utils/kv/index.ts";
import { getUserKVConfig, UserKVConfigEntry } from "@utils/kv/instance.ts";
import { KV_USER } from "@utils/user/constant.ts";
import { getUserDatasExpiry } from "@utils/user/index.ts";
import { DateTime } from "luxon";

/** Get the content from the KV store
 *
 * The content is the full configuration of the daily "form", displayed in the home page.
 *
 * @param entry The {@linkcode UserKVConfigEntry entry} to get the content for.
 * @param args.id The id of the content to get. If not provided, the last content is returned.
 * @returns The content. Null if not found.
 */
export const getContent = async (
  entry: UserKVConfigEntry,
  { id }: { id?: string } = {},
): Promise<IContent | null> => {
  const { kv, uKey } = await getUserKVConfig(entry);

  let entryId = id;
  if (!entryId) {
    const lastKey = await getLastKey([KV_USER, uKey, KV_CONTENT]);
    if (lastKey) entryId = lastKey;
    else return null;
  }

  const { value } = await getInKv<IContent>(kv, [KV_USER, uKey, KV_CONTENT, entryId]);
  kv.close();
  return value;
};

/** Set the content in the KV store.
 *
 * @param entry The {@linkcode UserKVConfigEntry entry} to get the content for.
 * @param args.content The content to set. Must be a valid `IContent` object.
 * @returns The content. Null if not saved.
 */
export const setContent = async (
  entry: UserKVConfigEntry,
  { content }: {
    content: PartialBy<IContent, "id">;
  },
): Promise<IContent | null> => {
  const { kv, uKey, user } = await getUserKVConfig(entry);

  // Set a new id, to create a new content. Use date to have a sequencially inserted entries
  if (!content.id) content.id = String(DateTime.now().toUnixInteger());
  const res = await setInKv(kv, [KV_USER, uKey, KV_CONTENT, content.id], content, {
    expireIn: getUserDatasExpiry(user),
  });
  if (res.ok) return await getContent({ kv, uKey, user }, { id: content.id });
  else {
    kv.close();
    return null;
  }
};
