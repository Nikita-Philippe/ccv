import { IPartialStat, IStat, TAvailableCharts } from "@models/Stats.ts";
import { TUser } from "@models/User.ts";
import { hashUserId } from "@utils/crypto.ts";
import { TKv } from "@utils/database.ts";
import { getInKv, getLastKey, setInKv } from "@utils/kv.ts";
import { getUserDatasExpiry } from "@utils/user.ts";
import { DateTime } from "luxon";
import { PartialBy } from "@models/Common.ts";
import { KV_CONTENT_PUBLIC, KV_STATS } from "./constants.ts";
import { EConfigCardType } from "@models/Content.ts";

const getPublicKey = (key: string) => `${KV_CONTENT_PUBLIC}${key}`;

/** Get the partial key in the stats kv for the current user.
 *
 * @param user The user to get the key from
 * @returns The kv stats key
 */
const getStatsKey = async (user: TUser) => {
  const kvKeyId = await hashUserId(user.id);
  return user.isAuthenticated ? kvKeyId : getPublicKey(kvKeyId);
};

/** Get the stats from the KV store.
 *
 * @param kv The user's cryptoKv store. Set by default using `requestTransaction`.
 * @param user The user to get the stats for. Set by default using `getUserBySession`.
 * @param args.id The id of the stats to get. If not provided, the last stats is returned.
 * @returns The stats. Null if not found.
 */
export const getStats = async (
  kv: TKv,
  user: TUser,
  { id }: { id?: string } = {},
): Promise<IStat | null> => {
  const key = await getStatsKey(user);

  let entryId = id;
  if (!entryId) {
    const lastKey = await getLastKey([KV_STATS, key]);
    if (lastKey) entryId = lastKey;
    else return null;
  }

  const { value } = await getInKv<IStat>(kv, [KV_STATS, key, entryId]);
  return value;
};

/** Set the stats in the KV store.
 *
 * @param kv The user's cryptoKv store. Set by default using `requestTransaction`.
 * @param user The user to set the stats for. Set by default using `getUserBySession`.
 * @param args.stats The stats to set. Must be a valid `IStat` object.
 * @returns The stats. Null if not saved.
 */
export const setStats = async (
  kv: TKv,
  user: TUser,
  { stats }: {
    stats: IStat | IPartialStat;
  },
): Promise<IStat | null> => {
  const secondaryKey = await getStatsKey(user);
  // Set a new id, to create a new stats. Use date to have a sequencially inserted entries
  if (!stats.id) stats.id = String(DateTime.now().toUnixInteger());

  stats.charts = stats.charts.map((chart, i) => ({
    ...chart,
    id: chart.id ?? `chart-${i}-${String(DateTime.now().toUnixInteger())}`,
  }));

  const res = await setInKv(kv, [KV_STATS, secondaryKey, stats.id], stats, { expireIn: getUserDatasExpiry(user) });
  if (res.ok) return await getStats(kv, user, { id: stats.id });
  else return null;
};
