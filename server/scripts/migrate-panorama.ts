import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Location } from '../models/Location';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';

const migrate = async (): Promise<void> => {
  if (!MONGODB_URI) {
    console.error('MONGODB_URI is missing from .env!');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB.');

    const result = await Location.updateMany(
      { isPanorama: { $exists: false } },
      { $set: { isPanorama: true } }
    );

    console.log(`Updated ${result.modifiedCount} existing locations with isPanorama: true`);
    console.log('Migration complete.');
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
};

migrate();
