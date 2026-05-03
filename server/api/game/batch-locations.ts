import { Location } from '../../../server/models/Location';
import { sendDiscordLog } from '../../utils/discord';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const count = parseInt(query.count as string) || 5;
  const config = useRuntimeConfig();

  const ensureArray = (val: unknown): string[] => {
    if (!val) return [];
    if (Array.isArray(val)) return val as string[];
    if (typeof val === 'string') return val.split(',');
    return [];
  };

  const continents = ensureArray(query.continents);
  const countries = ensureArray(query.countries);
  const cities = ensureArray(query.cities);

  const matchStage: Record<string, unknown> = {};

  const orConditions = [];
  if (continents.length) orConditions.push({ continent: { $in: continents } });
  if (countries.length) orConditions.push({ country: { $in: countries } });
  if (cities.length) orConditions.push({ city: { $in: cities } });

  if (orConditions.length > 0) {
    matchStage.$or = orConditions;
  }

  const getValidLocations = async (
    needed: number
  ): Promise<Array<{ location: { coordinates: [number, number] }; imageId: string }>> => {
    const results: Array<{ location: { coordinates: [number, number] }; imageId: string }> = [];

    while (results.length < needed) {
      const remaining = needed - results.length;
      const candidates = await Location.aggregate([
        { $match: matchStage },
        { $sample: { size: remaining * 2 } }
      ]);

      if (candidates.length === 0) break;

      for (const loc of candidates) {
        if (results.length >= needed) break;
        try {
          const response = await fetch(
            `https://graph.mapillary.com/${loc.imageId}?fields=id&access_token=${config.public.mapillaryClientToken}`
          );

          if (response.status === 404) {
            await Location.findByIdAndDelete(loc._id);
            continue;
          }

          if (response.ok) {
            results.push({
              location: loc.location,
              imageId: loc.imageId
            });
          }
        } catch {
          results.push({
            location: loc.location,
            imageId: loc.imageId
          });
        }
      }
    }

    return results;
  };

  try {
    const locations = await getValidLocations(count);
    if (!locations.length) {
      throw createError({ statusCode: 404, statusMessage: 'No locations found' });
    }

    return locations;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Database error';

    await sendDiscordLog(`Batch fetch failed: ${errorMessage}`, 'ERROR');

    throw createError({ statusCode: 500, statusMessage: errorMessage });
  }
});
