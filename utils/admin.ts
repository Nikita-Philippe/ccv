import { unique } from "@kitsonk/kv-toolbox/keys";
import { IAdminUserStat } from "@models/App.ts";
import { TUser } from "@models/User.ts";
import { KV_CONTENT, KV_DAILY_ENTRY, KV_USER } from "./constants.ts";
import { TKv } from "./database.ts";
import { isSuperAdmin } from "./user.ts";

export const getSAdminStats = async (
  _kv: TKv,
  user: TUser,
): Promise<IAdminUserStat[] | null> => {
  if (!await isSuperAdmin(user)) return null;

  const defaultKv = await Deno.openKv(Deno.env.get("KV_PATH"));

  const userKeys = await unique(defaultKv, [KV_USER], { limit: 1000 }).then((v) => v.map(([_, key]) => key as string));

  const datas: IAdminUserStat[] = [];

  for (const key of userKeys) {
    const contentKeys = await unique(defaultKv, [KV_CONTENT, key], { limit: 1000 }).then((v) =>
      v.map(([_, __, key]) => key as string)
    );
    const entryKeys = await unique(defaultKv, [KV_DAILY_ENTRY, key], { limit: 1000 }).then((v) =>
      v.map(([_, __, key]) => key as string)
    );

    datas.push({ user: key, content: contentKeys, entries: entryKeys });
  }

  return datas;
};
