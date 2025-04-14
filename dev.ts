#!/usr/bin/env -S deno run -A --watch=static/,routes/

import dev from "$fresh/dev.ts";
import config from "./fresh.config.ts";

import "@std/dotenv/load";

if (!Deno.args.includes("build")) {
  // Run cron jobs
  const cron = await import("./cron.ts");
  await cron.default();

  // Run queues listener
  const queuesListener = await import("./queuesListener.ts");
  await queuesListener.default();
}

import autoprefixer from "autoprefixer";
import postcss from "postcss";
import tailwindcss from "@tailwindcss/postcss";

const css = Deno.readTextFileSync("./static/app.css");
const out = await postcss([tailwindcss, autoprefixer]).process(css, {
  from: "./static/app.css",
});
Deno.writeTextFileSync("./static/styles.css", out.css);

await dev(import.meta.url, "./main.ts", config);
