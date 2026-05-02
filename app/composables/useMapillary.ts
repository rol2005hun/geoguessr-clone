import { ref, watch } from 'vue';
import { useGeoStore } from '~/stores/geoGame';
import type { Viewer } from 'mapillary-js';
import 'mapillary-js/dist/mapillary.css';

export const useMapillary = () => {
  const isLoading = ref<boolean>(true);
  const isInitializing = ref<boolean>(false);
  let panoramaInstance: Viewer | null = null;

  const initPanorama = async (
    element: HTMLElement,
    geoStore: ReturnType<typeof useGeoStore>
  ): Promise<void> => {
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

      const selectedLoc = geoStore.actualLocationForRound!;

      try {
        panoramaInstance = new Viewer({
          accessToken: config.public.mapillaryClientToken as string,
          container: element,
          imageId: selectedLoc.imageId!,
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

  const destroyPanorama = (): void => {
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
