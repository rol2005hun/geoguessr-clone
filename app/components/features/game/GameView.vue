<template>
  <div class="game-container">
    <div class="gameplay-background">
      <template v-if="geoStore.status === 'playing'">
        <div v-show="isLoading" class="panorama-view loading-view">
          <Icon name="svg-spinners:ring-resize" class="spinner" />
          <p class="loading-text">{{ t('game.ui.loading') }}...</p>
        </div>
        <div ref="panoramaElement" class="panorama-container"></div>
      </template>
      <div v-else class="animated-bg"></div>
    </div>

    <div class="hud-overlay">
      <header class="game-header">
        <div class="logo">
          <Icon name="ph:globe-hemisphere-east-duotone" class="logo-icon" />
          <h1>{{ t('game.title') }}</h1>
        </div>
        <div class="header-controls">
          <div v-if="geoStore.status !== 'menu'" class="status-badge">
            <span class="pulse-dot"></span>
            {{ geoStore.status }}
          </div>
          <div v-if="geoStore.countdownTimer !== null" class="countdown-badge">
            <Icon name="ph:clock-bold" class="clock-icon" />
            <span :class="{ hurry: geoStore.countdownTimer <= 5 }">
              {{ geoStore.countdownTimer }}s
            </span>
          </div>
        </div>
      </header>

      <Transition name="fade-slide">
        <GameMenu
          v-if="geoStore.status === 'menu'"
          v-model:selected-map="selectedMap"
          v-model:selected-mode="selectedMode"
          @create="createLobby"
          @join="joinLobby" />
      </Transition>

      <Transition name="fade-slide">
        <LazyGameLobby v-if="geoStore.status === 'lobby'" @start="startGame" />
      </Transition>

      <Transition name="slide-up">
        <LazyGamePlay v-if="geoStore.status === 'playing' && !isLoading" />
      </Transition>

      <Transition name="fade">
        <LazyGameRoundResult v-if="geoStore.status === 'roundResult'" />
      </Transition>

      <Transition name="fade">
        <LazyGameFinished
          v-if="geoStore.showLeaderboard"
          @close="geoStore.showLeaderboard = false" />
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick, defineAsyncComponent } from 'vue';
import { useGeoStore } from '~/stores/geoGame';
import { useI18n } from 'vue-i18n';
import GameMenu from '~/components/features/game/GameMenu.vue';
import type { Viewer } from 'mapillary-js';
import 'mapillary-js/dist/mapillary.css';

interface City {
  lat: number;
  lng: number;
}

interface MapillaryImage {
  id: string;
  geometry: {
    coordinates: [number, number];
  };
}

const LazyGameLobby = defineAsyncComponent(
  () => import('~/components/features/game/GameLobby.vue')
);
const LazyGamePlay = defineAsyncComponent(() => import('~/components/features/game/GamePlay.vue'));
const LazyGameRoundResult = defineAsyncComponent(
  () => import('~/components/features/game/GameRoundResult.vue')
);
const LazyGameFinished = defineAsyncComponent(
  () => import('~/components/features/game/GameFinished.vue')
);

const { t } = useI18n();
const geoStore = useGeoStore();

const selectedMap = ref<string>('world');
const selectedMode = ref<string>('timeLimit');
const isLoading = ref<boolean>(true);
const isInitializing = ref<boolean>(false);
const usedImageIds = ref<string[]>([]);

const panoramaElement = ref<HTMLElement | null>(null);
let panoramaInstance: Viewer | null = null;

const createLobby = (username: string): void => {
  geoStore.createRoom(username);
};
const joinLobby = (roomId: string, username: string): void => {
  if (roomId && username) geoStore.joinRoom(roomId, username);
};
const startGame = (): void => {
  geoStore.startGame();
};

const handleBeforeUnload = (e: BeforeUnloadEvent): void => {
  if (geoStore.status === 'playing' || geoStore.status === 'lobby') {
    e.preventDefault();
  }
};

const fetchCityLocation = async (
  token: string,
  cities: City[]
): Promise<{ id: string; lat: number; lng: number } | null> => {
  const city = cities[Math.floor(Math.random() * cities.length)]!;
  const latOffset = (Math.random() - 0.5) * 0.1;
  const lngOffset = (Math.random() - 0.5) * 0.1;
  const targetLat = city.lat + latOffset;
  const targetLng = city.lng + lngOffset;
  const buffer = 0.005;
  const bbox = `${(targetLng - buffer).toFixed(5)},${(targetLat - buffer).toFixed(5)},${(targetLng + buffer).toFixed(5)},${(targetLat + buffer).toFixed(5)}`;

  try {
    const res = await fetch(
      `https://graph.mapillary.com/images?fields=id,geometry&is_pano=true&bbox=${bbox}&limit=10&access_token=${token}`
    );
    if (!res.ok) return null;
    const data = await res.json();

    if (data.data && data.data.length > 0) {
      const validImages = data.data.filter(
        (img: MapillaryImage) => !usedImageIds.value.includes(img.id.toString())
      );
      if (validImages.length === 0) return null;

      const selected = validImages[Math.floor(Math.random() * validImages.length)]!;
      return {
        id: selected.id.toString(),
        lat: selected.geometry.coordinates[1],
        lng: selected.geometry.coordinates[0]
      };
    }
  } catch {
    return null;
  }
  return null;
};

const getFastestLocation = async (
  token: string
): Promise<{ id: string; lat: number; lng: number } | null> => {
  const cities: City[] = [
    { lat: 47.4979, lng: 19.0402 },
    { lat: 48.8566, lng: 2.3522 },
    { lat: 51.5074, lng: -0.1278 },
    { lat: 40.7128, lng: -74.006 },
    { lat: 35.6762, lng: 139.6503 },
    { lat: -33.8688, lng: 151.2093 },
    { lat: 41.9028, lng: 12.4964 },
    { lat: 52.52, lng: 13.405 },
    { lat: 34.0522, lng: -118.2437 },
    { lat: -22.9068, lng: -43.1729 },
    { lat: 1.3521, lng: 103.8198 },
    { lat: 41.8781, lng: 126.978 },
    { lat: -34.6037, lng: -58.3816 },
    { lat: 55.6761, lng: 12.5683 },
    { lat: 59.3293, lng: 18.0686 },
    { lat: 45.4642, lng: 9.19 },
    { lat: 38.7223, lng: -9.1393 },
    { lat: 52.3676, lng: 4.9041 },
    { lat: 48.1371, lng: 11.5754 },
    { lat: 39.9042, lng: 116.4074 },
    { lat: 37.7749, lng: -122.4194 },
    { lat: -37.8136, lng: 144.9631 },
    { lat: 43.6532, lng: -79.3832 },
    { lat: -33.9249, lng: 18.4241 },
    { lat: 25.2048, lng: 55.2708 }
  ];

  const attempts = [
    fetchCityLocation(token, cities),
    fetchCityLocation(token, cities),
    fetchCityLocation(token, cities),
    fetchCityLocation(token, cities),
    fetchCityLocation(token, cities)
  ];

  const results = await Promise.all(attempts);
  const found = results.find((r): r is { id: string; lat: number; lng: number } => r !== null);

  if (found) {
    usedImageIds.value.push(found.id);
    if (usedImageIds.value.length > 200) usedImageIds.value.shift();
  }

  return found || null;
};

const initializePanorama = async (): Promise<void> => {
  if (isInitializing.value) return;
  isInitializing.value = true;
  const config = useRuntimeConfig();

  if (import.meta.client && panoramaElement.value) {
    const { Viewer } = await import('mapillary-js');
    isLoading.value = true;

    if (panoramaInstance) {
      try {
        panoramaInstance.remove();
      } catch {
        void 0;
      }
      panoramaInstance = null;
      if (panoramaElement.value) panoramaElement.value.innerHTML = '';
    }

    getFastestLocation(config.public.mapillaryClientToken as string).then((loc) => {
      if (loc && !geoStore.actualLocationForRound) {
        geoStore.socket?.emit('set-panorama', geoStore.roomId, {
          ...loc,
          imageId: loc.id
        });
      }
    });

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

    const selectedLoc = {
      id: geoStore.actualLocationForRound!.imageId!,
      lat: geoStore.actualLocationForRound!.lat,
      lng: geoStore.actualLocationForRound!.lng
    };

    try {
      panoramaInstance = new Viewer({
        accessToken: config.public.mapillaryClientToken as string,
        container: panoramaElement.value,
        imageId: selectedLoc.id,
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

watch(
  () => geoStore.status,
  async (newStatus, oldStatus) => {
    if (newStatus === 'playing' && oldStatus !== 'playing') {
      isLoading.value = true;
      geoStore.actualLocationForRound = null;
      await nextTick();
      initializePanorama();
    }
  }
);

onMounted((): void => {
  geoStore.initSocket();
  window.addEventListener('beforeunload', handleBeforeUnload);
});

onBeforeUnmount((): void => {
  window.removeEventListener('beforeunload', handleBeforeUnload);
  if (panoramaInstance) {
    try {
      panoramaInstance.remove();
    } catch {
      void 0;
    }
  }
});
</script>

<style scoped lang="scss">
.game-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background-color: #0f172a;
  color: #f8fafc;
  font-family: 'Inter', sans-serif;
}

.gameplay-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 1;

  .panorama-container {
    width: 100%;
    height: 100%;
  }
}

.loading-view {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.9);
  z-index: 2;
  gap: 1.5rem;

  .spinner {
    font-size: 3.5rem;
    color: #4ade80;
  }

  .loading-text {
    font-size: 1.2rem;
    font-weight: 600;
    letter-spacing: 2px;
    color: #f8fafc;
    text-transform: uppercase;
  }
}

.animated-bg {
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, #0f172a, #1e293b, #020617);
  background-size: 400% 400%;
  animation: gradient-shift 15s ease infinite;
}

@keyframes gradient-shift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.hud-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 10;
  pointer-events: none;
}

.hud-overlay > *:not(.game-header) {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.hud-overlay > * > * {
  pointer-events: auto;
}

.game-header {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 2.5rem;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.7) 0%, transparent 100%);
  z-index: 100;
  pointer-events: auto;
  box-sizing: border-box;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.8rem;

  .logo-icon {
    font-size: 2.2rem;
    color: #4ade80;
  }

  h1 {
    margin: 0;
    font-size: 1.6rem;
    font-weight: 800;
    letter-spacing: 1px;
    background: linear-gradient(135deg, #f8fafc 0%, #cbd5e1 100%);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: rgba(30, 41, 59, 0.6);
  backdrop-filter: blur(8px);
  padding: 0.6rem 1.2rem;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-weight: 600;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 1px;

  .pulse-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #4ade80;
    animation: status-pulse 2s infinite;
  }
}

@keyframes status-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.7);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(74, 222, 128, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(74, 222, 128, 0);
  }
}

.countdown-badge {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: rgba(30, 41, 59, 0.6);
  backdrop-filter: blur(8px);
  padding: 0.6rem 1.2rem;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-weight: 700;
  font-size: 1.2rem;
  .clock-icon {
    color: #94a3b8;
  }
  .hurry {
    color: #ef4444;
    animation: text-shake 0.5s infinite;
  }
}

@keyframes text-shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-2px);
  }
  75% {
    transform: translateX(2px);
  }
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition:
    opacity 0.4s ease,
    transform 0.4s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition:
    opacity 0.4s ease,
    transform 0.4s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(40px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
