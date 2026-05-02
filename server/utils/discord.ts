import { sendDiscordWebhook } from 'send-discord-webhook';

const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL || '';

export const sendDiscordLog = async (
  message: string,
  type: 'INFO' | 'WARNING' | 'ERROR' = 'INFO'
): Promise<void> => {
  if (!discordWebhookUrl) {
    console.warn('[Discord Logger] The Discord Webhook URL is bad configured. No log sent.');
    return;
  }

  let prefix = '';

  switch (type) {
    case 'INFO':
      prefix = '🔵 [INFORMATION]';
      break;
    case 'WARNING':
      prefix = '🟠 [WARNING]';
      break;
    case 'ERROR':
      prefix = '🔴 [ERROR]';
      break;
    default:
      prefix = '[LOG]';
      break;
  }

  const timestamp = new Date().toLocaleString('hu-HU', { timeZone: 'Europe/Budapest' });

  const textContent = `**${prefix}** \`[${timestamp}]\`\n${message}`;

  try {
    await sendDiscordWebhook({
      url: discordWebhookUrl,
      username: 'ranzaGG logger',
      content: textContent
    });

    console.log(`[Discord Logger] Message sent to Discord (${type}).`);
  } catch (discordError: unknown) {
    console.error('[Discord Logger] Error while sending message to Discord:', discordError);
  }
};
