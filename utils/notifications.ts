import { ISettings } from "@models/App.ts";
import { CreateNotificationSuccessResponse, NotificationBody } from "@models/onesignalNotification.d.ts";
import ky, { HTTPError } from "ky";
import { Debug } from "./debug.ts";
// import { getSettings, setSettings } from "./settings.ts";

/** Available notification types. */
type NotifType = "push" | "email" | "discord_webhook";

type NotifEvent =
  /** Main event, for daily reminders and habit tracking. */
  | "reminder"
  /** Public test event, for letting the user test the notification system. */
  | "public_test";

// The template object sent for each NotifEvent. It will use the template_id by default. If not set, will fallback on the defined content.
type NotifTemplate = {
  push: Pick<
    NotificationBody,
    | "template_id"
    | "contents"
    | "headings"
    | "subtitle"
    | "ios_attachments"
    | "big_picture"
    | "chrome_web_image"
    | "small_icon"
    | "large_icon"
    | "buttons"
    | "android_channel_id"
    | "priority"
    | "ios_interruption_level"
    | "collapse_id"
    | "data"
    | "url"
  >;
  email: Pick<
    NotificationBody,
    | "template_id"
    | "email_subject"
    | "email_body"
    | "custom_data"
  >;
  discord_webhook: {
    content: string;
    username?: string;
    avatar_url?: string;
    embeds?: Array<{
      title?: string;
      description?: string;
      url?: string;
      color?: number;
      fields?: Array<{ name: string; value: string; inline?: boolean }>;
    }>;
    attachments?: Array<{
      id: string;
      filename: string;
      content_type?: string;
      size?: number;
      url?: string;
      proxy_url?: string;
      height?: number;
      width?: number;
    }>;
  };
};

/** CCV Notification system.
 *
 * This service is used to send notifications via the available channels (push, email, discord webhook).
 *
 * Loosely based on OneSignal API. Requires the OneSignal API keys to send push and email notifications.
 *
 * @example
 * ```ts
 * import { NotificationService } from "./utils/notifications.ts";
 * await NotificationService.sendPush({ event: "reminder", target: "user_id" });
 * await NotificationService.sendEmail({ event: "public_test", target: "user_id" });
 * await NotificationService.sendDiscordWebhook({ event: "reminder", target: "webhook_url" });
 * ```
 */
export class NotificationService {
  private static readonly API_KEY: string | undefined = Deno.env.get("ONESIGNAL_API_KEY");
  private static readonly APP_ID: string | undefined = Deno.env.get("ONESIGNAL_APP_ID");
  private static readonly API_ENDPOINT = "https://api.onesignal.com";

  private static isSSR() {
    return typeof globalThis?.document === "undefined";
  }

  private static isConfigValid() {
    return Boolean(this.API_KEY) && Boolean(this.APP_ID);
  }

  private static check() {
    if (!this.isSSR()) throw new Error("NotificationService cannot be used in client side.");
    if (!this.isConfigValid()) {
      throw new Error("NotificationService is missing API_KEY or APP_ID environment variables.");
    }
  }

  private static getTemplate<T extends NotifType>(type: T, event: NotifEvent): NotifTemplate[T] | null {
    this.check();

    return {
      ...buildTemplate(type, event),
      ...(type === "push" && {
        isIos: false,
        isAndroid: false,
        isHuawei: false,
        isWP_WNS: false,
        isAdm: false,
        isAnyWeb: true,
      }),
    } as NotifTemplate[T] | null;
  }

  private static async send(
    { type, event, target }: {
      type: "push" | "email";
      event: NotifEvent;
      target: string | string[];
    },
  ) {
    this.check();

    if (Debug.get("perf_reminders")) console.time(`onesignal:${type}:${event}`);

    const template = this.getTemplate(type, event);

    if (!template) {
      if (Debug.get("reminders")) console.error(`Not sending push. Did not find any template for "${event}" event.`);
      return;
    }

    try {
      const body: NotificationBody = {
        app_id: this.APP_ID!,
        target_channel: type,
        include_aliases: { "external_id": [target].flat() },
        ...template,
      };

      console.log("Sending to aliases:", body.include_aliases);

      const response = await ky.post(`${this.API_ENDPOINT}/notifications?c=${type}`, {
        headers: { Authorization: this.API_KEY, "Content-Type": "application/json" },
        json: body,
      }).json<CreateNotificationSuccessResponse>();

      if (!response.id) throw new Error("Notification could not be created");

      return response;
    } catch (e) {
      console.error(`${type} error: `, e);
      return;
    } finally {
      if (Debug.get("perf_reminders")) console.timeEnd(`onesignal:${type}:${event}`);
    }
  }

  /** Sends a push notification
   *
   * @param {NotifEvent} event - The event type for the notification.
   * @param {string | string[]} target - The target user ID(s) to send. Must be a valid OneSignal external ID.
   * @returns {Promise<CreateNotificationSuccessResponse | undefined>} - The response from OneSignal API or undefined if failed.
   */
  public static async sendPush({ event, target }: { event: NotifEvent; target: string | string[] }) {
    return await this.send({ type: "push", event, target });
  }

  /** Sends an email notification
   *
   * @param {NotifEvent} event - The event type for the notification.
   * @param {string | string[]} target - The target user ID(s) to send. Must be a valid OneSignal external ID.
   * @returns {Promise<CreateNotificationSuccessResponse | undefined>} - The response from OneSignal API or undefined if failed.
   */
  public static async sendEmail({ event, target }: { event: NotifEvent; target: string | string[] }) {
    return await this.send({ type: "email", event, target });
  }

  /** Sends a Discord webhook notification
   *
   * @param {NotifEvent} event - The event type for the notification.
   * @param {string | string[]} target - The target webhook URL(s) to send
   * @returns {Promise<unknown[]>} - The response from Discord webhook or an array of null if failed.
   */
  public static async sendDiscordWebhook(
    { event, target: defaultTarget }: { event: NotifEvent; target: string | string[] },
  ) {
    if (!this.isSSR()) throw new Error("NotificationService cannot be used in client side.");

    if (Debug.get("perf_reminders")) console.time(`discord_webhook:${event}`);

    const template = this.getTemplate("discord_webhook", event);

    if (!template) {
      if (Debug.get("reminders")) {
        console.error(`Not sending discord wh. Did not find any template for "${event}" event.`);
      }
      return;
    }

    const target = [defaultTarget].flat();
    const responses: unknown[] = [];

    try {
      for (const singleTarget of target) {
        const res = await ky.post(singleTarget, { json: template }).json();
        responses.push(res);
      }
    } catch (error: unknown) {
      console.error("Failed to send Discord push notification:", (error as HTTPError).message);
      responses.push(null);
    }

    if (Debug.get("perf_reminders")) console.timeEnd(`discord_webhook:${event}`);

    return responses;
  }

  /** Checks if the user exists in OneSignal based on the settings.
   *
   * @param {ISettings | null} settings - The user settings containing the OneSignal external ID.
   * @returns {Promise<boolean | undefined>} - Returns true if user exists, false if not, or undefined if no ID is set.
   */
  public static async checkOnesignalUser(settings: ISettings | null): Promise<boolean | undefined> {
    this.check();

    if (!settings?.notifications?.onesignal_id) return;

    const userExists = await ky.get(
      `${this.API_ENDPOINT}/apps/${this.APP_ID}/users/by/external_id/${settings?.notifications.onesignal_id}`,
      {
        headers: { Authorization: this.API_KEY },
      },
    ).json<{ id: string } | null>().catch(() => {
      return null;
    });

    return !!userExists;
  }
}

/** Builds the notification template based on the type and event.
 * 
 * @param {T} type - The notification type (push, email, discord_webhook).
 * @param {NotifEvent} event - The event type for the notification.
 * @returns {NotifTemplate[T] | null} - The notification template or null if not found.
 */
const buildTemplate = <T extends NotifType>(type: T, event: NotifEvent): NotifTemplate[T] | null => {
  // One signal template are defined in the environment variable ONESIGNAL_TEMPLATES, like:
  // ONESIGNAL_TEMPLATES=push:reminder:template_id,push:public_test:template_id
  const templates = (Deno.env.get("ONESIGNAL_TEMPLATES") ?? "").split(",").map((t) => t.split(":")).map((
    [t, e, i],
  ) => ({ type: t, event: e, id: i }));

  const currentTemplate = templates.find((t) => t.type === type && t.event === event);

  const template_id = currentTemplate?.id ? { template_id: currentTemplate?.id } : {};

  switch (type) {
    case "push": {
      if (template_id?.template_id) return template_id as NotifTemplate[T];
      if (event === "reminder") {
        return {
          contents: {
            en: "You did not filled yet your yesterday's habits... Log in to CCV to track your routine now !",
            fr:
              "Vous n'avez pas encore rempli vos habitudes d'hier... Connectez-vous à CCV pour suivre votre routine maintenant !",
          },
          headings: { en: "CCV reminder⏰", fr: "Rappel CCV⏰" },
        } as NotifTemplate[T];
      }
      if (event === "public_test") {
        return {
          contents: {
            en: "You can now receive notifications from CCV !",
            fr: "Vous pouvez maintenant recevoir des notifications de CCV !",
          },
          headings: { en: "Welcome to CCV !", fr: "Bienvenue sur CCV !" },
        } as NotifTemplate[T];
      }
      return null;
    }
    case "email": {
      if (event === "reminder") {
        return {
          ...template_id,
          email_subject: "CCV Reminder",
          ...(!template_id?.template_id &&
            {
              email_body:
                "You did not filled yet your yesterday's habits... Log in to <a href='https://ccv.nikit.app/app'>CCV</a> to track your routine now !",
            }),
          custom_data: {
            app_url: "https://ccv.nikit.app/app",
            settings_url: "https://ccv.nikit.app/settings",
            home_url: "https://ccv.nikit.app",
          },
        } as NotifTemplate[T];
      }
      return null;
    }
    case "discord_webhook": {
      if (event === "reminder") {
        return {
          username: "CCV Reminder Bot",
          embeds: [
            {
              title: "CCV Reminder",
              description: "You did not filled yet your yesterday's habits... Log in to CCV to track your routine now !",
              color: 0xff0000,
            },
          ],
        } as NotifTemplate[T];
      }
      if (event === "public_test") {
        return {
          username: "CCV Welcome Bot",
          embeds: [
            {
              title: "Welcome to CCV!",
              description: "You can now receive notifications from CCV !",
              color: 0x00ff00,
            },
          ],
        } as NotifTemplate[T];
      }
      return null;
    }
    default:
      return null;
  }
};
