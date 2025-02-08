import ky from "ky";

/**
 * send a push notification to discord
 * @param {Object} body - the body of the message
 * @returns {Object} - the response
 */
export const sendDiscordPushNotification = async (body: Record<string, any>) => {
  const discordWebhook = Deno.env.get("DISCORD_WEBHOOK");

  if (!discordWebhook) {
    console.error("No Discord Webhook found");
    return { ok: false };
  }

  return await ky.post(discordWebhook, {
    json: body,
  });
};
