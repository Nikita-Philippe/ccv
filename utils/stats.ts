import { IPartialStat, IStat } from "@models/Stats.ts";
import { KV_STATS } from "@utils/constants.ts";
import { getInKv, getLastKey, setInKv } from "@utils/kv/index.ts";
import { getUserKVConfig, UserKVConfigEntry } from "@utils/kv/instance.ts";
import { KV_USER } from "@utils/user/constant.ts";
import { getUserDatasExpiry } from "@utils/user/index.ts";
import { DateTime } from "luxon";

/** Get the stats from the KV store.
 *
 * @param entry The {@linkcode UserKVConfigEntry entry} to get the content for.
 * @param args.id The id of the stats to get. If not provided, the last stats is returned.
 * @returns The stats. Null if not found.
 */
export const getStats = async (
  entry: UserKVConfigEntry,
  { id }: { id?: string } = {},
): Promise<IStat | null> => {
  const { kv, uKey } = await getUserKVConfig(entry);

  let entryId = id;
  if (!entryId) {
    const lastKey = await getLastKey([KV_USER, uKey, KV_STATS]);
    if (lastKey) entryId = lastKey;
    else return null;
  }
  const { value } = await getInKv<IStat>(kv, [KV_USER, uKey, KV_STATS, entryId]);
  return value;
};

/** Set the stats in the KV store.
 *
 * @param entry The {@linkcode UserKVConfigEntry entry} to get the content for.
 * @param args.stats The stats to set. Must be a valid `IStat` object.
 * @returns The stats. Null if not saved.
 */
export const setStats = async (
  entry: UserKVConfigEntry,
  { stats }: {
    stats: IStat | IPartialStat;
  },
): Promise<IStat | null> => {
  const cfg = await getUserKVConfig(entry);

  // Set a new id, to create a new stats. Use date to have a sequencially inserted entries
  if (!stats.id) stats.id = String(DateTime.now().toUnixInteger());

  (["charts", "metrics"] as const).forEach((key) => {
    // @ts-ignore - stats[key] is an array of IPartialStat
    stats[key] = (stats[key] ?? []).map((item, i) =>
      item
        ? ({
          ...item,
          id: item.id ?? `${key}-${i}-${String(DateTime.now().toUnixInteger())}`,
        })
        : item
    );
  });

  const res = await setInKv(cfg.kv, [KV_USER, cfg.uKey, KV_STATS, stats.id], stats, {
    expireIn: getUserDatasExpiry(cfg.user),
  });
  if (res.ok) return await getStats(cfg, { id: stats.id });
  else return null;
};
