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
  }[],
  db: {
    path?: string;
  },
  config: IAppConfig
}

/** The main CCV settings, which are defined in the ccv.json file at app root. */
export interface IAppConfig {
  /** Configure emails that have a "admin" access to the app. Used to manage user, database, and more. */
  admin_email?: [string],
}