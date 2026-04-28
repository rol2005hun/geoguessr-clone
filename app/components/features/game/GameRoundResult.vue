<template>
  <div class="round-result-container">
    <Icon name="ph:globe-hemisphere-east-duotone" class="panel-background-logo" />

    <div class="result-modal">
      <h2 class="section-title">{{ t("game.ui.roundResult") }}</h2>
      
      <div class="map-container">
        <div ref="resultMapElement" class="result-map"></div>
      </div>

      <div class="result-stats">
        <div class="stat-box">
          <Icon name="ph:navigation-arrow-fill" class="stat-icon distance-icon" />
          <span class="stat-label">{{ t("game.ui.distance") }}</span>
          <span class="stat-value">{{ Math.round(geoStore.roundResultData?.distance || 0) }} km</span>
        </div>
        
        <div class="stat-box">
          <Icon name="ph:crown-fill" class="stat-icon points-icon" />
          <span class="stat-label">{{ t("game.ui.points") }}</span>
          <span class="stat-value">{{ geoStore.roundResultData?.points || 0 }}</span>
        </div>
      </div>

      <div class="action-section">
        <button class="btn primary-btn next-btn" @click="handleSkip" :disabled="geoStore.hasVotedSkip">
          <Icon v-if="!geoStore.hasVotedSkip" name="ph:fast-forward-bold" />
          <span v-if="!geoStore.hasVotedSkip">{{ t("game.actions.skip") }}</span>
          <span v-else>{{ t("game.actions.waiting") }}</span>
        </button>

        <p class="auto-next-text">
          {{ timeLeft }}s
          <span v-if="geoStore.players.length > 1">({{ geoStore.skipVotes }} / {{ geoStore.players.length }})</span>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useGeoStore } from '~/stores/geoGame';
import { useI18n } from 'vue-i18n';
import 'leaflet/dist/leaflet.css';

const { t } = useI18n();
const geoStore = useGeoStore();

const resultMapElement = ref<HTMLElement | null>(null);
let mapInstance: any = null;
let timerInterval: any = null;
const timeLeft = ref<number>(15);

const handleSkip = () => {
  geoStore.voteSkip();
};

onMounted(async () => {
  if (import.meta.client && resultMapElement.value) {
    const L = (await import('leaflet')).default;
    const correctLoc = geoStore.roundResultData?.correctLocation;
    const guessedLoc = geoStore.roundResultData?.guessedLocation;
    
    mapInstance = L.map(resultMapElement.value, {
      center: correctLoc ? [correctLoc.lat, correctLoc.lng] : [20, 0],
      zoom: 2,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(mapInstance);

    if (correctLoc && guessedLoc) {
      const correctMarker = L.divIcon({
        className: 'custom-correct-marker',
        html: `<div style="width: 14px; height: 14px; background: #22c55e; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 6px rgba(0,0,0,0.8);"></div>`,
        iconSize: [14, 14], iconAnchor: [7, 7]
      });
      const guessedMarker = L.divIcon({
        className: 'custom-guess-marker',
        html: `<div style="width: 14px; height: 14px; background: #f43f5e; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 6px rgba(0,0,0,0.8);"></div>`,
        iconSize: [14, 14], iconAnchor: [7, 7]
      });

      L.marker([correctLoc.lat, correctLoc.lng], { icon: correctMarker }).addTo(mapInstance);
      L.marker([guessedLoc.lat, guessedLoc.lng], { icon: guessedMarker }).addTo(mapInstance);

      const latlngs = [
          [correctLoc.lat, correctLoc.lng],
          [guessedLoc.lat, guessedLoc.lng]
      ];
      const polyline = L.polyline(latlngs, {color: '#f59e0b', dashArray: '5, 5', weight: 4}).addTo(mapInstance);
      
      setTimeout(() => {
        if(mapInstance) {
          mapInstance.invalidateSize();
          mapInstance.fitBounds(polyline.getBounds(), { padding: [25, 25] });
        }
      }, 200);
    }
  }

  timerInterval = setInterval(() => {
    timeLeft.value--;
    if (timeLeft.value <= 0) {
      clearInterval(timerInterval);
      if (geoStore.isHost) {
        geoStore.nextRound();
      }
    }
  }, 1000);
});

onBeforeUnmount(() => {
  if (timerInterval) clearInterval(timerInterval);
  if (mapInstance && mapInstance.remove) {
    mapInstance.remove();
  }
});
</script>

<style scoped lang="scss">
.round-result-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at top right, rgba(59, 130, 246, 0.1), transparent 40%), linear-gradient(135deg, #0f172a 0%, #020617 100%);
  z-index: 1050;
  padding: 1rem;
  box-sizing: border-box;
  overflow: hidden;
}

.panel-background-logo {
  position: absolute;
  font-size: 80vh;
  color: rgba(59, 130, 246, 0.03);
  top: 50%;
  right: -10%;
  transform: translateY(-50%) rotate(-15deg);
  z-index: 0;
  pointer-events: none;
}

.result-modal {
  width: 100%;
  max-width: 650px;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  position: relative;
  z-index: 1;
}

.section-title {
  text-align: center;
  font-size: 2.2rem;
  margin: 0;
  font-weight: 800;
  background: linear-gradient(135deg, #f8fafc 0%, #94a3b8 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.map-container {
  width: 100%;
  background: rgba(15, 23, 42, 0.5);
  padding: 0.5rem;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
}

.result-map {
  width: 100%;
  height: 320px;
  border-radius: 20px;
  background: #0f172a;
}

.result-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.stat-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(30, 41, 59, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  padding: 1.5rem;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.03);
    transform: translateY(-5px);
    border-color: rgba(255, 255, 255, 0.1);
  }
}

.stat-icon {
  font-size: 2.2rem;
  margin-bottom: 0.8rem;

  &.distance-icon { color: #3b82f6; }
  &.points-icon { color: #f59e0b; }
}

.stat-label {
  font-size: 0.8rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  font-weight: 700;
  margin-bottom: 0.3rem;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: 800;
  color: #f8fafc;
}

.action-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  border: none;
  border-radius: 9999px;
  padding: 1.2rem 3rem;
  font-size: 1.1rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: inherit;
  text-transform: uppercase;
  letter-spacing: 1px;

  &.primary-btn {
    background: linear-gradient(135deg, #4ade80 0%, #3b82f6 100%);
    color: #020617;
    width: 100%;

    &:hover:not(:disabled) {
      transform: translateY(-3px);
      box-shadow: 0 10px 25px -5px rgba(74, 222, 128, 0.4);
    }
    
    &:disabled {
      background: #1e293b;
      color: #475569;
      cursor: not-allowed;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }
  }
}

.auto-next-text {
  font-size: 1rem;
  color: #94a3b8;
  font-weight: 700;
  margin: 0;
  
  span {
    font-size: 0.85rem;
    color: #475569;
    margin-left: 8px;
  }
}
</style>