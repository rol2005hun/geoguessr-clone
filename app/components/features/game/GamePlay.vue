<template>
  <div class="game-play-container">
    <Transition name="fade-scale">
      <button
        v-if="isMobileView && !isMapExpanded"
        class="mobile-map-toggle"
        @click="isMapExpanded = true">
        <Icon name="ph:map-trifold-bold" />
      </button>
    </Transition>

    <div
      v-show="!isMobileView || isMapExpanded"
      class="map-wrapper"
      :class="{ 'map-expanded': isMapExpanded }"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave">
      <div ref="mapElement" class="guessing-map"></div>

      <button class="expand-btn" @click="isMapExpanded = !isMapExpanded">
        <Icon v-if="isMobileView" name="ph:x-bold" />
        <Icon
          v-else
          :name="isMapExpanded ? 'ph:arrows-in-simple-bold' : 'ph:arrows-out-simple-bold'" />
      </button>

      <Transition name="fade-up">
        <button
          v-if="currentGuess && !hasGuessedLocal"
          class="btn primary-btn guess-btn glow-effect"
          @click="makeGuess">
          <Icon name="ph:map-pin-fill" />
          {{ t('game.actions.guess') }}
        </button>
        <div v-else-if="hasGuessedLocal" class="guess-waiting">
          <Icon name="svg-spinners:ring-resize" />
          {{ t('game.actions.waiting') }}
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import 'leaflet/dist/leaflet.css';
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import { useGeoStore } from '~/stores/geoGame';
import { useI18n } from 'vue-i18n';
import { useGuessMap } from '~/composables/useGuessMap';
import { useToast } from '~/composables/useToast';

const { t } = useI18n();
const geoStore = useGeoStore();
const { addToast } = useToast();
const { currentGuess, initMap, invalidateSize, resetGuess } = useGuessMap();

const mapElement = ref<HTMLElement | null>(null);
const isMapExpanded = ref<boolean>(false);
const hasGuessedLocal = ref<boolean>(false);
const isMobileView = ref<boolean>(false);

const checkScreenSize = (): void => {
  try {
    if (import.meta.client) {
      isMobileView.value = window.innerWidth <= 768;
      if (isMobileView.value && !hasGuessedLocal.value) {
        isMapExpanded.value = false;
      }
    }
  } catch (err: unknown) {
    console.error(err);
  }
};

const handleMouseEnter = (): void => {
  try {
    if (!isMobileView.value) {
      isMapExpanded.value = true;
    }
  } catch (err: unknown) {
    console.error(err);
  }
};

const handleMouseLeave = (): void => {
  try {
    if (!isMobileView.value) {
      isMapExpanded.value = false;
    }
  } catch (err: unknown) {
    console.error(err);
  }
};

const makeGuess = (): void => {
  try {
    if (currentGuess.value && !hasGuessedLocal.value) {
      hasGuessedLocal.value = true;
      geoStore.submitGuess(currentGuess.value.lat, currentGuess.value.lng);
      if (isMobileView.value) {
        isMapExpanded.value = false;
      }
    }
  } catch (err: unknown) {
    console.error(err);
    hasGuessedLocal.value = false;
    addToast(t('error.connectionFailed'), 'error');
  }
};

watch(isMapExpanded, async (): Promise<void> => {
  try {
    await nextTick();
    invalidateSize();
  } catch (err: unknown) {
    console.error(err);
  }
});

watch(
  () => geoStore.status,
  (newStatus: string) => {
    try {
      if (newStatus === 'playing') {
        hasGuessedLocal.value = false;
        resetGuess();
        if (isMobileView.value) {
          isMapExpanded.value = false;
        }
      }
    } catch (err: unknown) {
      console.error(err);
    }
  }
);

onMounted((): void => {
  try {
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    if (mapElement.value) {
      initMap(mapElement.value, hasGuessedLocal);
    }
  } catch (err: unknown) {
    console.error(err);
    addToast(t('error.connectionFailed'), 'error');
  }
});

onBeforeUnmount((): void => {
  try {
    window.removeEventListener('resize', checkScreenSize);
  } catch (err: unknown) {
    console.error(err);
  }
});
</script>

<style scoped lang="scss">
.game-play-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100dvh;
  pointer-events: none;
  z-index: 100;
}

.mobile-map-toggle {
  position: absolute;
  bottom: 2rem;
  right: 4rem;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 50%;
  background: linear-gradient(135deg, #4ade80 0%, #3b82f6 100%);
  color: #020617;
  border: none;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.6);
  font-size: 1.5rem;
  z-index: 101;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: auto;

  &:active {
    transform: scale(0.92);
  }
}

.map-wrapper {
  position: absolute;
  bottom: 2rem;
  right: 4rem;
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
  width: 2.8rem;
  height: 2.8rem;
  border-radius: 12px;
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
  font-size: 1.2rem;

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

.guess-waiting {
  position: absolute;
  bottom: 1.2rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0.8rem 2rem;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  font-weight: 700;
  color: #4ade80;
  text-transform: uppercase;
  letter-spacing: 1px;
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

.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.5) translateY(20px);
}

@media (max-width: 768px) {
  .map-wrapper {
    left: 1rem;
    right: 1rem;
    bottom: 1rem;
    width: auto;
    height: 380px;
    max-height: 60vh;
    opacity: 0;
    pointer-events: none;
    transform: translateY(20px) scale(0.95);

    &.map-expanded {
      width: auto;
      opacity: 1;
      pointer-events: auto;
      transform: translateY(0) scale(1);
    }
  }
}

@media (max-width: 639px) {
  .mobile-map-toggle {
    right: 3rem;
    width: 2.5rem;
    height: 2.5rem;
    font-size: 1.5rem;
  }
}
</style>
