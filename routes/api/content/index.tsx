import { Handlers } from "$fresh/server.ts";
import { IContent, TField } from "@models/Content.ts";
import { getContent, setContent } from "@utils/content.ts";
import { getHelloPageRedirect, getUserBySession } from "@utils/user/auth.ts";

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
};
