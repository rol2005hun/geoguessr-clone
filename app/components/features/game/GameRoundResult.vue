<template>
  <div class="round-result-container">
    <div class="result-modal glass-panel">
      <h2>{{ t("game.ui.roundResult") || "Round Finished!" }}</h2>
      
      <!-- Result map container -->
      <div ref="resultMapElement" class="result-map"></div>

      <div class="result-stats">
        <div class="stat-box">
          <Icon name="ph:navigation-arrow" class="stat-icon distance-icon" />
          <span class="stat-label">{{ t("game.ui.distance") || "Distance" }}</span>
          <span class="stat-value">{{ Math.round(geoStore.roundResultData?.distance || 0) }} km</span>
        </div>
        
        <div class="stat-box">
          <Icon name="ph:star-duotone" class="stat-icon points-icon" />
          <span class="stat-label">{{ t("game.ui.points") || "Points" }}</span>
          <span class="stat-value">{{ geoStore.roundResultData?.points || 0 }}</span>
        </div>
      </div>

      <div class="action-buttons">
        <button v-if="geoStore.currentRound < geoStore.maxRounds" class="btn primary-btn next-btn" @click="handleNextRound">
          {{ t("game.actions.nextRound") || "Next Round" }}
          <Icon name="ph:arrow-right-bold" />
        </button>
        <button v-else class="btn primary-btn next-btn" @click="handleNextRound">
          {{ t("game.actions.finish") || "Finish Game" }}
          <Icon name="ph:flag-checkered-bold" />
        </button>
      </div>
      
      <p v-if="geoStore.currentRound < geoStore.maxRounds" class="auto-next-text">{{ timeLeft }} mp múlva a következő kör jön...</p>
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
const timeLeft = ref<number>(5);

const handleNextRound = () => {
  if (timerInterval) clearInterval(timerInterval);
  geoStore.nextRound();
};

onMounted(async () => {
  // Inicializáljuk a térképet 1 mp késéssel ha megjelenik
  if (import.meta.client && resultMapElement.value) {
    const L = (await import('leaflet')).default;
    const correctLoc = geoStore.roundResultData?.correctLocation;
    const guessedLoc = geoStore.roundResultData?.guessedLocation;
    
    // Térkép létrehozása, közép az igazihely
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

      // Vonal a kettő közé
      const latlngs = [
          [correctLoc.lat, correctLoc.lng],
          [guessedLoc.lat, guessedLoc.lng]
      ];
      const polyline = L.polyline(latlngs, {color: '#f59e0b', dashArray: '5, 5', weight: 4}).addTo(mapInstance);
      
      // Rázoomolunk a két pontra
      setTimeout(() => {
        if(mapInstance) {
          mapInstance.invalidateSize();
          mapInstance.fitBounds(polyline.getBounds(), { padding: [25, 25] });
        }
      }, 200);
    }
  }

  if (geoStore.currentRound < geoStore.maxRounds) {
    // 5 másodperc auto next
    timerInterval = setInterval(() => {
      timeLeft.value--;
      if (timeLeft.value <= 0) {
        handleNextRound();
      }
    }, 1000);
  }
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
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  pointer-events: auto;
}

.result-map {
  width: 100%;
  height: 250px;
  background: #0f172a;
  border-radius: 16px;
  margin-bottom: 2rem;
  border: 2px solid rgba(255, 255, 255, 0.1);
}

.auto-next-text {
  margin-top: 1.5rem;
  font-size: 0.95rem;
  color: #94a3b8;
  font-weight: 500;
}

.result-modal {
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 24px;
  padding: 3rem;
  width: 90%;
  max-width: 500px;
  text-align: center;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
  animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);

  h2 {
    font-size: 2.2rem;
    font-weight: 800;
    margin: 0 0 2.5rem 0;
    background: linear-gradient(to right, #38bdf8, #818cf8);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
}

.result-stats {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 3rem;

  .stat-box {
    flex: 1;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    transition: transform 0.2s ease;

    &:hover {
      transform: translateY(-5px);
      background: rgba(255, 255, 255, 0.1);
    }

    .stat-icon {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;

      &.distance-icon { color: #f43f5e; }
      &.points-icon { color: #f59e0b; }
    }

    .stat-label {
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #94a3b8;
      font-weight: 600;
    }

    .stat-value {
      font-size: 1.8rem;
      font-weight: 800;
      color: #f8fafc;
    }
  }
}

.action-buttons {
  display: flex;
  justify-content: center;

  .btn {
    width: 100%;
    padding: 1.25rem 2rem;
    font-size: 1.2rem;
    border-radius: 12px;
    border: none;
    cursor: pointer;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    transition: all 0.3s ease;

    &.primary-btn {
      background: linear-gradient(135deg, #38bdf8 0%, #0369a1 100%);
      color: white;
      box-shadow: 0 4px 15px rgba(56, 189, 248, 0.4);

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(56, 189, 248, 0.6);
        background: linear-gradient(135deg, #7dd3fc 0%, #0284c7 100%);
      }
    }
  }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(40px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>