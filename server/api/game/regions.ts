import { Location } from '../../models/Location';

export default defineCachedEventHandler(
  async () => {
    try {
      const regions = await Location.aggregate([
        {
          $group: {
            _id: {
              continent: '$continent',
              country: '$country',
              city: '$city'
            }
          }
        },
        {
          $project: {
            _id: 0,
            continent: '$_id.continent',
            country: '$_id.country',
            city: '$_id.city'
          }
        }
      ]);

      return regions;
    } catch (error: any) {
      sendDiscordLog(`Failed to fetch regions cache: ${error?.message || 'Unknown error'}`, 'ERROR', {
        stack: String(error?.stack || error)
      }).catch(console.error);
      
      return [];
    }
  },
  {
    maxAge: 60 * 60,
    swr: true,
    name: 'game-regions-cache'
  }
);
