import { Handlers } from "$fresh/server.ts";
import { IContent, TField } from "@models/Content.ts";
import { getHelloPageRedirect, getUserBySession } from "@utils/auth.ts";
import { requestTransaction } from "@utils/database.ts";
import { IPartialStat, IStat } from "@models/Stats.ts";

export const handler: Handlers<TField | null> = {
  async PUT(req, _) {
    const user = await getUserBySession(req);
    if (!user) return getHelloPageRedirect(req.url);

    const body = await req.json();

    const stats = body?.stats as IStat | IPartialStat | null;
    if (!stats) return new Response("No content provided", { status: 400 });

    const res = await requestTransaction(req, { action: "setStats", args: [{ stats }] });

    if (res?.id) {
      return new Response(JSON.stringify(res), { status: 200 });
    } else {
      console.error("Saving content error:", res);
      return new Response("Error", { status: 500 });
    }
  },
};
