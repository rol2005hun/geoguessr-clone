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
/// <reference types="@types/google.maps" />
import { ref, onMounted, watch } from 'vue';
import { useGeoStore } from '~/stores/geoGame';
import { useGoogleMaps } from '~/composables/useGoogleMaps';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const geoStore = useGeoStore();
const { isLoaded, createGameMap } = useGoogleMaps();

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

const initializeGuessingMap = () => {
  if (isLoaded.value && mapElement.value && !mapInstance) {
    const center = { lat: 20, lng: 0 };
    mapInstance = createGameMap(mapElement.value, center);
    
    // Ensure map is properly resized and has background set
    setTimeout(() => {
      google.maps.event.trigger(mapInstance, 'resize');
      mapInstance.setCenter(center);
    }, 100);

    mapInstance.setOptions({
      disableDefaultUI: true,
      zoomControl: true,
      scrollwheel: true,
      gestureHandling: 'greedy',
      minZoom: 1,
      backgroundColor: '#0f172a'
    });

    mapInstance.addListener('click', (e: any) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      currentGuess.value = { lat, lng };

      if (!markerInstance) {
        markerInstance = new google.maps.Marker({
          position: currentGuess.value,
          map: mapInstance,
          animation: google.maps.Animation.DROP
        });
      } else {
        markerInstance.setPosition(currentGuess.value);
      }
    });
  }
};

watch(isLoaded, async (loaded) => {
  if (loaded) {
    await nextTick();
    initializeGuessingMap();
  }
});

watch(isMapExpanded, (expanded) => {
  if (window.google && mapInstance) {
    setTimeout(() => google.maps.event.trigger(mapInstance, 'resize'), 300);
  }
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
      z-index: 10;
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