<template>
  <div id="game-root">
    <NuxtRouteAnnouncer />

    <div class="global-logo-wrapper">
      <Logo />
    </div>

    <button class="global-settings-btn" @click="isSettingsOpen = true">
      <Icon name="ph:gear-six-fill" />
    </button>

    <NuxtPage />

    <Toast />

    <Transition name="fade">
      <SettingsModal v-if="isSettingsOpen" @click.stop @close="isSettingsOpen = false" />
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useGeoStore } from '~/stores/geoGame';
import { useSettingsStore } from '~/stores/settings';
import { useI18n } from 'vue-i18n';
import { useToast } from '~/composables/useToast';

const geoStore = useGeoStore();
const settingsStore = useSettingsStore();
const { addToast } = useToast();
const { t } = useI18n();

const isSettingsOpen = ref<boolean>(false);

watch(
  () => geoStore.lastError,
  (errorKey) => {
    if (errorKey) {
      addToast(t(errorKey), 'error');
      geoStore.clearError();
    }
  }
);

onMounted((): void => {
  settingsStore.initSettings();
});
</script>

<style lang="scss">
body,
html,
#__nuxt {
  margin: 0;
  padding: 0;
  width: 100vw;
  height: 100dvh;
  overflow: hidden;
  background-color: #0f172a;
  color: #f8fafc;
  font-family:
    'Inter',
    system-ui,
    -apple-system,
    sans-serif;
}

#game-root {
  width: 100%;
  height: 100%;
  position: relative;
}

.global-logo-wrapper {
  position: absolute;
  top: 1.5rem;
  left: 2.5rem;
  z-index: 9999;
  pointer-events: auto;
}

.global-settings-btn {
  position: absolute;
  top: 1.3rem;
  right: 2rem;
  z-index: 9999;
  background: rgba(30, 41, 59, 0.6);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #f8fafc;
  width: 45px;
  height: 45px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: auto;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: rotate(45deg) scale(1.05);
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

@media (max-width: 768px) {
  .global-logo-wrapper {
    display: none;
  }

  .global-settings-btn {
    top: 1rem;
    right: 1rem;
    width: 40px;
    height: 40px;
    font-size: 1.3rem;
  }
}
</style>
