import { Location } from '../../../server/models/Location';
import { sendDiscordLog } from '../../utils/discord';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const continent = query.continent as string | undefined;
  const country = query.country as string | undefined;
  const city = query.city as string | undefined;
  const config = useRuntimeConfig();

  const matchStage: Record<string, string> = {};
  if (continent) matchStage.continent = continent;
  if (country) matchStage.country = country;
  if (city) matchStage.city = city;

  const getRandomLocation = async (): Promise<any> => {
    const randomDocs = await Location.aggregate([{ $match: matchStage }, { $sample: { size: 1 } }]);

    if (!randomDocs.length) {
      throw createError({
        statusCode: 404,
        statusMessage: 'No location found with these filters'
      });
    }

    const location = randomDocs[0];

    try {
      const response = await fetch(
        `https://graph.mapillary.com/${location.imageId}?fields=id&access_token=${config.public.mapillaryClientToken}`
      );

      if (response.status === 404) {
        console.warn(`Image ${location.imageId} not found on Mapillary. Deleting from DB...`);

        await Location.findByIdAndDelete(location._id);
        await sendDiscordLog(
          `Deleted obsolete location: ${location.imageId} (${location.country || 'Unknown'})`,
          'INFO'
        );

        return await getRandomLocation();
      }

      if (!response.ok) {
        console.error(`Mapillary API error: ${response.status}`);
      }

      return location;
    } catch (err: unknown) {
      console.error('Error validating imageId with Mapillary:', err);
      return location;
    }
  };

  try {
    return await getRandomLocation();
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Database error';
    await sendDiscordLog(`Failed to fetch random location from DB: ${errorMessage}`, 'ERROR');

    throw createError({
      statusCode: 500,
      statusMessage: errorMessage
    });
  }
});
