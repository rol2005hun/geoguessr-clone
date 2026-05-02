import mongoose, { Schema, Document } from 'mongoose';

export interface ILocation extends Document {
  imageId: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  continent: string;
  country?: string;
  city?: string;
  createdAt: Date;
}

const LocationSchema = new Schema<ILocation>({
  imageId: { type: String, required: true, unique: true },
  location: {
    type: { type: String, enum: ['Point'], required: true },
    coordinates: { type: [Number], required: true }
  },
  continent: { type: String, required: true, index: true },
  country: { type: String, index: true },
  city: { type: String, index: true },
  createdAt: { type: Date, default: Date.now }
});

LocationSchema.index({ location: '2dsphere' });

export const Location = mongoose.model<ILocation>('Location', LocationSchema);
