import ky from "ky";

/**
 * send a push notification to discord
 * @param {Object} body - the body of the message
 * @param {string} discordWebhook - the discord webhook url
 * @returns {Object} - the response
 */
export const sendDiscordPushNotification = async (body: Record<string, any>, discordWebhook: string) => {
  return await ky.post(discordWebhook, {
    json: body,
  });
};
