<template>
  <div class="bbox-page">
    <!-- <div class="bbox-header">
      <h2>{{ t('bbox.title') }}</h2>
      <p>{{ t('bbox.description') }}</p>
    </div> -->

    <div class="bbox-layout">
      <ClientOnly>
        <div class="map-wrapper">
          <div id="map"></div>
        </div>
      </ClientOnly>

      <div class="sidebar">
        <div class="sidebar-section instructions-card">
          <div class="step">
            <span class="step-num">1</span>
            <span>
              {{ t('bbox.step1', { strong: '' }).split(t('bbox.step1Strong'))[0] }}
              <strong>{{ t('bbox.step1Strong') }}</strong>
            </span>
          </div>
          <div class="step">
            <span class="step-num">2</span>
            <span>
              {{ t('bbox.step2', { strong: '' }).split(t('bbox.step2Strong'))[0] }}
              <strong>{{ t('bbox.step2Strong') }}</strong>
            </span>
          </div>
          <div class="step">
            <span class="step-num">3</span>
            <span>
              {{ t('bbox.step3', { strong: '' }).split(t('bbox.step3Strong'))[0] }}
              <strong>{{ t('bbox.step3Strong') }}</strong>
            </span>
          </div>
        </div>

        <transition name="fade">
          <div v-if="bboxString" class="sidebar-section result-card">
            <p class="result-label">{{ t('bbox.resultLabel') }}</p>
            <code>{{ bboxString }}</code>
            <div class="result-actions">
              <button class="btn btn-primary" @click="copyToClipboard">
                {{ copied ? t('bbox.copied') : t('bbox.copy') }}
              </button>
              <button class="btn btn-danger" @click="resetMap">{{ t('bbox.reset') }}</button>
            </div>
          </div>
          <div v-else class="sidebar-section idle-card">
            <div class="idle-icon">🗺️</div>
            <p>
              {{ t('bbox.noSelection') }}
              <br />
              {{ t('bbox.noSelectionHint') }}
            </p>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Map, LatLng, TileLayer } from 'leaflet';
import 'leaflet/dist/leaflet.css';

const { t } = useI18n();
const settingsStore = useSettingsStore();
const { getMapTileConfig } = useMapStyle();

const bboxString = ref('');
const copied = ref(false);

let map: Map | null = null;
let currentTileLayer: TileLayer | null = null;
let points: LatLng[] = [];
const mapLayers: unknown[] = [];

const updateTileLayer = (L: typeof import('leaflet')) => {
  if (!map) return;
  if (currentTileLayer) {
    map.removeLayer(currentTileLayer);
  }

  const config = getMapTileConfig(settingsStore.mapStyle);
  currentTileLayer = L.tileLayer(config.url, {
    ...config.options,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);
};

onMounted(async () => {
  if (import.meta.client) {
    const L = await import('leaflet');

    map = L.map('map').setView([47.4979, 19.0402], 6);

    updateTileLayer(L);

    watch(
      () => settingsStore.mapStyle,
      () => updateTileLayer(L)
    );

    map.on('click', (e: { latlng: LatLng }) => {
      if (points.length >= 2) return;

      points.push(e.latlng);

      const marker = L.circleMarker(e.latlng, {
        radius: 7,
        fillColor: '#3b82f6',
        color: '#fff',
        weight: 2,
        opacity: 1,
        fillOpacity: 1
      }).addTo(map!);
      mapLayers.push(marker);

      if (points.length === 2) {
        const bounds = L.latLngBounds(points[0]!, points[1]!);
        const rectangle = L.rectangle(bounds, {
          color: '#f97316',
          weight: 2,
          fillOpacity: 0.15,
          dashArray: '6, 4'
        }).addTo(map!);
        mapLayers.push(rectangle);

        const minLng = bounds.getWest().toFixed(5);
        const minLat = bounds.getSouth().toFixed(5);
        const maxLng = bounds.getEast().toFixed(5);
        const maxLat = bounds.getNorth().toFixed(5);

        bboxString.value = `${minLng}, ${minLat}, ${maxLng}, ${maxLat}`;
      }
    });
  }
});

onUnmounted(() => {
  if (map && import.meta.client) {
    map.remove();
  }
});

const resetMap = () => {
  if (!map) return;
  (mapLayers as { remove: () => void }[]).forEach((layer) => {
    (layer as unknown as import('leaflet').Layer).remove();
  });
  mapLayers.length = 0;
  points = [];
  bboxString.value = '';
  copied.value = false;
};

const copyToClipboard = () => {
  navigator.clipboard.writeText(bboxString.value);
  copied.value = true;
  setTimeout(() => {
    copied.value = false;
  }, 2000);
};
</script>

<style scoped>
.bbox-page {
  height: 100%;
  width: 100%;
  overflow-y: auto;
  padding: 100px 16px 40px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.bbox-header {
  text-align: center;
  flex-shrink: 0;
}

.bbox-header h2 {
  color: #f8fafc;
  font-size: clamp(1.4rem, 3vw, 2.2rem);
  font-weight: 700;
  margin: 0 0 10px;
}

.bbox-header p {
  color: #94a3b8;
  font-size: 0.95rem;
  max-width: 560px;
  margin: 0 auto;
  line-height: 1.5;
}

.bbox-layout {
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex-shrink: 0;
}

@media (min-width: 900px) {
  .bbox-layout {
    flex-direction: row;
    align-items: stretch;
    height: 600px;
    max-height: calc(100vh - 200px);
  }
}

.map-wrapper {
  flex: 1;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid #334155;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
  background: #0f172a;
}

#map {
  height: 450px;
  min-height: 450px;
  width: 100%;
  z-index: 1;
}

@media (min-width: 900px) {
  #map {
    height: 100%;
    min-height: 100%;
  }
}

.sidebar {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 400px; /* Pre-allocate space for sidebar to reduce CLS */
}

@media (min-width: 900px) {
  .sidebar {
    width: 320px;
    flex-shrink: 0;
  }
}

.sidebar-section {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 20px;
  min-height: 120px; /* Give cards a minimum height to reduce layout shift */
}

.instructions-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.step {
  display: flex;
  align-items: center;
  gap: 14px;
  color: #cbd5e1;
  font-size: 0.9rem;
  line-height: 1.4;
}

.step strong {
  color: #f1f5f9;
}

.step-num {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #3b82f6;
  color: white;
  font-weight: 700;
  font-size: 0.85rem;
  flex-shrink: 0;
}

.idle-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  text-align: center;
  color: #64748b;
  font-size: 0.9rem;
  min-height: 120px;
  line-height: 1.6;
}

.idle-icon {
  font-size: 2.5rem;
}

.result-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.result-label {
  color: #94a3b8;
  font-size: 0.85rem;
  margin: 0;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

code {
  display: block;
  background: #0f172a;
  color: #22c55e;
  padding: 12px 14px;
  border-radius: 8px;
  font-size: 0.85rem;
  border: 1px solid #334155;
  word-break: break-all;
  line-height: 1.6;
}

.result-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.btn {
  color: white;
  border: none;
  padding: 11px 18px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  width: 100%;
  text-align: center;
}

.btn-primary {
  background: #3b82f6;
  box-shadow: 0 4px 14px rgba(59, 130, 246, 0.35);
}

.btn-primary:hover {
  background: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.45);
}

.btn-danger {
  background: transparent;
  border: 1px solid #ef4444;
  color: #ef4444;
}

.btn-danger:hover {
  background: #ef4444;
  color: white;
  transform: translateY(-1px);
}

.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
