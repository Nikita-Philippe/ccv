// Settings entry for a user
export interface ISettings {
  notifications?: INotifications;
}

// Notification object of a user
export interface INotifications {
  start?: string;
  end?: string;
  discord_webhook?: string;
}

/** App-global page handler response */
export interface IDefaultPageHandler {
  // Message displayed in a toast
  message?: string;
}
