// DO NOT EDIT. This file is generated by Fresh.
// This file SHOULD be checked into source version control.
// This file is automatically updated during development when running `dev.ts`.

import * as $_404 from "./routes/_404.tsx";
import * as $_app from "./routes/_app.tsx";
import * as $_layout from "./routes/_layout.tsx";
import * as $api_config_id_ from "./routes/api/config/[[id]].tsx";
import * as $config from "./routes/config.tsx";
import * as $index from "./routes/index.tsx";
import * as $Config_card from "./islands/Config/card.tsx";
import * as $Config_index from "./islands/Config/index.tsx";
import * as $Field_String from "./islands/Field/String.tsx";
import * as $Field_index from "./islands/Field/index.tsx";
import type { Manifest } from "$fresh/server.ts";

const manifest = {
  routes: {
    "./routes/_404.tsx": $_404,
    "./routes/_app.tsx": $_app,
    "./routes/_layout.tsx": $_layout,
    "./routes/api/config/[[id]].tsx": $api_config_id_,
    "./routes/config.tsx": $config,
    "./routes/index.tsx": $index,
  },
  islands: {
    "./islands/Config/card.tsx": $Config_card,
    "./islands/Config/index.tsx": $Config_index,
    "./islands/Field/String.tsx": $Field_String,
    "./islands/Field/index.tsx": $Field_index,
  },
  baseUrl: import.meta.url,
} satisfies Manifest;

export default manifest;
