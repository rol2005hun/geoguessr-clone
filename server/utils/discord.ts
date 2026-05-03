const discordWebhookUrl: string = process.env.DISCORD_WEBHOOK_URL || "";

export type LogLevel = "INFO" | "WARNING" | "ERROR";

export interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  timestamp?: string;
  fields?: DiscordEmbedField[];
}

export interface DiscordWebhookPayload {
  username?: string;
  embeds?: DiscordEmbed[];
}

export const sendDiscordLog = async (
  message: string,
  type: LogLevel = "INFO",
  context?: Record<string, string | number | boolean>
): Promise<void> => {
  if (!discordWebhookUrl) {
    console.warn("[Discord Logger] The Discord Webhook URL is bad configured. No log sent.");
    return;
  }

  const colors: Record<LogLevel, number> = {
    ERROR: 16711680,
    WARNING: 16753920,
    INFO: 34952
  };

  const fields: DiscordEmbedField[] = [];

  if (context) {
    for (const key of Object.keys(context)) {
      fields.push({
        name: key,
        value: String(context[key]),
        inline: true
      });
    }
  }

  const payload: DiscordWebhookPayload = {
    username: "ranzaGG logger",
    embeds: [
      {
        title: type,
        description: message,
        color: colors[type],
        timestamp: new Date().toISOString(),
        fields: fields.length > 0 ? fields : undefined
      }
    ]
  };

  try {
    await $fetch<void>(discordWebhookUrl, {
      method: "POST",
      body: payload
    });

    console.log(`[Discord Logger] Message sent to Discord (${type}).`);
  } catch (discordError: unknown) {
    console.error("[Discord Logger] Error while sending message to Discord:", discordError);
  }
};