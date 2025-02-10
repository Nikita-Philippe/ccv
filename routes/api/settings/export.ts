import { Handlers } from "$fresh/server.ts";
import { TField } from "@models/Content.ts";
import { getContent } from "@utils/content.ts";
import { exportEntries } from "@utils/entries.ts";
import { datasToCSV, datasToJSON } from "@utils/export.ts";

export const handler: Handlers<TField | null> = {
  async GET(req) {
    // Retrive infos from the url query
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const type = url.searchParams.get("type");

    const content = await getContent(id ?? "");

    if (!id || !content || !from || !to || !type) {
      return new Response(JSON.stringify({ error: "Missing parameters" }), { status: 400 });
    }

    const datas = await exportEntries(id, from, to);
    if (!datas.length) return new Response(null, { status: 204 });

    if (type === "json") {
      const parsed = datasToJSON(datas);
      return new Response(parsed.content, {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${parsed.filename}"`,
        },
      });
    } else if (type === "csv") {
      const parsed = datasToCSV(datas, content);
      return new Response(parsed.content, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${parsed.filename}"`,
        },
      });
    }

    return new Response(JSON.stringify({ error: "Bad type" }), { status: 400 });
  },
};
