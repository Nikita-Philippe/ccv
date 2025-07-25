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
  message?: string;
}
