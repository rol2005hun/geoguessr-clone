<template>
  <div class="round-result-container">
    <div class="result-modal">
      <h2 class="section-title">{{ t('game.ui.roundResult') }}</h2>

      <div class="map-container">
        <div ref="resultMapElement" class="result-map"></div>
      </div>

      <div class="result-stats">
        <div class="stat-box">
          <Icon name="ph:navigation-arrow-fill" class="stat-icon distance-icon" />
          <span class="stat-label">{{ t('game.ui.distance') }}</span>
          <span class="stat-value">
            <template v-if="geoStore.roundResultData">
              {{ Math.round(geoStore.roundResultData.distance) }} km
            </template>
            <template v-else>-</template>
          </span>
        </div>

        <div class="stat-box">
          <Icon name="ph:crown-fill" class="stat-icon points-icon" />
          <span class="stat-label">{{ t('game.ui.points') }}</span>
          <span class="stat-value">
            <template v-if="geoStore.roundResultData">
              {{ geoStore.roundResultData.points }}
            </template>
            <template v-else>0</template>
          </span>
        </div>
      </div>

      <div class="action-section">
        <button
          class="btn primary-btn next-btn"
          :disabled="geoStore.hasVotedSkip"
          @click="handleSkip">
          <Icon v-if="!geoStore.hasVotedSkip" name="ph:fast-forward-bold" />
          <span v-if="!geoStore.hasVotedSkip">{{ t('game.actions.skip') }}</span>
          <span v-else>{{ t('game.actions.waiting') }}</span>
        </button>

        <p class="auto-next-text">
          {{ timeLeft }}s
          <span v-if="geoStore.players.length > 1">
            ({{ geoStore.skipVotes }} / {{ geoStore.players.length }})
          </span>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import 'leaflet/dist/leaflet.css';
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useGeoStore } from '~/stores/geoGame';
import { useI18n } from 'vue-i18n';
import type { Map } from 'leaflet';
import { useToast } from '~/composables/useToast';

const { t } = useI18n();
const geoStore = useGeoStore();
const { addToast } = useToast();

const resultMapElement = ref<HTMLElement | null>(null);
let mapInstance: Map | null = null;
let timerInterval: ReturnType<typeof setInterval> | null = null;
const timeLeft = ref<number>(15);

const handleSkip = (): void => {
  try {
    geoStore.voteSkip();
  } catch (err: unknown) {
    console.error(err);
    addToast(t('error.connectionFailed'), 'error');
  }
};

onMounted(async () => {
  try {
    if (import.meta.client && resultMapElement.value) {
      const L = (await import('leaflet')).default;
      const correctLoc = geoStore.actualLocationForRound;

      if (!correctLoc) return;

      const map = L.map(resultMapElement.value, {
        center: [correctLoc.lat, correctLoc.lng],
        zoom: 2,
        zoomControl: false,
        attributionControl: false
      });

      mapInstance = map;

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(map);

      const correctMarker = L.divIcon({
        className: 'custom-correct-marker',
        html: `
          <div style="
            width: 28px;
            height: 28px;
            background-color: #1a1a24;
            border: 3px solid #ffffff;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
          ">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#fbbf24" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
              <line x1="4" y1="22" x2="4" y2="15"></line>
            </svg>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });

      L.marker([correctLoc.lat, correctLoc.lng], {
        icon: correctMarker,
        zIndexOffset: 1000
      }).addTo(map);

      const bounds = L.latLngBounds([[correctLoc.lat, correctLoc.lng]]);
      let hasAnyGuess = false;

      geoStore.players.forEach((player) => {
        if (player.hasGuessed && player.lastGuess) {
          hasAnyGuess = true;
          const isMe = player.id === geoStore.socket?.id;
          const markerColor = isMe ? '#f43f5e' : '#3b82f6';

          const guessedMarker = L.divIcon({
            className: 'custom-guess-marker',
            html: `<div style="width: 14px; height: 14px; background: ${markerColor}; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 6px rgba(0,0,0,0.8);"></div>`,
            iconSize: [14, 14],
            iconAnchor: [7, 7]
          });

          L.marker([player.lastGuess.lat, player.lastGuess.lng], {
            icon: guessedMarker,
            zIndexOffset: isMe ? 100 : 0
          })
            .bindTooltip(`<b>${player.name}</b>`, {
              direction: 'top',
              offset: [0, -10],
              permanent: true,
              className: 'player-tooltip'
            })
            .addTo(map);

          L.polyline(
            [
              [correctLoc.lat, correctLoc.lng],
              [player.lastGuess.lat, player.lastGuess.lng]
            ],
            {
              color: markerColor,
              dashArray: '5, 5',
              weight: isMe ? 4 : 2,
              opacity: isMe ? 1 : 0.6
            }
          ).addTo(map);

          bounds.extend([player.lastGuess.lat, player.lastGuess.lng]);
        }
      });

      setTimeout(() => {
        try {
          map.invalidateSize();
          if (hasAnyGuess && bounds.isValid()) {
            map.fitBounds(bounds, { padding: [40, 40], maxZoom: 8 });
          } else {
            map.setView([correctLoc.lat, correctLoc.lng], 4);
          }
        } catch (err: unknown) {
          console.error(err);
        }
      }, 200);
    }
  } catch (err: unknown) {
    console.error(err);
    addToast(t('error.connectionFailed'), 'error');
  }

  try {
    timerInterval = setInterval(() => {
      try {
        timeLeft.value--;
        if (timeLeft.value <= 0) {
          if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
          }
          if (geoStore.isHost) {
            geoStore.nextRound();
          }
        }
      } catch (err: unknown) {
        console.error(err);
      }
    }, 1000);
  } catch (err: unknown) {
    console.error(err);
  }
});

onBeforeUnmount(() => {
  try {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    if (mapInstance) {
      mapInstance.remove();
      mapInstance = null;
    }
  } catch (err: unknown) {
    console.error(err);
  }
});
</script>

<style scoped lang="scss">
.round-result-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.1), transparent 40%),
    linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(2, 6, 23, 0.98) 100%);
  backdrop-filter: blur(8px);
  z-index: 1050;
  padding: 1rem;
  box-sizing: border-box;
  overflow-y: auto;
  overflow-x: hidden;
}

.result-modal {
  width: 100%;
  max-width: 650px;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  position: relative;
  z-index: 1;
  margin: auto;
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
  padding: 8px;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
  box-sizing: border-box;
}

.result-map {
  width: 100%;
  height: 320px;
  border-radius: 20px;
  background: #0f172a;

  :deep(.player-tooltip) {
    background: rgba(15, 23, 42, 0.85) !important;
    color: #f8fafc !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    border-radius: 6px !important;
    font-size: 0.8rem !important;
    padding: 3px 8px !important;
    backdrop-filter: blur(4px) !important;
    font-family: 'Inter', sans-serif !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5) !important;
  }

  :deep(.leaflet-tooltip-top:before) {
    border-top-color: rgba(15, 23, 42, 0.85) !important;
  }
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
  &.distance-icon {
    color: #3b82f6;
  }
  &.points-icon {
    color: #f59e0b;
  }
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

@media (max-width: 768px) {
  .result-modal {
    gap: 1.5rem;
  }

  .section-title {
    font-size: 1.8rem;
  }

  .result-map {
    height: 200px;
  }

  .result-stats {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .stat-box {
    padding: 1rem;
  }

  .btn {
    padding: 1rem 1.5rem;
    font-size: 1rem;
  }
}
</style>
