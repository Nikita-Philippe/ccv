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
import { TField } from "@models/Content.ts";

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

export default async function Home({ data }: PageProps<{ message: string }>) {
  const content = await getContent();
  const lastDay = await getEntry();
  const missingDays = await missingEntries(APP_DAYS_MISS_CHECK);

  const entriesContent = content?.fields.reduce((acc, field) => {
    if (!acc[field.group]) acc[field.group] = [];
    acc[field.group].push(field);
    return acc;
  }, {} as Record<TField["group"], TField[]>);

  return (
    <form
      method="POST"
      className="flex flex-col gap-2 justify-start"
    >
      {<p>{data?.message}</p>}
      <input type="hidden" name="id" value={content?.id} />
      {content && entriesContent &&
        Object.entries(entriesContent).map(([group, fields]) => (
          <div key={group} className="flex flex-col gap-2">
            <h2>{group}</h2>
            {fields.map((field) => {
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
          </div>
        ))}
      <SaveButton missingDays={missingDays} daysChecked={APP_DAYS_MISS_CHECK} />
    </form>
  );
}
