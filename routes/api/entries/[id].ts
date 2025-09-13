import { Handlers } from "$fresh/server.ts";
import { getMeta, remove } from "@kitsonk/kv-toolbox/blob";
import { KV_DAILY_ENTRY } from "@utils/constants.ts";
import { getUserBySession } from "@utils/user/auth.ts";
import { isSuperAdmin } from "@utils/user/index.ts";
import { getUserKVConfig, openKV } from "@utils/kv/instance.ts";
import { KV_USER } from "@utils/user/constant.ts";

export const handler: Handlers = {
  async DELETE(req, ctx) {
    try {
      const user = await getUserBySession(req, true);
      if (!user) throw new Error("Invalid request");

      const [userKey, entryKey] = ctx.params.id?.split(";;") ?? [];

      if (!userKey || !entryKey) throw new Error("Invalid id");

      const { uKey } = await getUserKVConfig(req);

      // Forbidden request. Only current user or super admin can delete entry.
      if (uKey !== userKey && !await isSuperAdmin(user)) throw new Error("Invalid request");

      const defaultKv = await openKV();

      const isEntryExist = await getMeta(defaultKv, [KV_USER, userKey, KV_DAILY_ENTRY, entryKey]).then((v) => !!v.versionstamp);
      if (!isEntryExist) throw new ReferenceError(`Entry ${entryKey} does not exists for deletion.`);

      await remove(defaultKv, [KV_USER, userKey, KV_DAILY_ENTRY, entryKey]);

      defaultKv.close();

      return new Response(null, { status: 200 });
    } catch (e) {
      if (e instanceof Error || e instanceof ReferenceError) return new Response(e.message, { status: 400 });

      console.error("Unknown error in entry deletion", e);

      return new Response("Internal server error", { status: 500 });
    }
  },
};
