import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import readline from 'readline';
import { Location } from '../models/Location';
import { VectorTile } from '@mapbox/vector-tile';
import Protobuf from 'pbf';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';
const MAPILLARY_TOKEN = process.env.MAPILLARY_CLIENT_TOKEN || '';

let TARGET_BBOX = '';
let isTargetedMode = false;
let zoomLevel = 5;
let mapillaryLayer = 'overview';
let startX = 0,
  endX = 31;
let startY = 0,
  endY = 31;
let currentX = 0;
let currentY = 0;
let progressFile = '';
let sessionFound = 0;
let sessionProcessed = 0;
let isProcessingQueue = false;

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

interface QueuedImage {
  id: string;
  lat: number;
  lng: number;
  continent: string;
  isPanorama: boolean;
}

const regions = [
  { name: 'Europe', minLng: -10, minLat: 35, maxLng: 30, maxLat: 60 },
  { name: 'North America', minLng: -125, minLat: 25, maxLng: -70, maxLat: 50 },
  { name: 'South America', minLng: -80, minLat: -55, maxLng: -35, maxLat: 10 },
  { name: 'Africa', minLng: -15, minLat: -35, maxLng: 50, maxLat: 35 },
  { name: 'Asia', minLng: 60, minLat: 5, maxLng: 145, maxLat: 55 },
  { name: 'Oceania', minLng: 110, minLat: -45, maxLng: 180, maxLat: -10 }
];

function getContinent(lat: number, lng: number): string {
  for (const region of regions) {
    if (
      lng >= region.minLng &&
      lng <= region.maxLng &&
      lat >= region.minLat &&
      lat <= region.maxLat
    ) {
      return region.name;
    }
  }
  return 'Unknown';
}

const imageQueue: QueuedImage[] = [];

function lon2tile(lon: number, zoom: number): number {
  return Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
}

function lat2tile(lat: number, zoom: number): number {
  return Math.floor(
    ((1 -
      Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) /
      2) *
      Math.pow(2, zoom)
  );
}

function tileToLon(x: number, z: number): number {
  return (x / Math.pow(2, z)) * 360 - 180;
}

function tileToLat(y: number, z: number): number {
  const n = Math.PI - (2 * Math.PI * y) / Math.pow(2, z);
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

function getLatLonFromPixel(
  z: number,
  x: number,
  y: number,
  px: number,
  py: number,
  extent: number = 4096
) {
  const globalX = x + px / extent;
  const globalY = y + py / extent;
  return {
    lon: tileToLon(globalX, z),
    lat: tileToLat(globalY, z)
  };
}

function loadProgress(): boolean {
  if (fs.existsSync(progressFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(progressFile, 'utf-8'));

      if (data.done === true) {
        console.log(
          `\n[PROGRESS] This target was already fully scanned. Delete ${progressFile} to re-scan.`
        );
        return false;
      }

      if (data.x >= startX && data.x <= endX && data.y >= startY && data.y <= endY) {
        currentX = data.x;
        currentY = data.y;
        console.log(`\n[PROGRESS] Resuming from Z=${zoomLevel} X=${currentX} Y=${currentY}`);
      } else {
        console.log(
          `\n[PROGRESS] Progress file out of bounds for current target. Starting from beginning.`
        );
      }
    } catch (err) {
      console.error('Error reading progress file:', err);
    }
  } else {
    console.log(
      `\n[PROGRESS] No previous progress found. Starting from Z=${zoomLevel} X=${currentX} Y=${currentY}`
    );
  }
  return true;
}

function saveProgress() {
  fs.writeFileSync(progressFile, JSON.stringify({ x: currentX, y: currentY }));
}

function markDone() {
  fs.writeFileSync(progressFile, JSON.stringify({ done: true }));
  console.log(`\n[PROGRESS] Scan complete. Progress saved as done.`);
}

const getAddressInfo = async (
  lat: number,
  lng: number
): Promise<{ country: string; city: string }> => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&accept-language=en`,
      { headers: { 'User-Agent': 'GeoGuesserGameBot/1.0' } }
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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const fetchMapillaryTile = async (x: number, y: number) => {
  const url = `https://tiles.mapillary.com/maps/vtp/mly1_public/2/${zoomLevel}/${x}/${y}?access_token=${MAPILLARY_TOKEN}`;

  process.stdout.write(
    `\r[SCANNING] Z=${zoomLevel} X=${x} Y=${y} (Queue: ${imageQueue.length})... `
  );

  try {
    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 429) {
        console.log('\n[RATE LIMIT] Mapillary is rate limiting. Sleeping for 10s...');
        await sleep(10000);
      }
      return;
    }

    const buffer = await res.arrayBuffer();
    const tile = new VectorTile(new Protobuf(new Uint8Array(buffer)));

    const imageLayer = tile.layers[mapillaryLayer];
    if (!imageLayer) return;

    let addedCount = 0;
    for (let i = 0; i < imageLayer.length; i++) {
      const feature = imageLayer.feature(i);
      if (feature.type !== 1) continue;

      const isPano = Boolean(feature.properties.is_pano);

      const id = String(feature.properties.id);
      const geom = feature.loadGeometry();

      if (!geom[0] || !geom[0][0]) continue;

      const px = geom[0][0].x;
      const py = geom[0][0].y;
      const coords = getLatLonFromPixel(zoomLevel, x, y, px, py, imageLayer.extent);

      const continent = getContinent(coords.lat, coords.lon);

      if (!isTargetedMode && continent === 'Unknown') continue;

      imageQueue.push({
        id,
        lat: coords.lat,
        lng: coords.lon,
        continent: continent === 'Unknown' ? 'CustomTarget' : continent,
        isPanorama: isPano
      });
      addedCount++;
    }

    if (addedCount > 0) {
      sessionFound += addedCount;
      console.log(
        `[MAPILLARY] Found: ${addedCount} images (Z=${zoomLevel} X=${x} Y=${y}). Queue size: ${imageQueue.length}`
      );
    }
  } catch (err) {
    console.error('[MAPILLARY CRITICAL ERROR]', err);
  }
};

const mapillaryProducer = async () => {
  while (currentY <= endY) {
    await fetchMapillaryTile(currentX, currentY);

    currentX++;
    if (currentX > endX) {
      currentX = startX;
      currentY++;
    }

    saveProgress();

    while (imageQueue.length > 100) {
      process.stdout.write(`\r[THROTTLE] Queue full (${imageQueue.length} items). Waiting...`);
      await sleep(500);
    }

    await sleep(150);
  }

  console.log(`\n\n--- SYSTEMATIC SCAN COMPLETE FOR Z=${zoomLevel}! ---`);
  markDone();

  while (imageQueue.length > 0 || isProcessingQueue) {
    process.stdout.write(
      `\r[FINISHING] Processing remaining queue: ${imageQueue.length} items... `
    );
    await sleep(1000);
  }

  console.log('\n[DONE] All images processed. Exiting.');
  process.exit(0);
};

const processQueue = async () => {
  if (isProcessingQueue || imageQueue.length === 0) return;

  isProcessingQueue = true;
  const img = imageQueue.shift()!;

  try {
    const existing = await Location.findOne({ imageId: img.id });
    if (existing) {
      sessionProcessed++;
      process.stdout.write('\n');
      console.log(
        `[DUPLICATE ${sessionProcessed}/${sessionFound}] Image ${img.id} already exists.`
      );
      return;
    }

    const geoInfo = await getAddressInfo(img.lat, img.lng);

    if (geoInfo.country !== 'Unknown' || isTargetedMode) {
      const insertData: Record<string, unknown> = {
        imageId: img.id,
        location: {
          type: 'Point',
          coordinates: [img.lng, img.lat]
        },
        continent: img.continent,
        country: geoInfo.country !== 'Unknown' ? geoInfo.country : 'Custom',
        city: geoInfo.city !== 'Unknown' ? geoInfo.city : 'Custom'
      };

      if (img.isPanorama) {
        insertData.isPanorama = true;
      }

      await Location.updateOne(
        { imageId: img.id },
        { $setOnInsert: insertData },
        { upsert: true }
      );

      sessionProcessed++;
      process.stdout.write('\n');
      const panoLabel = img.isPanorama ? '360°' : 'flat';
      console.log(
        `[SUCCESS ${sessionProcessed}/${sessionFound}] Saved: ${img.id} (${panoLabel}) | Lat: ${img.lat.toFixed(4)}, Lng: ${img.lng.toFixed(4)} | Location: ${img.continent}, ${geoInfo.country}, ${geoInfo.city}`
      );
    } else {
      sessionProcessed++;
      process.stdout.write('\n');
      console.log(
        `[SKIPPED ${sessionProcessed}/${sessionFound}] ${img.id} is in the ocean or location unidentifiable.`
      );
    }
  } catch (err) {
    console.error(`[DB/NOMINATIM ERROR]`, err);
  } finally {
    isProcessingQueue = false;
  }
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (query: string): Promise<string> => {
  return new Promise((resolve) => rl.question(query, resolve));
};

const start = async (): Promise<void> => {
  if (!MONGODB_URI) {
    console.error('MONGODB_URI is missing from .env!');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI);

    console.log('\n====================================================');
    console.log('   GEOGUESSR MAP MINER SCRIPT');
    console.log('====================================================');
    console.log('Select Mining Mode:');
    console.log(' [1] Global Mode (Z=5, World-wide representative panoramas)');
    console.log(' [2] Targeted City Mode (Z=14, Extract all panoramas from a BBOX)');

    const answer = await askQuestion('\nChoice (1 or 2): ');

    if (answer.trim() === '2') {
      isTargetedMode = true;
      zoomLevel = 14;
      mapillaryLayer = 'image';

      const bboxAnswer = await askQuestion(
        'Enter the TARGET BBOX (minLng, minLat, maxLng, maxLat): '
      );
      TARGET_BBOX = bboxAnswer.trim();

      if (!TARGET_BBOX) {
        console.error('BBOX is required for Targeted Mode!');
        process.exit(1);
      }
    }

    rl.close();

    if (isTargetedMode) {
      const parts = TARGET_BBOX.split(',').map(Number);
      if (parts.length < 4 || parts.some(isNaN)) {
        console.error('Invalid BBOX format! Expected: minLng, minLat, maxLng, maxLat');
        process.exit(1);
      }
      const [minLng, minLat, maxLng, maxLat] = parts as [number, number, number, number];

      startX = lon2tile(minLng, zoomLevel);
      endX = lon2tile(maxLng, zoomLevel);
      startY = lat2tile(maxLat, zoomLevel);
      endY = lat2tile(minLat, zoomLevel);

      const bboxHash = crypto.createHash('md5').update(TARGET_BBOX).digest('hex').substring(0, 8);
      progressFile = path.resolve(`server/scripts/progress_targeted_${bboxHash}.json`);
    } else {
      startX = 0;
      endX = 31;
      startY = 0;
      endY = 31;
      progressFile = path.resolve('server/scripts/progress_global.json');
    }

    currentX = startX;
    currentY = startY;

    console.log('\n----------------------------------------------------');
    console.log('--- MINING STARTED (SYSTEMATIC VECTOR TILE SCAN) ---');
    console.log(`Mode: ${isTargetedMode ? 'TARGETED (Z=14)' : 'GLOBAL (Z=5)'}`);
    if (isTargetedMode) console.log(`Target Bounding Box: ${TARGET_BBOX}`);
    console.log('Mapillary producer: Active (Scanning Grid)');
    console.log('Nominatim consumer: Active (1 processing per 1.2 seconds)');
    console.log('----------------------------------------------------\n');

    const shouldContinue = loadProgress();
    if (!shouldContinue) {
      console.log('[INFO] Nothing to do. Exiting.');
      process.exit(0);
    }

    mapillaryProducer();
    setInterval(processQueue, 1200);
  } catch (err) {
    console.error('Database error:', err);
    process.exit(1);
  }
};

start();
