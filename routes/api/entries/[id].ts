import { Handlers } from "$fresh/server.ts";
import { getMeta, remove } from "@kitsonk/kv-toolbox/blob";
import { getUserBySession } from "@utils/auth.ts";
import { KV_DAILY_ENTRY } from "@utils/constants.ts";
import { hashUserId } from "@utils/crypto.ts";
import { isSuperAdmin } from "@utils/user.ts";

export const handler: Handlers = {
  async DELETE(req, ctx) {
    try {
      const user = await getUserBySession(req, true);
      if (!user) throw new Error("Invalid request");

      const [userKey, entryKey] = ctx.params.id?.split(";;") ?? [];

      if (!userKey || !entryKey) throw new Error("Invalid id");

      const currentUserKey = await hashUserId(user.id);

      // Forbidden request. Only current user or super admin can delete entry.
      if (currentUserKey !== userKey && !await isSuperAdmin(user)) throw new Error("Invalid request");

      const defaultKv = await Deno.openKv(Deno.env.get("KV_PATH"));

      const isEntryExist = await getMeta(defaultKv, [KV_DAILY_ENTRY, userKey, entryKey]).then((v) => !!v.versionstamp);
      if (!isEntryExist) throw new ReferenceError(`Entry ${entryKey} does not exists for deletion.`);

      await remove(defaultKv, [KV_DAILY_ENTRY, userKey, entryKey]);

      defaultKv.close();

      return new Response(null, { status: 200 });
    } catch (e) {
      if (e instanceof Error || e instanceof ReferenceError) return new Response(e.message, { status: 400 });

      console.error("Unknown error in entry deletion", e);

      return new Response("Internal server error", { status: 500 });
    }
  },
};
