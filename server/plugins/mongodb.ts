import mongoose from 'mongoose';
import { sendDiscordLog } from '../utils/discord';

export default defineNitroPlugin(async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('MONGODB_URI is missing from .env');
    return;
  }

  try {
    await mongoose.connect(uri);
    console.log('MongoDB connected successfully in Nuxt backend');
    await sendDiscordLog('MongoDB connected successfully in Nuxt backend', 'INFO');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('MongoDB connection failed:', error);
    await sendDiscordLog(`MongoDB connection failed: ${errorMessage}`, 'ERROR');
  }
});
