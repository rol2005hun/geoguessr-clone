<template>
  <div class="game-container">
    <div class="gameplay-background">
      <template
        v-if="geoStore.status === 'playing' || (geoStore.status === 'lobby' && isSingleplayer)">
        <div v-show="isLoading || geoStore.status === 'lobby'" class="panorama-view loading-view">
          <Icon name="svg-spinners:ring-resize" class="spinner" />
          <p class="loading-text">{{ t('game.ui.loading') }}...</p>
        </div>
        <div
          v-show="geoStore.status === 'playing'"
          ref="panoramaElement"
          class="panorama-container"></div>
      </template>
      <div v-else class="animated-bg"></div>
    </div>

    <div class="hud-overlay">
      <header class="game-header">
        <div class="header-controls">
          <div v-if="geoStore.status !== 'menu'" class="status-badge">
            <span class="pulse-dot"></span>
            <span v-if="geoStore.status === 'playing'">
              {{ t('game.status.playing') }} {{ geoStore.currentRound }} / 5
            </span>
            <span v-else>
              {{ t('game.status.' + geoStore.status) }}
            </span>
          </div>
          <div v-if="geoStore.countdownTimer !== null" class="countdown-badge">
            <Icon name="ph:clock-bold" class="clock-icon" />
            <span :class="{ hurry: geoStore.countdownTimer <= 5 }">
              {{ geoStore.countdownTimer }}s
            </span>
          </div>
        </div>
      </header>

      <Transition name="slide-up">
        <LazyGamePlay v-if="geoStore.status === 'playing' && !isLoading" />
      </Transition>

      <Transition name="fade">
        <LazyGameRoundResult v-if="geoStore.status === 'roundResult'" />
      </Transition>

      <Transition name="fade">
        <LazyGameFinished v-if="geoStore.showLeaderboard" @close="handleCloseLeaderboard" />
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  onMounted,
  onBeforeUnmount,
  watch,
  nextTick,
  defineAsyncComponent,
  computed
} from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useGeoStore } from '~/stores/geoGame';
import { useI18n } from 'vue-i18n';
import { useMapillary } from '~/composables/useMapillary';

const LazyGamePlay = defineAsyncComponent(() => import('~/components/features/game/GamePlay.vue'));
const LazyGameRoundResult = defineAsyncComponent(
  () => import('~/components/features/game/GameRoundResult.vue')
);
const LazyGameFinished = defineAsyncComponent(
  () => import('~/components/features/game/GameFinished.vue')
);

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const geoStore = useGeoStore();
const { isLoading, initPanorama, destroyPanorama } = useMapillary();

const panoramaElement = ref<HTMLElement | null>(null);

let timerAudio: HTMLAudioElement | null = null;

const currentRoomId = computed<string>(() => {
  const id = route.params.id as string | string[] | undefined;
  const idStr = Array.isArray(id) ? id[0] : id;
  return (idStr ?? '').toUpperCase();
});

const isSingleplayer = computed<boolean>(() => {
  if (import.meta.client) {
    return sessionStorage.getItem('ranzagg_mode') === 'single';
  }
  return false;
});

const handleCloseLeaderboard = (): void => {
  geoStore.showLeaderboard = false;
  router.push('/');
};

const handleBeforeUnload = (e: BeforeUnloadEvent): void => {
  if (geoStore.status === 'playing') {
    e.preventDefault();
  }
};

const stopAudio = (): void => {
  if (timerAudio) {
    timerAudio.pause();
    timerAudio.currentTime = 0;
  }
};

watch(
  () => geoStore.countdownTimer,
  (newVal: number | null) => {
    if (newVal !== null) {
      if (import.meta.client && !timerAudio) {
        timerAudio = new Audio('/sounds/timer.mp3');
        timerAudio.loop = true;
      }

      if (timerAudio) {
        if (newVal <= 5) {
          timerAudio.playbackRate = 1.2;
        } else {
          timerAudio.playbackRate = 1.0;
        }

        if (timerAudio.paused) {
          timerAudio.play().catch((err) => {
            console.warn('Audio play failed (maybe no user interaction yet):', err);
          });
        }
      }
    } else {
      stopAudio();
    }
  }
);

watch(
  () => geoStore.status,
  async (newStatus: string, oldStatus?: string) => {
    if (newStatus !== 'playing') {
      stopAudio();
    }

    if (newStatus === 'lobby') {
      if (isSingleplayer.value) {
        setTimeout(() => {
          if (geoStore.status === 'lobby') {
            geoStore.startGame();
          }
        }, 500);
      } else {
        router.replace(`/lobby/${currentRoomId.value}`);
      }
    } else if (newStatus === 'playing') {
      await nextTick();
      if (panoramaElement.value) {
        initPanorama(panoramaElement.value, geoStore);
      }
    } else if (newStatus === 'menu' && oldStatus !== undefined) {
      router.replace('/');
    }
  },
  { immediate: true }
);

onMounted((): void => {
  if (!geoStore.socket) {
    geoStore.initSocket();
  }

  const savedUsername = sessionStorage.getItem('ranzagg_username');

  if (!savedUsername) {
    router.replace('/');
    return;
  }

  if (geoStore.roomId !== currentRoomId.value) {
    geoStore.joinRoom(currentRoomId.value, savedUsername);
  }

  window.addEventListener('beforeunload', handleBeforeUnload);
});

onBeforeUnmount((): void => {
  stopAudio();
  window.removeEventListener('beforeunload', handleBeforeUnload);
  destroyPanorama();
});
</script>

<style scoped lang="scss">
.game-container {
  position: relative;
  width: 100vw;
  height: 100dvh;
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
  height: 100dvh;
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
  height: 100dvh;
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
  height: 100dvh;
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
  justify-content: flex-end;
  padding: 1.5rem 2.5rem;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.7) 0%, transparent 100%);
  z-index: 100;
  pointer-events: auto;
  box-sizing: border-box;
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

@media (max-width: 768px) {
  .game-header {
    padding: 1rem;
    flex-direction: column;
    gap: 1rem;
  }
}
</style>
