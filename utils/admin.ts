import { unique } from "@kitsonk/kv-toolbox/keys";
import { IAdminUserStat } from "@models/App.ts";
import { KV_CONTENT, KV_DAILY_ENTRY } from "@utils/constants.ts";
import { openKV } from "@utils/kv/instance.ts";
import { KV_USER } from "@utils/user/constant.ts";

/** Get some stats for the admin page.
 * 
 * Do NOT call this function before erifying user with `isSuperAdmin`
 * 
 * @param entry 
 * @returns 
 */
export const getSAdminStats = async (): Promise<IAdminUserStat | null> => {
  const defaultKv = await openKV();

  const userKeys = await unique(defaultKv, [KV_USER], { limit: 10000 }).then((v) => v.map(([_, key]) => key as string));

  const datas: IAdminUserStat = {
    users: [],
    db: {
      path: Deno.env.get("KV_PATH"),
    },
    config: globalThis.ccv_config
  };

  for (const key of userKeys) {
    const contentKeys = await unique(defaultKv, [KV_USER, key, KV_CONTENT], { limit: 10000 }).then((v) =>
      v.map(([_, __,___, key]) => key as string)
    );
    const entryKeys = await unique(defaultKv, [KV_USER, key, KV_DAILY_ENTRY], { limit: 10000 }).then((v) =>
      v.map(([_, __,___, key]) => key as string)
    );

    datas.users.push({ user: key, content: contentKeys, entries: entryKeys });
  }

  return datas;
};
