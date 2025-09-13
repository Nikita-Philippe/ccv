import { openKvToolbox } from "@kitsonk/kv-toolbox";
import { Storage } from "@google-cloud/storage";
import { Buffer } from "node:buffer";

function getStorageFromEnv() {
  const saJson = Deno.env.get("GCP_SA_KEY_JSON");
  if (!saJson) throw new Error("GCP_SA_KEY_JSON is not set");
  const sa = JSON.parse(saJson) as {
    project_id: string;
    client_email: string;
    private_key: string;
  };
  return new Storage({
    projectId: sa.project_id,
    credentials: {
      client_email: sa.client_email,
      private_key: sa.private_key,
    },
  });
}

function normPrefix(p = "ccv/daily/") {
  return p.replace(/^\/+|\/+$/g, "") + "/";
}

async function exportNdjson(): Promise<Uint8Array> {
  const kv = await openKvToolbox({ path: globalThis.ccv_config.kv?.basePath });
  const resp = await kv.export({ prefix: [] }, {
    type: "response",
    filename: "backup.ndjson",
    close: false,
  }) as Response;
  const ab = await resp.arrayBuffer();
  await kv.close();
  return new Uint8Array(ab);
}

async function uploadToGcs(objectName: string, data: Uint8Array) {
  const bucketName = Deno.env.get("GCS_BUCKET")!;
  const storage = getStorageFromEnv();
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(objectName);
  await file.save(Buffer.from(data), {
    resumable: false, // small files; simpler
    contentType: "application/x-ndjson",
    metadata: { cacheControl: "no-store" },
  });
}

async function pruneBackups(prefix: string, keep = 30) {
  const bucketName = Deno.env.get("GCS_BUCKET")!;
  const storage = getStorageFromEnv();
  const [files] = await storage.bucket(bucketName).getFiles({ prefix, autoPaginate: true });
  files.sort((a, b) => a.name.localeCompare(b.name));
  const excess = Math.max(0, files.length - keep);
  for (let i = 0; i < excess; i++) {
    try {
      await files[i]?.delete();
    } catch (e) {
      console.warn("Failed to delete old backup:", files[i]?.name, e);
    }
  }
}

export const backupDB = async () => {
  const bucket = Deno.env.get("GCS_BUCKET");
  if (!bucket) return console.error("Backup skipped: GCS_BUCKET not set");
  if (!Deno.env.get("GCP_SA_KEY_JSON")) return console.error("Backup skipped: GCP_SA_KEY_JSON not set");

  const prefix = normPrefix(Deno.env.get("GCS_PREFIX") ?? "ccv/daily/");
  const ts = new Date().toISOString().replace(/[:.]/g, "_");
  const objectName = `${prefix}ccv-backup-${ts}.ndjson`;

  try {
    const data = await exportNdjson();
    await uploadToGcs(objectName, data);
    await pruneBackups(prefix, 30);
    console.log("Backup uploaded:", objectName);
  } catch (e) {
    console.error("Backup cron failed:", e);
  }
};
