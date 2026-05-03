<template>
  <div id="game-root">
    <NuxtRouteAnnouncer />

    <div class="global-logo-wrapper">
      <Logo />
    </div>

    <NuxtPage />

    <Toast />

    <Transition name="fade">
      <LazySettingsModal v-if="settingsStore.isSettingsModalOpen" @click.stop @close="settingsStore.closeSettingsModal()" />
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
}
</style>
