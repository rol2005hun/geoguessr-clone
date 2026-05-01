import { useGeoStore } from '~/stores/geoGame';
import type { Viewer } from 'mapillary-js';
import 'mapillary-js/dist/mapillary.css';

interface City {
  lat: number;
  lng: number;
}

interface MapillaryImage {
  id: string;
  geometry: {
    coordinates: [number, number];
  };
}

export const useMapillary = () => {
  const isLoading = ref<boolean>(true);
  const isInitializing = ref<boolean>(false);
  const usedImageIds = ref<string[]>([]);
  let panoramaInstance: Viewer | null = null;

  const fetchCityLocation = async (
    token: string,
    cities: City[]
  ): Promise<{ id: string; lat: number; lng: number } | null> => {
    const city = cities[Math.floor(Math.random() * cities.length)]!;
    const latOffset = (Math.random() - 0.5) * 0.1;
    const lngOffset = (Math.random() - 0.5) * 0.1;
    const targetLat = city.lat + latOffset;
    const targetLng = city.lng + lngOffset;
    const buffer = 0.005;
    const bbox = `${(targetLng - buffer).toFixed(5)},${(targetLat - buffer).toFixed(5)},${(targetLng + buffer).toFixed(5)},${(targetLat + buffer).toFixed(5)}`;

    try {
      const res = await fetch(
        `https://graph.mapillary.com/images?fields=id,geometry&is_pano=true&bbox=${bbox}&limit=10&access_token=${token}`
      );
      if (!res.ok) return null;
      const data = await res.json();

      if (data.data && data.data.length > 0) {
        const validImages = data.data.filter(
          (img: MapillaryImage) => !usedImageIds.value.includes(img.id.toString())
        );
        if (validImages.length === 0) return null;

        const selected = validImages[Math.floor(Math.random() * validImages.length)]!;
        return {
          id: selected.id.toString(),
          lat: selected.geometry.coordinates[1],
          lng: selected.geometry.coordinates[0]
        };
      }
    } catch {
      return null;
    }
    return null;
  };

  const getFastestLocation = async (
    token: string
  ): Promise<{ id: string; lat: number; lng: number } | null> => {
    const cities: City[] = [
      { lat: 47.4979, lng: 19.0402 },
      { lat: 48.8566, lng: 2.3522 },
      { lat: 51.5074, lng: -0.1278 },
      { lat: 40.7128, lng: -74.006 },
      { lat: 35.6762, lng: 139.6503 },
      { lat: -33.8688, lng: 151.2093 },
      { lat: 41.9028, lng: 12.4964 },
      { lat: 52.52, lng: 13.405 },
      { lat: 34.0522, lng: -118.2437 },
      { lat: -22.9068, lng: -43.1729 },
      { lat: 1.3521, lng: 103.8198 },
      { lat: 41.8781, lng: 126.978 },
      { lat: -34.6037, lng: -58.3816 },
      { lat: 55.6761, lng: 12.5683 },
      { lat: 59.3293, lng: 18.0686 },
      { lat: 45.4642, lng: 9.19 },
      { lat: 38.7223, lng: -9.1393 },
      { lat: 52.3676, lng: 4.9041 },
      { lat: 48.1371, lng: 11.5754 },
      { lat: 39.9042, lng: 116.4074 },
      { lat: 37.7749, lng: -122.4194 },
      { lat: -37.8136, lng: 144.9631 },
      { lat: 43.6532, lng: -79.3832 },
      { lat: -33.9249, lng: 18.4241 },
      { lat: 25.2048, lng: 55.2708 }
    ];

    const attempts = [
      fetchCityLocation(token, cities),
      fetchCityLocation(token, cities),
      fetchCityLocation(token, cities),
      fetchCityLocation(token, cities),
      fetchCityLocation(token, cities)
    ];

    const results = await Promise.all(attempts);
    const found = results.find((r): r is { id: string; lat: number; lng: number } => r !== null);

    if (found) {
      usedImageIds.value.push(found.id);
      if (usedImageIds.value.length > 200) usedImageIds.value.shift();
    }

    return found || null;
  };

  const initPanorama = async (element: HTMLElement, geoStore: ReturnType<typeof useGeoStore>) => {
    if (isInitializing.value) return;
    isInitializing.value = true;
    const config = useRuntimeConfig();

    if (import.meta.client && element) {
      const { Viewer } = await import('mapillary-js');
      isLoading.value = true;

      if (panoramaInstance) {
        try {
          panoramaInstance.remove();
        } catch {
          void 0;
        }
        panoramaInstance = null;
        element.innerHTML = '';
      }

      getFastestLocation(config.public.mapillaryClientToken as string).then((loc) => {
        if (loc && !geoStore.actualLocationForRound) {
          geoStore.socket?.emit('set-panorama', geoStore.roomId, {
            ...loc,
            imageId: loc.id
          });
        }
      });

      if (!geoStore.actualLocationForRound) {
        await new Promise<void>((resolve) => {
          const unwatch = watch(
            () => geoStore.actualLocationForRound,
            (val) => {
              if (val) {
                unwatch();
                resolve();
              }
            }
          );
        });
      }

      const selectedLoc = {
        id: geoStore.actualLocationForRound!.imageId!,
        lat: geoStore.actualLocationForRound!.lat,
        lng: geoStore.actualLocationForRound!.lng
      };

      try {
        panoramaInstance = new Viewer({
          accessToken: config.public.mapillaryClientToken as string,
          container: element,
          imageId: selectedLoc.id,
          component: { cover: false }
        });
        panoramaInstance.on('load', () => {
          isLoading.value = false;
          isInitializing.value = false;
        });
      } catch {
        isLoading.value = false;
        isInitializing.value = false;
      }

      setTimeout(() => {
        isLoading.value = false;
        isInitializing.value = false;
      }, 4000);
    }
  };

  const destroyPanorama = () => {
    if (panoramaInstance) {
      try {
        panoramaInstance.remove();
      } catch {
        void 0;
      }
      panoramaInstance = null;
    }
  };

  return {
    isLoading,
    isInitializing,
    initPanorama,
    destroyPanorama
  };
};
