import { Location } from '../../../server/models/Location';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const continent = query.continent as string | undefined;
  const country = query.country as string | undefined;
  const city = query.city as string | undefined;

  const matchStage: Record<string, string> = {};

  if (continent) {
    matchStage.continent = continent;
  }

  if (country) {
    matchStage.country = country;
  }

  if (city) {
    matchStage.city = city;
  }

  try {
    const randomDocs = await Location.aggregate([{ $match: matchStage }, { $sample: { size: 1 } }]);

    if (!randomDocs.length) {
      throw createError({
        statusCode: 404,
        statusMessage: 'No location found with these filters'
      });
    }

    return randomDocs[0];
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Database error';

    throw createError({
      statusCode: 500,
      statusMessage: errorMessage
    });
  }
});
