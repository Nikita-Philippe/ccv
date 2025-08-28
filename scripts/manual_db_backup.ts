import { backupDB } from "@utils/backup.ts";

backupDB().then(console.log).catch(console.error);
