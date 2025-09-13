import { Handlers } from "$fresh/server.ts";
import { EConfigCardType, IDailyEntry } from "@models/Content.ts";
import { getDailyEntryKey } from "@utils/common.ts";
import { getContent } from "@utils/content.ts";
import { getEntry, saveEntries } from "@utils/entries.ts";
import { getUserBySession } from "@utils/user/auth.ts";
import { normalizeString } from "jsr:@iharuya/string";
import { parse } from "jsr:@std/csv";
import { DateTime } from "luxon";

type TImportResponse = {
  message?: string[];
};

const normalizeStr = (str: string) => {
  return normalizeString(str).toLowerCase();
};

function parseMultiString(value: string): string[] {
  try {
    // Clean up escaped quotes from CSV
    const cleanValue = value; //.replace(/^\"|\"$/g, "") // Remove enclosing quotes
    //.replace(/""/g, '"'); // Convert double quotes to single

    // Parse as JSON if it looks like an array
    if (cleanValue.startsWith("[") && cleanValue.endsWith("]")) {
      return JSON.parse(cleanValue);
    }

    // Otherwise return as a single-item array
    return [value.trim()];
  } catch (e) {
    console.warn("Failed to parse multistring:", {
      value,
      cleanedValue: value.replace(/^\"|\"$/g, "").replace(/""/g, '"'),
    });
    return [];
  }
}

function parseContent(value: string, type: EConfigCardType.boolean): boolean;
function parseContent(value: string, type: EConfigCardType.int): number;
function parseContent(value: string, type: EConfigCardType.string): string;
function parseContent(value: string, type: EConfigCardType.textarea): string;
function parseContent(value: string, type: EConfigCardType.multistring): string[];
function parseContent(value: string, type: EConfigCardType) {
  switch (type) {
    case EConfigCardType.boolean:
      if (value === "TRUE") return true;
      return false;
    case EConfigCardType.int:
      if (!isNaN(parseInt(value))) return parseInt(value);
      return 0;
    case EConfigCardType.string:
    case EConfigCardType.textarea:
      if (
        value.toLowerCase() === "null" ||
        value.toLowerCase() === "undefined" || value.toLowerCase() === "none" ||
        value.toLowerCase() === "false" || value.toLowerCase() === "0"
      ) {
        return "";
      }
      return value;
    case EConfigCardType.multistring:
      return parseMultiString(value);
  }
}

export const handler: Handlers<TImportResponse> = {
  async POST(req) {
    try {
      const user = await getUserBySession(req, true);
      if (!user || !user.isAuthenticated) {
        return new Response(
          JSON.stringify({ message: [] }),
          { status: 401 },
        );
      }

      // Parse the form data
      const formData = await req.formData();
      const file = formData.get("file");
      console.log("Formdata overwrite_existing", formData.get("overwrite_existing"));
      const overwriteExisting = formData.get("overwrite_existing") === "true";

      if (!file || !(file instanceof File)) {
        return new Response(
          JSON.stringify({ message: ["Missing parameters"] }),
          { status: 400 },
        );
      }
      if (file.type !== "text/csv") {
        return new Response(
          JSON.stringify({ message: ["Only CSV files are supported. Please provide a correct filetype."] }),
          { status: 400 },
        );
      }
      if (file.size > 5 * 1024 * 1024) {
        return new Response(
          JSON.stringify({ message: ["File is too big. Please provide a file less than 5Mb."] }),
          { status: 400 },
        );
      }

      const userContent = await getContent(user);
      if (!userContent) {
        return new Response(
          JSON.stringify({
            message: [
              "You do not have any content to match the import.",
              "Please create a matching configuration on the config page.",
            ],
          }),
          { status: 400 },
        );
      }

      // Parse file
      const rawContent = await file.text();
      const parsedContent = parse(rawContent) as string[][];
      const columns = parsedContent[0];

      if (normalizeStr(columns[0]) !== "at") {
        return new Response(
          JSON.stringify({
            message: [
              "First CSV header cell must be set to 'at', and each columns should the row entry date in format YYYY-MM-DD",
            ],
          }),
          { status: 400 },
        );
      }

      // Map columns name to the normalized content keys. Remove first header 'at'.
      const keysMap = columns.slice(1).map((rawCol, i) => {
        const col = normalizeStr(rawCol);
        const correspondingKey = userContent.fields.find((f) => col === normalizeStr(f.name))?.name;
        return { index: i + 1, importKey: rawCol, contentKey: correspondingKey };
      });

      if (keysMap.some((k) => !k.contentKey)) {
        return new Response(
          JSON.stringify({
            message: [
              "You have keys in your imported file that are not matching you config.",
              "Please check your config for fields matching your imported file and data types.",
              "Missing field name(s):",
              ...(keysMap.filter((k) => !k.contentKey).map((k) => `- ${k.importKey}`)),
            ],
          }),
          { status: 400 },
        );
      }

      // Keep track of errors, when parsing did not worked, or some other issues.
      const processRes: string[] = [];

      // Format all the rows to match the IDailyEntry format.
      const formattedRows: IDailyEntry[] = parsedContent.slice(1).map((row) => {
        const at = getDailyEntryKey(DateTime.fromISO(row[0]));
        const entries = keysMap.map((key) => {
          const matchingField = userContent.fields.find((f) => f.name === key.contentKey);
          if (!matchingField) {
            processRes.push(`Key ${key.contentKey} not found in content fields at ${at}`);
            return null;
          }
          const value = parseContent(row[key.index], matchingField.type as Parameters<typeof parseContent>[1]);
          return { name: matchingField.name, value };
        }).filter(Boolean) as IDailyEntry["entries"];
        return { at, content: userContent.id, entries };
      });

      for (const entry of formattedRows) {
        try {
          if (!overwriteExisting) {
            const existing = await getEntry(user, entry.at);
            if (existing) {
              processRes.push(`Entry already exists at ${entry.at}. Use overwrite option to replace it.`);
              continue;
            }
          }

          await saveEntries(user, { contentId: entry.content, entries: entry.entries, at: entry.at });
        } catch (e) {
          console.error(`Error saving entry ${entry.at}:`, e);
          processRes.push(`Error saving entry ${entry.at}`);
        }
      }

      if (processRes.length > 0) console.warn("Res during processing:", processRes);
      processRes.push(`Finished processing ${formattedRows.length} entries.`);

      return new Response(JSON.stringify({ message: processRes }));
    } catch (error) {
      console.error("Error parsing form data:", error);
      return new Response(
        JSON.stringify({ message: ["Failed to parse form data"] }),
        { status: 400 },
      );
    }
  },
};
