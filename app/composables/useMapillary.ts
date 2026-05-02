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

        panoramaInstance.on('mlyError' as any, (err: unknown) => {
          console.error('Mapillary error:', err);
          isLoading.value = false;
          isInitializing.value = false;
          addToast(t('error.connectionFailed'), 'error');
        });
      } catch {
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
