import type { Map, Marker, LeafletMouseEvent } from 'leaflet';
import 'leaflet/dist/leaflet.css';

export const useGuessMap = () => {
  let mapInstance: Map | null = null;
  let markerInstance: Marker | null = null;

  const currentGuess = ref<{ lat: number; lng: number } | null>(null);

  const initMap = async (element: HTMLElement, hasGuessedLocal: { value: boolean }) => {
    if (import.meta.server || !element) return;

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
      html: `<div style="width: 14px; height: 14px; background: #fbbf24; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 6px rgba(0,0,0,0.8); cursor: pointer;"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7]
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
    });

    setTimeout(() => {
      mapInstance?.invalidateSize();
    }, 200);
  };

  const invalidateSize = () => {
    setTimeout(() => {
      mapInstance?.invalidateSize();
    }, 300);
  };

  const resetGuess = () => {
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
