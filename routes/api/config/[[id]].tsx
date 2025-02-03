import { Handlers } from "$fresh/server.ts";
import { TField } from "@models/Content.ts";
import { setContent } from "@utils/content.ts";

export const handler: Handlers<TField | null> = {
  async PUT(req, ctx) {
    const { id } = ctx.params;
    const body = await req.json();

    if (!body?.content) return new Response("No content provided", { status: 400 });
    console.log({ id, body });

    const res = await setContent(body.content);

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
