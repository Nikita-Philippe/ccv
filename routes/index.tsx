import { Handlers, PageProps } from "$fresh/server.ts";
import Field from "@islands/Field/index.tsx";
import { getContent } from "@utils/content.ts";
import {
  getEntry,
  isTodayAlreadySaved,
  missingEntries,
  parseEntry,
  saveEntries,
  stringifyEntryValue,
} from "@utils/entries.ts";
import { difference } from "lodash";
import { DateTime } from "luxon";
import { APP_DAYS_MISS_CHECK } from "@utils/constants.ts";
import SaveButton from "@islands/SaveDailyButton.tsx";

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

    // Save daily data.
    const res = await saveEntries(
      contentId.toString(),
      entries,
      date.toString(),
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
 *  - add check for same field names
 */
export default async function Home({ data }: PageProps<{ message: string }>) {
  const content = await getContent();
  const lastDay = await getEntry();
  const missingDays = await missingEntries(APP_DAYS_MISS_CHECK);

  return (
    <form
      method="POST"
      className="flex flex-col gap-2 justify-start"
    >
      {<p>{data?.message}</p>}
      <input type="hidden" name="id" value={content?.id} />
      {content?.fields.map((field, index) => {
        const lastEntry = lastDay?.entries.find((e) => e.name === field.name);
        const lastValue = lastEntry ? stringifyEntryValue(lastEntry, content) : undefined;
        return (
          <Field
            key={field.name}
            field={field}
            lastValue={lastValue}
          />
        );
      })}
      <SaveButton missingDays={missingDays} daysChecked={APP_DAYS_MISS_CHECK} />
    </form>
  );
}
