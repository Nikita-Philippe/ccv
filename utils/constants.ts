/** General purpose KV store keys */
export const KV_CONTENT = "ccv_content";
export const KV_CONTENT_PUBLIC = "public_"
export const KV_SINGLE_FIELD = "ccv_single_field";
export const KV_DAILY_ENTRY = "ccv_daily_entry";
export const KV_SETTINGS = "ccv_settings";

/** KV store key for the user. */
export const KV_USER = "ccv_user";
export const KV_USER_SESSION = "ccv_user_session";

export const FIELD_MULTISTRING_DELIMITER = "|||";

/** Number of days before current one to check if the user has missed a day. */
export const APP_DAYS_MISS_CHECK = 12;

export const APP_EXPORT_CSV_DELIMITER = ",";
export const APP_EXPORT_CSV_NOTFOUND = "#N/F";

/** Cookie key to store the current public user */
export const PUBLIC_USER_ID = "ccv_public_user";