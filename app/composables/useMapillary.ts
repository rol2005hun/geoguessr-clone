import { ref, watch } from 'vue';
import { useGeoStore } from '~/stores/geoGame';
import type { Viewer } from 'mapillary-js';
import 'mapillary-js/dist/mapillary.css';
import { useToast } from '~/composables/useToast';
import { useI18n } from 'vue-i18n';

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
        const { Viewer } = await import('mapillary-js');
        isLoading.value = true;

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
        });

        panoramaEmitter.on('mlyError', (err: unknown) => {
          console.error(err);
          isLoading.value = false;
          isInitializing.value = false;
          addToast(t('error.connectionFailed'), 'error');
        });
      } catch (err: unknown) {
        console.error(err);
        isLoading.value = false;
        isInitializing.value = false;
        addToast(t('error.connectionFailed'), 'error');
      }

      setTimeout(() => {
        if (isInitializing.value) {
          isLoading.value = false;
          isInitializing.value = false;
        }
      }, 6000);
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
