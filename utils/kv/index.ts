import { CryptoKv } from "@kitsonk/kv-toolbox/crypto";
import { KeyTree, tree, unique } from "@kitsonk/kv-toolbox/keys";
import { openKV } from "./instance.ts";
import { remove } from "@kitsonk/kv-toolbox/blob";

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
  const kv = await openKV();
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
 * @experimental - For now selector start/end does not work
 */
export const listInKv = async <T>(
  kv: CryptoKv,
  selector: Deno.KvListSelector,
  options?: Deno.KvListOptions,
): Promise<Deno.KvEntryMaybe<T>[]> => {
  // FIXME: Implement start/end based on code research
  // @ts-expect-error - Prefix and/or start-end
  const prefix = (selector.prefix ?? selector.start ?? selector.end) as Deno.KvKey;
  const defaultKv = await openKV();
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
// export const listInKv = async <T>(
//   kv: CryptoKv,
//   selector: Deno.KvListSelector,
//   options?: Deno.KvListOptions,
// ): Promise<Deno.KvEntryMaybe<T>[]> => {
//   const defaultKv = await Deno.openKv(Deno.env.get("KV_PATH"));
//   const keys = await unique(query(defaultKv, selector, options));
//   console.log("test", keys)
//   console.log("listInKv - Found keys:", keys);
//   if (!keys) return [];

//   const entries: Deno.KvEntryMaybe<T>[] = [];
//   let index = 0;
//   for await (const key of keys) {
//     index++
//     if (index < 10) console.log("element:", key);
//     continue
//     const entry = await getInKv<T>(kv, key);
//     entries.push(entry);
//   }
//   defaultKv.close();
//   return entries;
// };

/** Get all key paths from a KeyTree up to a specified depth.
 *
 * @param tree The KeyTree to extract keys from.
 * @param depth The maximum depth to traverse. Defaults to Infinity.
 * @returns An array of Deno.KvKey paths.
 * @example
 * ```ts
 * const kv = await Deno.openKv();
 * const keyTree = await tree(kv, ['some', 'prefix']);
 * const allKeys = getAllKeyPaths(keyTree, 2); // Get all keys up to depth 2
 * console.log(allKeys);
 * ```
 * @experimental
 */
export function getAllKeyPaths(tree: KeyTree, depth = Infinity): Deno.KvKey[] {
  const results: Deno.KvKey[] = [];

  function walk(node: Required<KeyTree>["children"][0], path: Deno.KvKey, currentDepth: number) {
    const currentPath = [...path, node.part];

    // If this node has children with toolbox keys, add this path and stop recursion
    if (node.children?.some((child) => child.part === "__kv_toolbox_blob__" || child.part === "__kv_toolbox_meta__")) {
      results.push(currentPath);
      return;
    }

    if (node.hasValue) {
      results.push(currentPath);
    }

    if (node.children && currentDepth < depth) {
      for (const child of node.children) {
        walk(child, currentPath, currentDepth + 1);
      }
    }
  }

  // Start with the prefix if present
  const startPath: Deno.KvKey = tree.prefix ? [...tree.prefix] : [];
  if (tree.children) {
    for (const child of tree.children) {
      walk(child, startPath, 0);
    }
  }

  return results;
}

/** Remove a key and all its sub-keys from the KV store.
 *
 * @param kv The Deno.Kv or CryptoKv instance.
 * @param key The key path to remove.
 * @param depth The maximum depth to traverse for removal. Defaults to Infinity.
 * @returns True if the operation was successful, false otherwise.
 * @experimental
 */
export const removeInKv = async (kv: Deno.Kv, key: Deno.KvKey, { depth = Infinity } = {}) => {
  try {
    const keyGraph = await tree(kv, key);

    const allKeys = getAllKeyPaths(keyGraph, depth);

    for (const key of allKeys) {
      await remove(kv, key);
    }

    return true;
  } catch (e) {
    console.error("Failed to removeInKv", e);
    return false;
  }
};
