import { Handlers, PageProps } from "$fresh/server.ts";
import Field from "@islands/Field/index.tsx";
import { getContent } from "@utils/content.ts";
import { parseEntry, saveEntries } from "@utils/entries.ts";
import { difference } from "lodash";
import { DateTime } from "luxon";

type HandlerType = {
  // toast: Toast | null;
};

export const handler: Handlers<HandlerType | null> = {
  async POST(req, ctx) {
    const form = await req.formData();
    const url = new URL(req.url);

    const { id: contentId, date, ...formData } = Object.fromEntries(form);

    if (!contentId) return await ctx.render({ message: "No content id provided" });

    const content = await getContent(contentId.toString());

    if (!content) return await ctx.render({ message: "No content found" });

    // Check that form match the content
    const allFields = content.fields.map((f) => f.name);
    const differenceFields = difference(Object.keys(formData), allFields);
    if (differenceFields.length > 0) {
      console.error("Some keys are missing in sended form:", differenceFields);
      return await ctx.render({ message: "Some keys are missing in sended form" });
    }

    // Format and parse entries to be saved
    const entries = Object.entries(formData).map(([name, value]) => ({ name, value })).map((entry) =>
      parseEntry(entry, content)
    );
    // Get date as JS Date
    const saveAt = DateTime.fromISO(date.toString()).toJSDate();

    // Save daily data.
    const res = await saveEntries(
      contentId.toString(),
      entries,
      saveAt,
    );

    return await ctx.render({ message: "goood" });
  },
};

/** // TODO:
 *  - add toast
 *  - add previous data
 *  - add date picker
 *  - add backup cron
 *  - add export button
 */
export default async function Home({ data }: PageProps<{ message: string }>) {
  const content = await getContent();

  return (
    <form method="POST">
      {<p>{data?.message}</p>}
      <input type="hidden" name="id" value={content?.id} />
      {content?.fields.map((field, index) => <Field key={field.name} field={field} />)}
      <button type="submit">Save</button>
      <input type="date" name="date" defaultValue={DateTime.now().minus({ days: 1 }).toISODate()} />
    </form>
  );
}
