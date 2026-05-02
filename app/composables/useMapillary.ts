import type { Viewer } from 'mapillary-js';
import 'mapillary-js/dist/mapillary.css';

export const useMapillary = () => {
  const { t } = useI18n();
  const { addToast } = useToast();

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
      try {
        if (panoramaInstance) {
          try {
            panoramaInstance.remove();
          } catch (err: unknown) {
            console.error(err);
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
        isLoading.value = true;

        const { Viewer } = await import('mapillary-js');

        panoramaInstance = new Viewer({
          accessToken: config.public.mapillaryClientToken as string,
          container: element,
          imageId: selectedLoc.imageId!,
          component: { cover: false }
        });

        const panoramaEmitter = panoramaInstance as unknown as {
          on: (eventName: string, callback: (eventData?: unknown) => void) => void;
        };

        panoramaEmitter.on('load', () => {
          isLoading.value = false;
          isInitializing.value = false;
          try {
            if (panoramaInstance) {
              panoramaInstance.resize();
            }
          } catch (err: unknown) {
            console.error(err);
          }
        });

        panoramaEmitter.on('mlyError', (err: unknown) => {
          console.error(err);
          if (!panoramaInstance) {
            isLoading.value = false;
            isInitializing.value = false;
            addToast(t('error.connectionFailed'), 'error');
          }
        });
      } catch (err: unknown) {
        console.error(err);
        isLoading.value = false;
        isInitializing.value = false;
        addToast(t('error.connectionFailed'), 'error');
      }

      setTimeout(() => {
        if (isInitializing.value || isLoading.value) {
          isLoading.value = false;
          isInitializing.value = false;
        }
      }, 8000);
    }
  };

  const destroyPanorama = (): void => {
    if (panoramaInstance) {
      try {
        panoramaInstance.remove();
      } catch (err: unknown) {
        console.error(err);
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
