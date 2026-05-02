import mongoose from 'mongoose';

export default defineNitroPlugin(async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('MONGODB_URI is missing from .env');
    return;
  }

  try {
    await mongoose.connect(uri);
    console.log('MongoDB connected successfully in Nuxt backend');
  } catch (error) {
    console.error('MongoDB connection failed:', error);
  }
});
