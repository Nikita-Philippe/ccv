import { Handlers } from "$fresh/server.ts";
import { IContent, TField } from "@models/Content.ts";
import { getContent, setContent } from "@utils/content.ts";
import { KV_CONTENT } from "@utils/constants.ts";

const kv = await Deno.openKv();

export const handler: Handlers<TField | null> = {
  async PUT(req, ctx) {
    const { id } = ctx.params;

    // FIXME: debug just for now, to clear all configs
    if (id === "debug") {
      const entries = kv.list<IContent>({ prefix: [KV_CONTENT] }, {
        limit: 100,
        reverse: true,
      });
      for await (const entry of entries) {
        const { value } = entry;
        await kv.delete([KV_CONTENT, value.id]);
      }
      return new Response("Cleared", { status: 200 });
    }

    const body = await req.json();

    let content = body?.content as IContent | undefined;
    if (!content) return new Response("No content provided", { status: 400 });

    const currentContent = await getContent(content.id);

    const sameNames = [];

    for (const field of content.fields) {
      const allFieldNames = (currentContent?.fields ?? []).filter((f) => f.id !== field.id).map((f) => f.name);
      if (allFieldNames.includes(field.name)) sameNames.push(field.name);
    }

    if (sameNames.length > 0) {
      return new Response(
        JSON.stringify({
          error: {
            message: "Some field names already exists.",
            details: sameNames.map((n) => `The field "${n}" already exists.`),
          },
        }),
        { status: 400 },
      );
    }

    const res = await setContent(content);

    if (res?.id) {
      return new Response(JSON.stringify(res), { status: 200 });
    } else {
      console.log("res", res);
      return new Response("Error", { status: 500 });
    }
  },
  // async DELETE(_req, ctx) {

  // },
};
