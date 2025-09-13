/** Key prefix to store user data under [ccv_user, uKey, ...] */
export const KV_CONTENT = "content";
export const KV_DAILY_ENTRY = "entry";
export const KV_STATS = "statistics";

/** Key to store users settings. Outside of user data as it needs to be read without user context */
export const KV_SETTINGS = "ccv_settings";

export const FIELD_MULTISTRING_DELIMITER = "|||";

/** Number of days before current one to check if the user has missed a day. */
export const APP_DAYS_MISS_CHECK = 7;

export const APP_EXPORT_CSV_DELIMITER = ",";
export const APP_EXPORT_CSV_NOTFOUND = "#N/F";

/** Cookie key to store the current public user */
export const PUBLIC_USER_COOKIE = "ccv_public_user";

/** Cookie to save the onesignal external id */
export const ONESIGNAL_EXTERNAL_ID = "ccv_onesignal_id";