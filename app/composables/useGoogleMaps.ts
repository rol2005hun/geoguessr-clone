/// <reference types="@types/google.maps" />
import { ref } from 'vue';

const isLoaded = ref(false);
const error = ref<Error | null>(null);

export const useGoogleMaps = () => {
  const loadMapsAPI = (apiKey: string) => {
    if (window.google && window.google.maps) {
      isLoaded.value = true;
      return;
    }

    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      return; // already loading
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      isLoaded.value = true;
    };
    script.onerror = (e) => {
      error.value = new Error('Failed to load Google Maps API');
    };
    document.head.appendChild(script);
  };

  const createStreetView = (element: HTMLElement, position: google.maps.LatLngLiteral) => {
    return new google.maps.StreetViewPanorama(element, {
      position,
      pov: {
        heading: 34,
        pitch: 10,
      },
      disableDefaultUI: true, // Disable standard UI for custom geoguesser feel
      showRoadLabels: false, // Essential for hiding location names
    });
  };

  const createGameMap = (element: HTMLElement, initialPosition: google.maps.LatLngLiteral) => {
    return new google.maps.Map(element, {
      center: initialPosition,
      zoom: 2,
      disableDefaultUI: true, // Hide map controls to prevent cheating
    });
  };

  const calculateDistance = (p1: google.maps.LatLngLiteral, p2: google.maps.LatLngLiteral): number => {
    // Haversine formula calculation logic
    const R = 6371e3; // metres
    const φ1 = p1.lat * Math.PI/180;
    const φ2 = p2.lat * Math.PI/180;
    const Δφ = (p2.lat-p1.lat) * Math.PI/180;
    const Δλ = (p2.lng-p1.lng) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; 
  };

  return {
    isLoaded,
    error,
    loadMapsAPI,
    createStreetView,
    createGameMap,
    calculateDistance,
  };
};