import { DebugFlag } from "@utils/debug.ts";
import { NotifEvent, NotifType } from "@utils/notifications.ts";

// Settings entry for a user
export interface ISettings {
  notifications?: INotifications;
}

// Notification object of a user
export interface INotifications {
  start?: string;
  end?: string;
  discord_webhook?: string;

  // onesignal-specific settings
  /** The onesignal "externalId" of the user. Is usually email or username. */
  onesignal_id?: string;
  /** Whether the user has opted in to push notifications */
  push?: boolean;
  /** The email address for email notifications. If not set, email notifications are disabled. */
  email?: string;
}

/** App-global page handler response */
export interface IDefaultPageHandler {
  // Message displayed in a toast
  message?: { type: "info" | "success" | "warning" | "error"; message: string };
}

/** Stats displayed on the super-admin page */
export interface IAdminUserStat {
  users: {
    user: string;
    content: string[];
    entries: string[];
  }[];
  config: IAppConfig;
}

/** The main CCV settings, which are defined in the ccv.json file at app root.
 *
 * These settings will be available under the `globalThis.ccv_config` on the server.
 */
export interface IAppConfig {
  server?: {
    /** Debug flags */
    debug?: Array<keyof typeof DebugFlag>;
  };
  kv?: {
    /** Path of the KV store. Should be set, except for Deno deploy. */
    basePath?: string;
  };
  /** Custom crypto configurations for generating keys. */
  crypto?: {
    derive_salt?: string;
    derive_iterations?: number;
  };
  reminders: {
    /** Delay for reminder check (in minutes). A lower value will check more often. */
    delay?: number;
    /** The OneSignal templates used for the type and event. */
    templates?: { type: NotifType; event: NotifEvent; id: string }[];
  };
  admin: {
    /** Configure emails that have a "admin" access to the app. Used to manage user, database, and more. */
    emails?: string[];
  };
}
