import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Location } from '../models/Location';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';

interface NominatimResponse {
  address?: {
    country?: string;
    city?: string;
    town?: string;
    village?: string;
    hamlet?: string;
    municipality?: string;
    county?: string;
    state?: string;
  };
}

const getAddressInfo = async (
  lat: number,
  lng: number
): Promise<{ country: string; city: string }> => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&accept-language=en`,
      { headers: { 'User-Agent': 'GeoGuesserGameBot/1.0 (FixScript)' } }
    );

    if (!res.ok) return { country: 'Unknown', city: 'Unknown' };

    const data = (await res.json()) as NominatimResponse;
    const address = data.address;
    return {
      country: address?.country || 'Unknown',
      city:
        address?.city ||
        address?.town ||
        address?.village ||
        address?.hamlet ||
        address?.municipality ||
        address?.county ||
        address?.state ||
        'Unknown'
    };
  } catch {
    return { country: 'Unknown', city: 'Unknown' };
  }
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const start = async () => {
  if (!MONGODB_URI) {
    console.error('MONGODB_URI is missing from .env');
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB.');

    const unknownLocations = await Location.find({
      $or: [
        { city: 'Unknown' },
        { country: { $regex: /[^\x00-\x7F]/ } },
        { city: { $regex: /[^\x00-\x7F]/ } }
      ]
    });
    console.log(`Found ${unknownLocations.length} locations to fix (Unknown or non-English).`);

    let fixedCount = 0;

    for (let i = 0; i < unknownLocations.length; i++) {
    const loc = unknownLocations[i];
    console.log(`[${i + 1}/${unknownLocations.length}] Processing imageId: ${loc.imageId}...`);

    const oldCountry = loc.country;
    const oldCity = loc.city;

    const [lng, lat] = loc.location.coordinates;
    const geoInfo = await getAddressInfo(lat, lng);

    if (geoInfo.city !== 'Unknown') {
      loc.country = geoInfo.country;
      loc.city = geoInfo.city;
      await loc.save();

      console.log(
        `  -> Fixed! Country: "${oldCountry}" → "${geoInfo.country}", City: "${oldCity}" → "${geoInfo.city}"`
      );

      fixedCount++;
    } else {
      console.log(`  -> Still Unknown. (Was: ${oldCountry}, ${oldCity})`);
    }

    await delay(1200);
  }

    console.log(`\nFinished! Fixed ${fixedCount} out of ${unknownLocations.length} unknown locations.`);
  } catch (err) {
    console.error('An error occurred:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
};

start();
