import { getMeta, remove } from "jsr:@kitsonk/kv-toolbox@^0.30.0/blob";
import { KeyTree, tree } from "jsr:@kitsonk/kv-toolbox@^0.30.0/keys";

const dbURL = Deno.env.get("DB_URL");
const dbToken = Deno.env.get("DB_TOKEN");

if (!dbURL || !dbToken) {
  console.error("DB_URL and DB_TOKEN must be set in envs to drop the database.");
  Deno.exit(1);
}

function getAllKeyPaths(tree: KeyTree, depth = Infinity): Deno.KvKey[] {
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

const removeInKv = async (kv: Deno.Kv, key: Deno.KvKey, { depth = Infinity } = {}) => {
  try {
    const keyGraph = await tree(kv, key);

    const allKeys = getAllKeyPaths(keyGraph, depth);

    for (const key of allKeys) {
      await remove(kv, key);
      const val = await getMeta(kv, key);
      if (val?.key) {
        await kv.delete(key);
        console.log("value removed at", key);
      } else {
        console.log("blob removed at", key);
      }
    }

    return true;
  } catch (e) {
    console.error("Failed to removeInKv", e);
    return false;
  }
};

const functionDropDB = async () => {
  Deno.env.set("DENO_KV_ACCESS_TOKEN", dbToken);

  const kv = await Deno.openKv(dbURL);

  await removeInKv(kv, []);

  kv.close();
};

await functionDropDB();
