import { Handlers } from "$fresh/server.ts";
import { getMeta, remove } from "@kitsonk/kv-toolbox/blob";
import { IContent, TField } from "@models/Content.ts";
import { KV_CONTENT } from "@utils/constants.ts";
import { getContent, setContent } from "@utils/content.ts";
import { getUserKVConfig, openKV } from "@utils/kv/instance.ts";
import { getHelloPageRedirect, getUserBySession } from "@utils/user/auth.ts";
import { KV_USER } from "@utils/user/constant.ts";
import { isSuperAdmin } from "@utils/user/index.ts";

export const handler: Handlers<TField | null> = {
  async PUT(req, _) {
    const user = await getUserBySession(req);
    if (!user) return getHelloPageRedirect(req.url);

    const body = await req.json();

    const content = body?.content as IContent | undefined;
    if (!content) return new Response("No content provided", { status: 400 });

    const currentContent = await getContent(user, { id: content.id });

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

    const res = await setContent(user, { content });

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

      const [userKey, contentKey] = ctx.params.id?.split(";;") ?? [];

      if (!userKey || !contentKey) throw new Error("Invalid id");

      const { uKey } = await getUserKVConfig(req);

      // Forbidden request. Only current user or super admin can delete cobntent.
      if (uKey !== userKey && !await isSuperAdmin(user)) throw new Error("Invalid request");

      const defaultKv = await openKV();

      const isContentExist = await getMeta(defaultKv, [KV_USER, userKey, KV_CONTENT, contentKey]).then((v) =>
        !!v.versionstamp
      );
      if (!isContentExist) throw new ReferenceError(`Content ${contentKey} does not exists for deletion.`);

      await remove(defaultKv, [KV_USER, userKey, KV_CONTENT, contentKey]);

      defaultKv.close();

      return new Response(null, { status: 200 });
    } catch (e) {
      if (e instanceof Error || e instanceof ReferenceError) return new Response(e.message, { status: 400 });

      console.error("Unknown error in content deletion", e);

      return new Response("Internal server error", { status: 500 });
    }
  },
};
