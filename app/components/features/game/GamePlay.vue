<template>
  <div class="game-play-container">
    <div class="map-wrapper" :class="{ 'map-expanded': isMapExpanded }" @mouseenter="isMapExpanded = true" @mouseleave="isMapExpanded = false">
      <div ref="mapElement" class="guessing-map"></div>
      <button class="expand-btn" @click="isMapExpanded = !isMapExpanded">
        <Icon :name="isMapExpanded ? 'ph:arrows-in-simple' : 'ph:arrows-out-simple'" />
      </button>
      <Transition name="fade">
        <button v-if="currentGuess" class="btn guess-btn glow-effect confirm-btn" @click="makeGuess">
          <Icon name="ph:map-pin-fill" />
          {{ t("game.actions.guess") }}
        </button>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useGeoStore } from '~/stores/geoGame';
import { useI18n } from 'vue-i18n';
import 'leaflet/dist/leaflet.css';

const { t } = useI18n();
const geoStore = useGeoStore();

const mapElement = ref<HTMLElement | null>(null);
let mapInstance: any = null;
let markerInstance: any = null;
const isMapExpanded = ref<boolean>(false);
const currentGuess = ref<{lat: number, lng: number} | null>(null);

const makeGuess = (): void => {
  if (currentGuess.value) {
    geoStore.submitGuess(currentGuess.value.lat, currentGuess.value.lng);
  }
};

const initializeGuessingMap = async () => {
  if (import.meta.client && mapElement.value && !mapInstance) {
    const L = (await import('leaflet')).default;
    const center: [number, number] = [20, 0];
    
    mapInstance = L.map(mapElement.value, {
      center,
      zoom: 1,
      minZoom: 1,
      zoomControl: false,
      maxBounds: [
        [-90, -180],
        [90, 180]
      ]
    });

    L.control.zoom({ position: 'topleft' }).addTo(mapInstance);

    // Dark layout tile provider with labels
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(mapInstance);

    // Custom dark marker to match previous Google Maps style
    const customIcon = L.divIcon({
      className: 'custom-guess-marker',
      html: `<div style="width: 14px; height: 14px; background: #fbbf24; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 6px rgba(0,0,0,0.8); cursor: pointer;"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });

    mapInstance.on('click', (e: any) => {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      currentGuess.value = { lat, lng };

      if (!markerInstance) {
        markerInstance = L.marker([lat, lng], { icon: customIcon }).addTo(mapInstance!);
      } else {
        markerInstance.setLatLng([lat, lng]);
      }
    });

    setTimeout(() => {
      mapInstance?.invalidateSize();
    }, 100);
  }
};

watch(isMapExpanded, (expanded) => {
  setTimeout(() => {
    mapInstance?.invalidateSize();
  }, 300);
});

onMounted(() => {
  initializeGuessingMap();
});
</script>

<style scoped lang="scss">
.game-play-container {
  position: absolute;
  bottom: 2.5rem;
  right: 2.5rem;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  pointer-events: auto;
  z-index: 20;

  .map-wrapper {
    position: relative;
    width: 320px;
    height: 240px;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8);
    border: 3px solid rgba(255, 255, 255, 0.15);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    transform-origin: bottom right;

    &.map-expanded {
      width: 500px;
      height: 400px;
      border-color: #38bdf8;
    }

    .guessing-map {
      width: 100%;
      height: 100%;
      background: #0f172a;
    }

    .expand-btn {
      position: absolute;
      top: 10px;
      right: 10px;
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      color: #fff;
      padding: 0.5rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      backdrop-filter: blur(4px);
      transition: all 0.2s;
      z-index: 2000;

      &:hover {
        background: #38bdf8;
        border-color: #fff;
      }
    }

    .confirm-btn {
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: #fff;
      border: 2px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 8px 24px rgba(245, 158, 11, 0.5);
      border-radius: 999px;
      width: auto;
      min-width: 200px;
      margin: 0;
      padding: 0.75rem 2rem;
      font-size: 1.1rem;
      z-index: 2000;
      white-space: nowrap;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      font-weight: 700;
      cursor: pointer;
      text-transform: uppercase;
      letter-spacing: 1px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

      &.glow-effect {
        animation: buttonGlow 2s infinite alternate;
      }

      &:hover {
        transform: translateX(-50%) translateY(-2px) scale(1.02);
        box-shadow: 0 12px 32px rgba(245, 158, 11, 0.7);
      }
      
      &:active {
        transform: translateX(-50%) translateY(0) scale(1);
      }
    }
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes buttonGlow {
  from { box-shadow: 0 0 10px rgba(245, 158, 11, 0.4); }
  to { box-shadow: 0 0 25px rgba(245, 158, 11, 0.8); }
}

@media (max-width: 768px) {
  .game-play-container {
    bottom: 2rem;
    right: 50%;
    transform: translateX(50%);
  }
}
</style>