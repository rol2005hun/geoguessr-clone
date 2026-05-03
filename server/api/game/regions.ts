import { Location } from '../../models/Location';

export default defineCachedEventHandler(
  async () => {
    try {
      const [continents, countries, cities] = await Promise.all([
        Location.distinct('continent'),
        Location.distinct('country'),
        Location.distinct('city')
      ]);

      return {
        continents: continents.filter(Boolean).sort(),
        countries: countries.filter(Boolean).sort(),
        cities: cities.filter(Boolean).sort()
      };
    } catch {
      return { continents: [], countries: [], cities: [] };
    }
  },
  {
    maxAge: 60 * 60,
    swr: true,
    name: 'game-regions-cache'
  }
);
