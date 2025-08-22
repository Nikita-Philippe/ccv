import { Handlers } from "$fresh/server.ts";
import { IContent, TField } from "@models/Content.ts";
import { getHelloPageRedirect, getUserBySession } from "@utils/auth.ts";
import { requestTransaction } from "@utils/database.ts";
import { getMeta, remove } from "@kitsonk/kv-toolbox/blob";
import { KV_CONTENT, KV_DAILY_ENTRY } from "@utils/constants.ts";
import { hashUserId } from "@utils/crypto.ts";
import { isSuperAdmin } from "@utils/user.ts";

export const handler: Handlers<TField | null> = {
  async PUT(req, _) {
    const user = await getUserBySession(req);
    if (!user) return getHelloPageRedirect(req.url);

    const body = await req.json();

    const content = body?.content as IContent | undefined;
    if (!content) return new Response("No content provided", { status: 400 });

    const currentContent = await requestTransaction(req, { action: "getContent", args: [{ id: content.id }] });

    // Group all names from current and new, and check if some are more than 2 times (current + new)
    const occurenceOfNames = [
      ...(currentContent?.fields ?? []).map((f) => f.name),
      ...content.fields.map((f) => f.name),
    ].reduce((acc, name) => {
      acc[name] = (acc[name] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const duplicatesNames = Object.entries(occurenceOfNames).filter(([_, v]) => v > 2).map(([k]) => k);

    if (duplicatesNames.length) {
      return new Response(
        JSON.stringify({
          error: {
            message: "Some field names already exists.",
            details: duplicatesNames.map((n) => `The field "${n}" already exists.`),
          },
        }),
        { status: 400 },
      );
    }

    const res = await requestTransaction(req, { action: "setContent", args: [{ content }] });

    if (res?.id) {
      return new Response(JSON.stringify(res), { status: 200 });
    } else {
      console.error("Saving content error:", res);
      return new Response("Error", { status: 500 });
    }
  },
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

      const isEntryExist = await getMeta(defaultKv, [KV_CONTENT, userKey, entryKey]).then((v) => !!v.versionstamp);
      if (!isEntryExist) throw new ReferenceError(`Entry ${entryKey} does not exists for deletion.`);

      await remove(defaultKv, [KV_CONTENT, userKey, entryKey]);

      defaultKv.close();

      return new Response(null, { status: 200 });
    } catch (e) {
      if (e instanceof Error || e instanceof ReferenceError) return new Response(e.message, { status: 400 });

      console.error("Unknown error in entry deletion", e);

      return new Response("Internal server error", { status: 500 });
    }
  },
};
