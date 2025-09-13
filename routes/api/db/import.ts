import { Handlers } from "$fresh/server.ts";
import { openKvToolbox } from "@kitsonk/kv-toolbox";
import { isSuperAdmin } from "@utils/user/index.ts";

export const handler: Handlers = {
  async POST(req) {
    if (!await isSuperAdmin(req)) return new Response(null, { status: 403 });

    const form = await req.formData();

    const currentUrl = new URL(req.url);
    const toAdmin = (params: Record<string, string>) => {
      const adminUrl = new URL("/app/admin", `${currentUrl.protocol}//${currentUrl.host}`);
      for (const [k, v] of Object.entries(params)) adminUrl.searchParams.set(k, v);
      return Response.redirect(adminUrl.toString(), 303);
    };

    const file = form.get("file") as File | null;
    if (!file) {
      return toAdmin({ import: "error", message: "No file provided" });
    }

    if (file.type !== "application/x-ndjson" && !file.name.endsWith(".ndjson")) {
      return toAdmin({ import: "error", message: "Invalid file type" });
    }

    const overwrite = form.get("overwrite") === "on";

    const kv = await openKvToolbox({ path: globalThis.ccv_config.kv?.basePath });
    const res = await kv.import(file.stream(), { overwrite });

    return toAdmin({
      import: "ok",
      count: String(res.count ?? 0),
      skipped: String(res.skipped ?? 0),
      errors: String(res.errors ?? 0),
      overwrite: overwrite ? "true" : "false",
    });
  },
};
