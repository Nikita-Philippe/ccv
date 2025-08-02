import { Handlers } from "$fresh/server.ts";
import Field from "@islands/Field/index.tsx";
import SaveButton from "@islands/SaveDailyButton.tsx";
import Card from "@islands/UI/Card.tsx";
import { IDefaultPageHandler } from "@models/App.ts";
import { TField } from "@models/Content.ts";
import { APP_DAYS_MISS_CHECK } from "@utils/constants.ts";
import { requestTransaction } from "@utils/database.ts";
import { parseEntry, stringifyEntryValue } from "@utils/entries.ts";
import { capitalize, difference } from "lodash";
import Button from "@islands/UI/Button.tsx";

export const handler: Handlers<IDefaultPageHandler> = {
  async POST(req, ctx) {
    const form = await req.formData();

    const { id: contentId, date, ...formData } = Object.fromEntries(form);

    if (!contentId) return await ctx.render({ message: { type: "error", message: "No content id provided" } });

    const content = await requestTransaction(req, { action: "getContent" });
    if (!content) return await ctx.render({ message: { type: "error", message: "Content not found" } });

    // Check that form match the content
    const allFields = content.fields.map((f) => f.name);
    const differenceFields = difference(Object.keys(formData), allFields);
    if (differenceFields.length > 0) {
      console.error("Some keys are missing in sended form:", differenceFields);
      return await ctx.render({ message: { type: "error", message: `Some keys are missing in sended form` } });
    }

    // Format and parse entries to be saved
    const entries = Object.entries(formData).map(([name, value]) => ({ name, value })).map((entry) =>
      parseEntry(entry, content)
    );

    // Save daily data.
    const res = await requestTransaction(req, {
      action: "saveEntries",
      args: [{ contentId: contentId.toString(), entries, at: date.toString() }],
    });

    if (!res) {
      return await ctx.render({
        message: { type: "error", message: "An error occurred while saving. Please try again." },
      });
    }
    return await ctx.render({ message: { type: "success", message: "Data saved successfully" } });
  },
};

export default async function Home(req: Request) {
  const content = await requestTransaction(req, { action: "getContent" });
  const lastDay = await requestTransaction(req, { action: "getEntry" });
  const missingDays = await requestTransaction(req, {
    action: "missingEntries",
    args: [{ days: APP_DAYS_MISS_CHECK }],
  });

  const entriesContent = content?.fields.reduce((acc, field) => {
    const group = field.group ?? "";
    const entry = acc.find((e) => e.group === group);
    if (entry) entry.fields.push(field);
    else acc.push({ group, fields: [field] });
    return acc;
  }, [] as { group: TField["group"]; fields: TField[] }[]).sort((a, b) => b.group.localeCompare(a.group));

  if (!content || !entriesContent) {
    return (
      <Card sx={{ content: "p-4 flex-col no-wrap relative" }}>
        <h3>
          You don't have any content configured yet.
        </h3>
        <p>
          <Button class="btn w-fit h-fit py-0.5" spinnerProps={{ class: "loading-dots" }}>
            <a href="/app/config">Configure</a>
          </Button>{" "}
          now your first form, and start tracking your habits !
        </p>
      </Card>
    );
  } else {
    return (
      <>
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
          <SaveButton missingDays={missingDays as string[]} daysChecked={APP_DAYS_MISS_CHECK} />
        </form>
      </>
    );
  }
}
