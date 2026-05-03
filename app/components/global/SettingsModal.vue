<template>
  <div class="settings-overlay" @click.self="emit('close')">
    <div class="settings-modal">
      <div class="settings-header">
        <h2 class="settings-title">{{ t('game.ui.settings') }}</h2>
        <button class="close-btn" @click="emit('close')">
          <Icon name="ph:x-bold" />
        </button>
      </div>

      <div class="settings-content">
        <div class="setting-item">
          <label class="setting-label">{{ t('game.ui.mapStyle') }}</label>
          <div class="select-wrapper">
            <select
              v-model="settingsStore.mapStyle"
              class="settings-select"
              @change="changeMapStyle">
              <option value="carto-dark">{{ t('game.ui.mapStyles.carto-dark') }}</option>
              <option value="carto-voyager">{{ t('game.ui.mapStyles.carto-voyager') }}</option>
              <option value="carto-dark-no-labels">
                {{ t('game.ui.mapStyles.carto-dark-no-labels') }}
              </option>
              <option value="stadia-dark">{{ t('game.ui.mapStyles.stadia-dark') }}</option>
              <option value="osm">{{ t('game.ui.mapStyles.osm') }}</option>
            </select>
            <Icon name="ph:caret-down-bold" class="select-arrow" />
          </div>
        </div>

        <div class="map-preview-container">
          <div ref="previewMapElement" class="preview-map"></div>
        </div>

        <div class="setting-item">
          <label class="setting-label">{{ t('game.ui.language') }}</label>
          <div class="select-wrapper">
            <select v-model="currentLocale" class="settings-select" @change="changeLanguage">
              <option value="en">English</option>
              <option value="hu">Magyar</option>
            </select>
            <Icon name="ph:caret-down-bold" class="select-arrow" />
          </div>
        </div>

        <div class="settings-row">
          <div class="setting-item flex-1">
            <label class="setting-label">{{ t('game.ui.timerSound') }}</label>
            <button
              class="toggle-btn"
              :class="{ 'is-active': settingsStore.timerSoundEnabled }"
              @click="settingsStore.toggleTimerSound">
              <Icon
                :name="
                  settingsStore.timerSoundEnabled ? 'ph:speaker-high-fill' : 'ph:speaker-slash-fill'
                " />
              {{ settingsStore.timerSoundEnabled ? t('game.ui.on') : t('game.ui.off') }}
            </button>
          </div>

          <div class="setting-item flex-1">
            <label class="setting-label">{{ t('game.ui.markerSound') }}</label>
            <button
              class="toggle-btn"
              :class="{ 'is-active': settingsStore.markerSoundEnabled }"
              @click="settingsStore.toggleMarkerSound">
              <Icon
                :name="
                  settingsStore.markerSoundEnabled
                    ? 'ph:speaker-high-fill'
                    : 'ph:speaker-slash-fill'
                " />
              {{ settingsStore.markerSoundEnabled ? t('game.ui.on') : t('game.ui.off') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Map } from 'leaflet';
import 'leaflet/dist/leaflet.css';

const emit = defineEmits(['close']);
const { t, locale, setLocale } = useI18n();
const settingsStore = useSettingsStore();

type LocaleType = 'en' | 'hu';

const currentLocale = ref<LocaleType>('en');

const changeLanguage = (event: Event): void => {
  setLocale(currentLocale.value);
  const target = event.target as HTMLSelectElement;
  if (target) {
    target.blur();
  }
};

const previewMapElement = ref<HTMLElement | null>(null);
let previewMapInstance: Map | null = null;
let currentTileLayer: any = null;
const { getMapTileConfig } = useMapStyle();

const changeMapStyle = (event: Event): void => {
  const target = event.target as HTMLSelectElement;
  if (target) {
    settingsStore.setMapStyle(target.value);
    updatePreviewLayer();
    target.blur();
  }
};

const updatePreviewLayer = async () => {
  if (!previewMapInstance || import.meta.server) return;
  const L = (await import('leaflet')).default;
  if (currentTileLayer) {
    previewMapInstance.removeLayer(currentTileLayer);
  }
  const config = getMapTileConfig(settingsStore.mapStyle);
  currentTileLayer = L.tileLayer(config.url, config.options).addTo(previewMapInstance);
};

onMounted(async (): Promise<void> => {
  const current = locale.value as string;
  if (current === 'en' || current === 'hu') {
    currentLocale.value = current as LocaleType;
  } else {
    currentLocale.value = 'en';
  }

  if (import.meta.client && previewMapElement.value) {
    const L = (await import('leaflet')).default;
    previewMapInstance = L.map(previewMapElement.value, {
      center: [47.4979, 19.0402], // Budapest
      zoom: 4,
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      keyboard: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false
    });
    await updatePreviewLayer();

    setTimeout(() => {
      previewMapInstance?.invalidateSize();
    }, 300);
  }
});

onBeforeUnmount(() => {
  if (previewMapInstance) {
    previewMapInstance.remove();
  }
});
</script>

<style scoped lang="scss">
.map-preview-container {
  width: 100%;
  height: 160px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.05);
  position: relative;
}

.preview-map {
  width: 100%;
  height: 100%;
  background: #1e293b;
  pointer-events: none;
}
.settings-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100dvh;
  background: rgba(2, 6, 23, 0.8);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
  padding: 1rem;
  box-sizing: border-box;
}

.settings-modal {
  width: 100%;
  max-width: 400px;
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.settings-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 800;
  color: #f8fafc;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.close-btn {
  background: rgba(255, 255, 255, 0.05);
  border: none;
  color: #94a3b8;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #ef4444;
    color: #ffffff;
    transform: rotate(90deg);
  }
}

.settings-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.settings-row {
  display: flex;
  gap: 1rem;
}

.flex-1 {
  flex: 1;
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.setting-label {
  font-size: 0.85rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 700;
}

.select-wrapper {
  position: relative;
  width: 100%;
}

.select-arrow {
  position: absolute;
  right: 1.2rem;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  font-size: 1.2rem;
  pointer-events: none;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.settings-select {
  width: 100%;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 1rem 3rem 1rem 1.2rem;
  color: #f8fafc;
  font-size: 1.05rem;
  font-family: inherit;
  transition: all 0.2s ease;
  box-sizing: border-box;
  appearance: none;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    background: rgba(0, 0, 0, 0.3);
  }

  &:focus + .select-arrow {
    transform: translateY(-50%) rotate(180deg);
  }

  option {
    background: #1e293b;
    color: #f8fafc;
  }
}

.toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  width: 100%;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 1rem;
  color: #94a3b8;
  font-size: 1.05rem;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 1px;

  &.is-active {
    background: rgba(74, 222, 128, 0.15);
    color: #4ade80;
    border-color: rgba(74, 222, 128, 0.3);
  }
}

@media (max-width: 768px) {
  .settings-modal {
    padding: 1.5rem;
  }
}
</style>
