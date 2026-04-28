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
        <LazyGamePlay v-if="geoStore.status === 'playing'" />
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

interface Region {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
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

const fetchSingleLocation = async (
  token: string,
  regions: Region[]
): Promise<{ id: string; lat: number; lng: number } | null> => {
  const reg = regions[Math.floor(Math.random() * regions.length)]!;
  const lat = Math.random() * (reg.maxLat - reg.minLat) + reg.minLat;
  const lng = Math.random() * (reg.maxLng - reg.minLng) + reg.minLng;
  const buffer = 0.05;
  const bbox = `${(lng - buffer).toFixed(4)},${(lat - buffer).toFixed(4)},${(lng + buffer).toFixed(4)},${(lat + buffer).toFixed(4)}`;

  try {
    const res = await fetch(
      `https://graph.mapillary.com/images?fields=id,geometry&is_pano=true&bbox=${bbox}&limit=1&access_token=${token}`
    );
    const data = await res.json();
    if (res.ok && data.data?.length > 0) {
      return {
        id: data.data[0].id.toString(),
        lat: data.data[0].geometry.coordinates[1],
        lng: data.data[0].geometry.coordinates[0]
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
  const regions: Region[] = [
    { minLat: 41.0, maxLat: 51.0, minLng: -4.0, maxLng: 8.0 },
    { minLat: 45.0, maxLat: 49.0, minLng: 16.0, maxLng: 22.0 },
    { minLat: 35.0, maxLat: 44.0, minLng: -9.0, maxLng: 3.0 },
    { minLat: 36.0, maxLat: 47.0, minLng: 6.0, maxLng: 19.0 },
    { minLat: 35.0, maxLat: 41.0, minLng: 135.0, maxLng: 141.0 }
  ];

  const attempts = [
    fetchSingleLocation(token, regions),
    fetchSingleLocation(token, regions),
    fetchSingleLocation(token, regions),
    fetchSingleLocation(token, regions)
  ];

  const results = await Promise.all(attempts);
  return results.find((r): r is { id: string; lat: number; lng: number } => r !== null) || null;
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

    let selectedLoc: { id: string; lat: number; lng: number } | null = null;

    if (geoStore.isHost) {
      selectedLoc = await getFastestLocation(config.public.mapillaryClientToken as string);

      if (!selectedLoc) selectedLoc = { id: '2205278409649051', lat: 48.858, lng: 2.294 };

      geoStore.socket?.emit('set-panorama', geoStore.roomId, {
        ...selectedLoc,
        imageId: selectedLoc.id
      });
      geoStore.actualLocationForRound = { ...selectedLoc, imageId: selectedLoc.id };
    } else {
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
      selectedLoc = {
        id: geoStore.actualLocationForRound!.imageId!,
        lat: geoStore.actualLocationForRound!.lat,
        lng: geoStore.actualLocationForRound!.lng
      };
    }

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
    }, 3500);
  }
};

watch(
  () => geoStore.status,
  async (newStatus, oldStatus) => {
    if (newStatus === 'playing' && oldStatus !== 'playing') {
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
    text-transform: uppercase;
    background: linear-gradient(135deg, #f8fafc 0%, #cbd5e1 100%);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
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
