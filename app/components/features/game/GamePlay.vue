<template>
  <div class="game-play-container">
    <div
      class="map-wrapper"
      :class="{ 'map-expanded': isMapExpanded }"
      @mouseenter="isMapExpanded = true"
      @mouseleave="isMapExpanded = false">
      <div ref="mapElement" class="guessing-map"></div>

      <button class="expand-btn" @click="isMapExpanded = !isMapExpanded">
        <Icon :name="isMapExpanded ? 'ph:arrows-in-simple-bold' : 'ph:arrows-out-simple-bold'" />
      </button>

      <Transition name="fade-up">
        <button
          v-if="currentGuess"
          class="btn primary-btn guess-btn glow-effect"
          @click="makeGuess">
          <Icon name="ph:map-pin-fill" />
          {{ t('game.actions.guess') }}
        </button>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue';
import { useGeoStore } from '~/stores/geoGame';
import { useI18n } from 'vue-i18n';
import type { Map, Marker, LeafletMouseEvent } from 'leaflet';
import 'leaflet/dist/leaflet.css';

const { t } = useI18n();
const geoStore = useGeoStore();

const mapElement = ref<HTMLElement | null>(null);
let mapInstance: Map | null = null;
let markerInstance: Marker | null = null;

const isMapExpanded = ref<boolean>(false);
const currentGuess = ref<{ lat: number; lng: number } | null>(null);

const makeGuess = (): void => {
  if (currentGuess.value) {
    geoStore.submitGuess(currentGuess.value.lat, currentGuess.value.lng);
  }
};

const initializeGuessingMap = async (): Promise<void> => {
  if (import.meta.server || !mapElement.value) return;

  const L = await import('leaflet');

  if (mapInstance) return;

  mapInstance = L.map(mapElement.value, {
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

watch(isMapExpanded, async (): Promise<void> => {
  await nextTick();
  setTimeout(() => {
    mapInstance?.invalidateSize();
  }, 300);
});

onMounted((): void => {
  initializeGuessingMap();
});
</script>

<style scoped lang="scss">
.game-play-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 100;
}

.map-wrapper {
  position: absolute;
  bottom: 2rem;
  right: 2rem;
  width: 320px;
  height: 220px;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: auto;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transform-origin: bottom right;

  &.map-expanded {
    width: 500px;
    height: 400px;
    border-radius: 24px;
    border-color: rgba(255, 255, 255, 0.15);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.7);
  }

  &:hover:not(.map-expanded) {
    transform: scale(1.02);
    border-color: rgba(74, 222, 128, 0.3);
  }
}

.guessing-map {
  width: 100%;
  height: 100%;
  flex: 1;
  background: #0f172a;
  border-radius: inherit;

  :deep(.leaflet-control-zoom) {
    border: none !important;
    margin: 1rem !important;

    a {
      background: rgba(30, 41, 59, 0.8) !important;
      color: #f8fafc !important;
      border: 1px solid rgba(255, 255, 255, 0.1) !important;
      backdrop-filter: blur(8px);

      &:first-child {
        border-radius: 8px 8px 0 0 !important;
      }
      &:last-child {
        border-radius: 0 0 8px 8px !important;
      }
      &:hover {
        background: #334155 !important;
      }
    }
  }

  :deep(.leaflet-container) {
    background: #0f172a !important;
  }
}

.expand-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 1000;
  transition: all 0.2s ease;

  &:hover {
    background: #1e293b;
    transform: scale(1.1);
    border-color: #4ade80;
  }
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  border: none;
  border-radius: 9999px;
  padding: 0.8rem 2rem;
  font-size: 1rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: inherit;
  text-transform: uppercase;
  letter-spacing: 1px;

  &.primary-btn {
    background: linear-gradient(135deg, #4ade80 0%, #3b82f6 100%);
    color: #020617;
  }
}

.guess-btn {
  position: absolute;
  bottom: 1.2rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;

  &.glow-effect {
    animation: pulse-glow 2s infinite;
  }

  &:hover {
    transform: translateX(-50%) translateY(-2px);
    box-shadow: 0 10px 20px -5px rgba(74, 222, 128, 0.5);
  }
}

@keyframes pulse-glow {
  0% {
    box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.6);
  }
  70% {
    box-shadow: 0 0 0 12px rgba(74, 222, 128, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(74, 222, 128, 0);
  }
}

.fade-up-enter-active,
.fade-up-leave-active {
  transition: all 0.3s ease;
}

.fade-up-enter-from,
.fade-up-leave-to {
  opacity: 0;
  transform: translate(-50%, 20px) scale(0.9);
}
</style>
