import { Handlers } from "$fresh/server.ts";
import { openKvToolbox } from "@kitsonk/kv-toolbox";
import { isSuperAdmin } from "@utils/user/index.ts";

export const handler: Handlers = {
  async GET(req) {
    if (!await isSuperAdmin(req)) return new Response(null, { status: 403 });

    const kv = await openKvToolbox({ path: globalThis.ccv_config.kv?.basePath });
    return kv.export({ prefix: [] }, {
      type: "response",
      filename: `ccv-backup-${new Date().toISOString()}.ndjson`,
      close: true,
    });
  },
};
