import { Handlers, RouteContext } from "$fresh/server.ts";
import Card from "@components/UI/Card.tsx";
import UserTable from "@islands/Admin/UserTable.tsx";
import LongPressButton from "@islands/UI/LongPressButton.tsx";
import { IDefaultPageHandler } from "@models/App.ts";
import { getSAdminStats } from "@utils/admin.ts";
import { DEKsLabelMap, DEKsMap } from "@utils/crypto/constants.ts";
import { rotateDEK } from "@utils/crypto/rotate.ts";
import { isSuperAdmin } from "@utils/user/index.ts";

type PageData = IDefaultPageHandler & { keys?: Awaited<ReturnType<typeof rotateDEK>> | string };

export const handler: Handlers<PageData> = {
  async POST(req, ctx) {
    if (!await isSuperAdmin(req)) return Response.redirect(req.url.replace("/app/admin", "/app"), 303);

    const form = await req.formData();

    const { action, ...rest } = Object.fromEntries(form.entries());

    switch (action) {
      case "rotate_deks": {
        const keys = Object.entries(rest).map(([k, v]) => (k.startsWith("rk_") && v === "on") ? k.slice(3) : null)
          .filter(Boolean) as typeof DEKsMap;

        if (!keys.length) return await ctx.render();

        const res = await rotateDEK(keys);

        return await ctx.render({ keys: res });
      }
      case "rotate_signKey": {
        const { rotateSignKey } = await import("@utils/crypto/rotate.ts");
        const newSignKey = await rotateSignKey();
        return await ctx.render({ keys: `New signing key: ${newSignKey}` });
      }
      case "rotate_kek": {
        const { rotateKEK } = await import("@utils/crypto/rotate.ts");
        const res = await rotateKEK();
        return await ctx.render({ keys: `New KEK: ${res}` });
      }
    }

    console.log({ action, rest });

    // Only "super" admin user has access to this page

    return await ctx.render();
  },
};

export default async function Admin(req: Request, { data: ctxData }: RouteContext<PageData>) {
  // Only "super" admin user has access to this page
  if (!await isSuperAdmin(req)) return Response.redirect(req.url.replace("/app/admin", "/app"), 303);

  const data = await getSAdminStats();

  if (!data) return <div>No users</div>;

  const url = new URL(req.url);
  const importStatus = url.searchParams.get("import");
  const msg = url.searchParams.get("message");
  const count = url.searchParams.get("count");
  const skipped = url.searchParams.get("skipped");
  const errors = url.searchParams.get("errors");

  return (
    <>
      {ctxData?.keys && (
        <div class="alert alert-error mb-4 flex flex-col gap-4">
          <h1 class="text-2xl font-bold mb-2">New encryption keys</h1>
          <p>
            <strong>If you rotated the KEK, make sure to update your environment variables with the new key.</strong>
          </p>
          <Card title="New keys" sx={{ container: "w-full", content: "flex-col" }}>
            {typeof ctxData.keys === "string"
              ? <pre class="break-words">{ctxData.keys}</pre>
              : (
                <ul class="list-disc list-inside">
                  {ctxData.keys.map(({ k, v }) => <li key={k}>{k}: {v}</li>)}
                </ul>
              )}
          </Card>
        </div>
      )}

      <UserTable users={data.users} />
      <Card title="Database" sx={{ content: "flex-col" }}>
        <h2 class=" font-bold">Export database</h2>
        <div class="flex gap-4">
          <p>Custom path:</p>
          <pre>{data.db.path ?? "none"}</pre>
        </div>
        <button type="button" className="btn btn-secondary">
          <a href={`/api/db/export`}>Download DB (ndjson)</a>
        </button>
        <div class="divider" />
        <h2 class="font-bold">Import a database</h2>
        <form
          method="POST"
          action="/api/db/import"
          encType="multipart/form-data"
          id="import_db_form"
          class="flex flex-col gap-4"
        >
          <div class="alert alert-error alert-soft flex flex-col gap-2">
            <p>Please create a backup of your database before importing a new one, as this action is irreversible.</p>
            <p>Imported database should have the same KEK as the current one, otherwise data will be unviewable.</p>
            <p>Importing a database will not delete any existing keys unless you check the "overwrite" box below.</p>
          </div>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">Import a DB file</legend>
            <input
              type="file"
              name="file"
              accept=".ndjson,application/x-ndjson"
              class="file-input file-input-bordered"
            />
            <label class="label">accepts .ndjson</label>
          </fieldset>
          <fieldset className="fieldset">
            <label className="label">
              <input type="checkbox" className="checkbox" name="overwrite" />
              Overwrite existing keys
            </label>
          </fieldset>
          <LongPressButton
            className="btn-error w-fit whitespace-nowrap"
            pressDuration={2000}
            formId="import_db_form"
          >
            <span>Import DB</span>
          </LongPressButton>
        </form>
        {importStatus && (
          <div className={`alert ${importStatus === "ok" ? "alert-success" : "alert-error"} alert-soft`}>
            {importStatus === "ok"
              ? <p>Import done. Count: {count}, Skipped: {skipped}, Errors: {errors}.</p>
              : <p>Import failed{msg ? `: ${msg}` : "."}</p>}
          </div>
        )}
      </Card>
      <Card title="App configuration" sx={{ content: "flex-col" }}>
        <pre>{JSON.stringify(data.config, null, 2)}</pre>
      </Card>
      <Card title="Encryption keys" sx={{ content: "flex-col" }}>
        <p>
          Here you can rotate the app encryption keys. You can do this perdiodically as a security measure, or if you
          suspect your keys have been compromised.
        </p>
        <div class="alert alert-error alert-soft flex flex-col gap-2">
          <p>Please create a backup of your database before rotating anything to prevent any data loss.</p>
          <p>
            After rotation, the new keys will automatically be set on the app. They will be displayed once for
            reference.
          </p>
        </div>
        <Card title="DEKs">
          <form
            id="rotate_deks"
            method="POST"
            class="flex gap-4"
          >
            <input type="hidden" name="action" value="rotate_deks" />
            <fieldset className="fieldset flex">
              {DEKsMap.map((dek) => (
                <label className="label">
                  <input type="checkbox" defaultChecked className="checkbox" name={`rk_${dek}`} />
                  {DEKsLabelMap[dek] || dek}
                </label>
              ))}
            </fieldset>
            <LongPressButton
              className="btn-error w-fit whitespace-nowrap"
              pressDuration={2000}
              formId="rotate_deks"
            >
              <span>Rotate selected</span>
            </LongPressButton>
          </form>
        </Card>
        <Card title="Signing key">
          <div class="alert alert-error alert-soft flex flex-col gap-2">
            <p>
              Rotating this key will invalidate all current user sessions and delete ALL currently active public users.
            </p>
          </div>
          <form
            id="rotate_signKey"
            method="POST"
            class="flex gap-4"
          >
            <input type="hidden" name="action" value="rotate_signKey" />
            <LongPressButton
              className="btn-error w-fit whitespace-nowrap"
              pressDuration={2000}
              formId="rotate_signKey"
            >
              <span>Rotate signing key</span>
            </LongPressButton>
          </form>
        </Card>
        <Card title="KEK">
          <div class="alert alert-error alert-soft flex flex-col gap-2">
            <p>
              After rotation, the new keys will be displayed here. You'll need to manually set it in your env variables
              as the "CRYPTO_KEK".
            </p>
            <strong>
              This key will not be saved or shown anywhere else, so make sure to replace it immediately.
            </strong>
            <p>Make sure to store them securely, as you'll need them to access your data.</p>
          </div>
          <form
            id="rotate_kek"
            method="POST"
            class="flex gap-4"
          >
            <input type="hidden" name="action" value="rotate_kek" />
            <LongPressButton
              className="btn-error w-fit whitespace-nowrap"
              pressDuration={5000}
              formId="rotate_kek"
            >
              <span>Rotate KEK</span>
            </LongPressButton>
          </form>
        </Card>
      </Card>
    </>
  );
}
