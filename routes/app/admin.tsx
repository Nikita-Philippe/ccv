import Card from "@components/UI/Card.tsx";
import UserTable from "@islands/Admin/UserTable.tsx";
import LongPressButton from "@islands/UI/LongPressButton.tsx";
import { requestTransaction } from "@utils/database.ts";
import { isSuperAdmin } from "@utils/user.ts";

export default async function Admin(req: Request) {
  // Only "super" admin user has access to this page
  if (!await isSuperAdmin(req)) return Response.redirect(req.url.replace("/app/admin", "/app"), 303);

  const data = await requestTransaction(req, { action: "getSAdminStats" });

  if (!data) return <div>No users</div>;

  const url = new URL(req.url);
  const importStatus = url.searchParams.get("import");
  const msg = url.searchParams.get("message");
  const count = url.searchParams.get("count");
  const skipped = url.searchParams.get("skipped");
  const errors = url.searchParams.get("errors");

  return (
    <>
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
    </>
  );
}
