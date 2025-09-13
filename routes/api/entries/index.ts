import { Handlers } from "$fresh/server.ts";
import { TField } from "@models/Content.ts";
import { getContent } from "@utils/content.ts";
import { exportEntries } from "@utils/entries.ts";
import { getHelloPageRedirect, getUserBySession } from "@utils/user/auth.ts";

export const handler: Handlers<TField | null> = {
  async GET(req) {
    // Retrive infos from the url query
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");

    const user = await getUserBySession(req);
    if (!user) return getHelloPageRedirect(req.url);

    const content = await getContent(user, { id: id || undefined });

    if (!id || !content || !from || !to) {
      return new Response(JSON.stringify({ error: "Missing parameters" }), { status: 400 });
    }

    const datas = await exportEntries(user, { contentId: id, from, to });
    if (!datas?.length) return new Response(null, { status: 204 });

    return new Response(JSON.stringify(datas), { status: 200 });
  },
};
