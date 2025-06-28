import ky, { HTTPError } from "ky";

/**
 * send a push notification to discord
 * @param {Object} body - the body of the message
 * @param {string} discordWebhook - the discord webhook url
 * @returns {Object} - the response
 */
export const sendDiscordPushNotification = async (body: Record<string, any>, discordWebhook: string) => {
  try {
    return await ky.post(discordWebhook, {
      json: body,
    });
  } catch (error: unknown) {
    // Do not throw, to make enqueue believe that the message was sent, to avoid retrying it
    console.error("Failed to send Discord push notification:", (error as HTTPError).message);
    return null;
  }
};
