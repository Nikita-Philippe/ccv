import { TUser } from "@models/User.ts";
import { hashUserId } from "@utils/crypto.ts";
import { TKv } from "@utils/database.ts";
import { getInKv, getLastKey, setInKv } from "@utils/kv.ts";
import { DateTime } from "luxon";
import { PartialBy } from "../models/Common.ts";
import { IContent } from "../models/Content.ts";
import { KV_CONTENT, KV_CONTENT_PUBLIC } from "./constants.ts";
import { getUserDatasExpiry } from "@utils/user.ts";

const getPublicKey = (key: string) => `${KV_CONTENT_PUBLIC}${key}`;

/** Get the partial key in the content kv for the current user.
 *
 * @param user The user to get the key from
 * @returns The kv content key
 */
const getContentKey = async (user: TUser) => {
  const kvKeyId = await hashUserId(user.id);
  return user.isAuthenticated ? kvKeyId : getPublicKey(kvKeyId);
};

/** Get the content from the KV store
 *
 * The content is the full configuration of the daily "form", displayed in the home page.
 *
 * @param kv The user's cryptoKv store. Set by default using `requestTransaction`.
 * @param user The user to get the content for. Set by default using `getUserBySession`.
 * @param args.id The id of the content to get. If not provided, the last content is returned.
 * @returns The content. Null if not found.
 */
export const getContent = async (
  kv: TKv,
  user: TUser,
  { id }: { id?: string } = {},
): Promise<IContent | null> => {
  const key = await getContentKey(user);

  let entryId = id;
  if (!entryId) {
    const lastKey = await getLastKey([KV_CONTENT, key]);
    if (lastKey) entryId = lastKey;
    else return null;
  }

  const { value } = await getInKv<IContent>(kv, [KV_CONTENT, key, entryId]);
  return value;
};

/** Set the content in the KV store.
 *
 * @param kv The user's cryptoKv store. Set by default using `requestTransaction`.
 * @param user The user to set the content for. Set by default using `getUserBySession`.
 * @param args.content The content to set. Must be a valid `IContent` object.
 * @returns The content. Null if not saved.
 */
export const setContent = async (
  kv: TKv,
  user: TUser,
  { content }: {
    content: PartialBy<IContent, "id">;
  },
): Promise<IContent | null> => {
  const secondaryKey = await getContentKey(user);
  // Set a new id, to create a new content. Use date to have a sequencially inserted entries
  if (!content.id) content.id = String(DateTime.now().toUnixInteger());
  const res = await setInKv(kv, [KV_CONTENT, secondaryKey, content.id], content, { expireIn: getUserDatasExpiry(user) });
  if (res.ok) return await getContent(kv, user, { id: content.id });
  else return null;
};
