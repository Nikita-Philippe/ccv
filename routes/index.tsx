import { Handlers, RouteContext } from "$fresh/server.ts";
import Field from "@islands/Field/index.tsx";
import SaveButton from "@islands/SaveDailyButton.tsx";
import Card from "@islands/UI/Card.tsx";
import ToasterWrapper from "@islands/UI/Toast/ToasterWrapper.tsx";
import { TField } from "@models/Content.ts";
import { APP_DAYS_MISS_CHECK } from "@utils/constants.ts";
import { getContent } from "@utils/content.ts";
import { getEntry, missingEntries, parseEntry, saveEntries, stringifyEntryValue } from "@utils/entries.ts";
import { capitalize, difference } from "lodash";

type HandlerType = {
  message?: string;
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

    if (!res?.at) return await ctx.render({ message: "An error occured while saving. Please try again." });
    return await ctx.render({ message: "Data saved successfully" });
  },
};

export default async function Home(_: Request, { data }: RouteContext<HandlerType>) {
  const content = await getContent();
  const lastDay = await getEntry();
  const missingDays = await missingEntries(APP_DAYS_MISS_CHECK);

  const entriesContent = content?.fields.reduce((acc, field) => {
    const group = field.group ?? "";
    const entry = acc.find((e) => e.group === group);
    if (entry) entry.fields.push(field);
    else acc.push({ group, fields: [field] });
    return acc;
  }, [] as { group: TField["group"]; fields: TField[] }[]).sort((a, b) => b.group.localeCompare(a.group));

  return (
    <form
      method="POST"
      className="flex flex-col gap-2 justify-start"
    >
      <input type="hidden" name="id" value={content?.id} />
      {content && entriesContent &&
        entriesContent.map(({ group, fields }) => (
          <Card key={group} title={capitalize(group)}>
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
          </Card>
        ))}
      <SaveButton missingDays={missingDays} daysChecked={APP_DAYS_MISS_CHECK} />
      {data?.message && <ToasterWrapper content={{ id: "1", description: data.message }} />}
    </form>
  );
}
