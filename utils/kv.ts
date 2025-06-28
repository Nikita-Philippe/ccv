import { CryptoKv } from "@kitsonk/kv-toolbox/crypto";
import { unique } from "@kitsonk/kv-toolbox/keys";
import { KV_PATH } from "@utils/constants.ts";

/** Convert the data to a blob, to be used by the KV store
 *
 * @param data The data to convert
 * @returns The blob, or null if the data could not be converted
 * @experimental
 */
export const blobifyData = (data: any): Blob | null => {
  try {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    return blob;
  } catch (e) {
    console.error("Failed to blobify data", e);
    return null;
  }
};

/** Convert the blob to data from the KV store
 *
 * @param data The data to convert
 * @returns The data, or null if the data could not be converted
 * @experimental
 */
export const deblobifyData = <T>(data: Uint8Array): T | null => {
  try {
    const extractedData = new TextDecoder().decode(data);
    return JSON.parse(extractedData);
  } catch (e) {
    console.error("Failed to deblobify data", e);
    return null;
  }
};

/** Get the last key in the KV store.
 *
 * Use it when you need to get the key, as asked when using CryptoKv.
 *
 * @param key The key path to get the last key from.
 * @returns The last key, or null if not found.
 * @experimental
 */
export const getLastKey = async (key: Deno.KvKey): Promise<string | undefined> => {
  const kv = await Deno.openKv(KV_PATH);
  const keys = await unique(kv, key, { limit: 1, reverse: true });
  kv.close();
  return ((keys as unknown as string[][])[0] ?? []).pop();
};

const NULL_ENTRY = { key: [], value: null, versionstamp: null };
/** Utility function to get a value from the KV store.
 *
 * @experimental
 */
export const getInKv = async <T>(
  kv: CryptoKv,
  key: Deno.KvKey,
  options?: { consistency?: Deno.KvConsistencyLevel },
): Promise<Deno.KvEntryMaybe<T>> => {
  const entry = await kv.getBlob(key, options);
  if (!entry.value) return NULL_ENTRY;
  const res = deblobifyData<T>(entry.value);
  return res ? { ...entry, value: res } : NULL_ENTRY;
};

const NULL_RES = { ok: false } as Deno.KvCommitError;

/** Utility function to set a value in the KV store.
 *
 * @experimental
 */
export const setInKv = async (
  kv: CryptoKv,
  key: Deno.KvKey,
  value: Parameters<typeof blobifyData>[0],
  options?: { expireIn?: number },
): Promise<Deno.KvCommitResult | Deno.KvCommitError> => {
  const blob = blobifyData(value);
  if (!blob) return NULL_RES;
  return await kv.setBlob(key, blob, options);
};

/** Get a list of entries from the KV store.
 *
 * Based on the Deno.Kv.list method.
 *
 * @experimental
 */
export const listInKv = async <T>(
  kv: CryptoKv,
  selector: Deno.KvListSelector,
  options?: Deno.KvListOptions,
): Promise<Deno.KvEntryMaybe<T>[]> => {
  // @ts-expect-error - Prefix and/or start-end
  const prefix = (selector.prefix ?? [selector.start, selector.end]) as Deno.KvKey;
  const defaultKv = await Deno.openKv(KV_PATH);
  const keys = await unique(defaultKv, prefix, options);
  defaultKv.close();
  if (!keys) return [];

  const entries: Deno.KvEntryMaybe<T>[] = [];
  for (const key of keys) {
    const entry = await getInKv<T>(kv, key);
    entries.push(entry);
  }
  return entries;
};
