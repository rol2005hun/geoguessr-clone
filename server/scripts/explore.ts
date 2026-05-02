import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Location } from '../models/Location';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';
const MAPILLARY_TOKEN = process.env.MAPILLARY_CLIENT_TOKEN || '';

const regions = [
  { name: 'Europe', minLng: -10, minLat: 35, maxLng: 30, maxLat: 60 },
  { name: 'North America', minLng: -125, minLat: 25, maxLng: -70, maxLat: 50 },
  { name: 'South America', minLng: -80, minLat: -55, maxLng: -35, maxLat: 10 },
  { name: 'Africa', minLng: -15, minLat: -35, maxLng: 50, maxLat: 35 },
  { name: 'Asia', minLng: 60, minLat: 5, maxLng: 145, maxLat: 55 },
  { name: 'Oceania', minLng: 110, minLat: -45, maxLng: 180, maxLat: -10 }
];

const getAddressInfo = async (lat: number, lng: number) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`,
      { headers: { 'User-Agent': 'GeoGuesserGameBot/1.0' } }
    );

    if (!res.ok) return { country: 'Unknown', city: 'Unknown' };

    const data: any = await res.json();
    return {
      country: data.address?.country || 'Unknown',
      city: data.address?.city || data.address?.town || data.address?.village || 'Unknown'
    };
  } catch {
    return { country: 'Unknown', city: 'Unknown' };
  }
};

const fetchImages = async (): Promise<void> => {
  const selectedRegion = regions[Math.floor(Math.random() * regions.length)]!;

  const width = 0.05;
  const height = 0.05;
  const lng =
    selectedRegion.minLng + Math.random() * (selectedRegion.maxLng - selectedRegion.minLng - width);
  const lat =
    selectedRegion.minLat +
    Math.random() * (selectedRegion.maxLat - selectedRegion.minLat - height);
  const bbox = `${lng},${lat},${lng + width},${lat + height}`;

  const url = `https://graph.mapillary.com/images?fields=id,geometry&is_pano=true&limit=15&bbox=${bbox}`;

  try {
    const response = await fetch(url, { headers: { Authorization: `OAuth ${MAPILLARY_TOKEN}` } });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`[API ERROR] Mapillary responded with ${response.status}: ${errorData}`);
      return;
    }

    const result: any = await response.json();

    if (result.data && result.data.length > 0) {
      const firstImg = result.data[0];
      const geoInfo = await getAddressInfo(
        firstImg.geometry.coordinates[1],
        firstImg.geometry.coordinates[0]
      );

      const ops = result.data.map((img: any) => ({
        updateOne: {
          filter: { imageId: img.id },
          update: {
            $setOnInsert: {
              imageId: img.id,
              location: {
                type: 'Point',
                coordinates: [img.geometry.coordinates[0], img.geometry.coordinates[1]]
              },
              continent: selectedRegion.name,
              country: geoInfo.country,
              city: geoInfo.city
            }
          },
          upsert: true
        }
      }));

      const bulkRes = await Location.bulkWrite(ops);

      console.log(
        `[SUCCESS] ${selectedRegion.name.toUpperCase()} | Found: ${result.data.length} | New: ${bulkRes.upsertedCount} | Location: ${geoInfo.country}, ${geoInfo.city}`
      );
    } else {
      console.log(`[EMPTY] ${selectedRegion.name.toUpperCase()} | No images found at ${bbox}`);
    }
  } catch (err) {
    console.error(`[CRITICAL ERROR]`, err);
  }
};

const start = async () => {
  if (!MONGODB_URI) {
    console.error('MONGODB_URI is missing from .env');
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('--- MINING STARTED ---');
    console.log('Targeting: Europe, N-America, S-America, Africa, Asia, Oceania');
    console.log('Interval: 2000ms');
    console.log('----------------------');

    setInterval(fetchImages, 2000);
  } catch (err) {
    console.error('Database connection failed:', err);
  }
};

start();
