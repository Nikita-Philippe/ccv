import { Handlers } from "$fresh/server.ts";
import { AvailableTemplateType, ITemplate } from "@models/Template.ts";
import { resolve } from "@std/path/resolve";
import { getUserBySession } from "@utils/auth.ts";

export const handler: Handlers = {
  async GET(req, ctx) {
    try {
      const user = await getUserBySession(req, true);
      if (!user) return new Response("Unauthorized", { status: 401 });

      const type = ctx.params.type as AvailableTemplateType | null;

      if (!type) return new Response("Invalid request", { status: 400 });

      const basePath = resolve(Deno.cwd(), "templates", type);
      if (!basePath) throw new Error(`Could not resolve base path for type ${type}`);

      const templateDir = await Deno.readDir(basePath);

      const templates: ITemplate[] = [];

      for await (const { name } of templateDir) {
        try {
          const parsedFile: unknown = JSON.parse(await Deno.readTextFile(resolve(basePath, name)));
          console.log('Parsed file', parsedFile);
          if (
            !parsedFile || typeof parsedFile !== "object" ||
            !("type" in parsedFile && "label" in parsedFile && "content" in parsedFile)
          ) throw new Error(`File ${name} has invalid content`);
          templates.push(parsedFile as ITemplate);
        } catch (e) {
          console.error(`Could not load template at ${name}`, e);
          continue;
        }
      }

      return new Response(JSON.stringify(templates), { status: 200 });
    } catch (e) {
      console.error("Unknown error in templates", e);

      return new Response("Internal server error", { status: 500 });
    }
  },
};
