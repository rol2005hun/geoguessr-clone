import { ref, type Ref } from 'vue';
import type { Map, Marker, LeafletMouseEvent } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useToast } from '~/composables/useToast';
import { useI18n } from 'vue-i18n';

export const useGuessMap = () => {
  const { t } = useI18n();
  const { addToast } = useToast();

  let mapInstance: Map | null = null;
  let markerInstance: Marker | null = null;

  const currentGuess = ref<{ lat: number; lng: number } | null>(null);

  const pinSounds: string[] = Array.from({ length: 12 }, (_, i) => `/sounds/mark${i + 1}.mp3`);

  const playRandomPinSound = (): void => {
    try {
      const randomIndex: number = Math.floor(Math.random() * pinSounds.length);
      const soundPath: string = pinSounds[randomIndex] as string;
      const audio = new Audio(soundPath);
      audio.volume = 0.6;
      audio.play().catch((err: unknown) => {
        console.error(err);
      });
    } catch (err: unknown) {
      console.error(err);
    }
  };

  const initMap = async (element: HTMLElement, hasGuessedLocal: Ref<boolean>): Promise<void> => {
    if (import.meta.server || !element) return;

    try {
      const L = await import('leaflet');

      if (mapInstance) return;

      mapInstance = L.map(element, {
        center: [20, 0],
        zoom: 1,
        minZoom: 1,
        zoomControl: false,
        worldCopyJump: true
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 20
      }).addTo(mapInstance);

      const customIcon = L.divIcon({
        className: 'custom-guess-marker',
        html: `
          <div style="filter: drop-shadow(0px 4px 4px rgba(0,0,0,0.5)); cursor: pointer; display: flex;">
            <svg width="32" height="32" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#fbbf24" stroke="#ffffff" stroke-width="1.5"/>
              <circle cx="12" cy="9" r="4" fill="#ffffff" />
            </svg>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      });

      mapInstance.on('click', (e: LeafletMouseEvent) => {
        if (hasGuessedLocal.value) return;
        const { lat, lng } = e.latlng;
        currentGuess.value = { lat, lng };

        if (!markerInstance) {
          markerInstance = L.marker([lat, lng], { icon: customIcon }).addTo(mapInstance!);
        } else {
          markerInstance.setLatLng([lat, lng]);
        }

        playRandomPinSound();
      });

      setTimeout(() => {
        mapInstance?.invalidateSize();
      }, 200);
    } catch (err: unknown) {
      console.error(err);
      addToast(t('error.connectionFailed'), 'error');
    }
  };

  const invalidateSize = (): void => {
    setTimeout(() => {
      mapInstance?.invalidateSize();
    }, 300);
  };

  const resetGuess = (): void => {
    currentGuess.value = null;
    if (markerInstance && mapInstance) {
      markerInstance.remove();
      markerInstance = null;
    }
  };

  return {
    currentGuess,
    initMap,
    invalidateSize,
    resetGuess
  };
};
