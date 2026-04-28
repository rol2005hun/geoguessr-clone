<template>
  <div class="finished-container">
    <div class="result-modal glass-panel">
      <h2>{{ t("game.ui.gameFinished") || "Game Finished!" }}</h2>
      
      <div class="leaderboard-section">
        <h3>Lebegőtábla</h3>
        <div class="leaderboard-list">
           <div class="leaderboard-item" v-for="(player, index) in sortedPlayers" :key="player.id">
              <span class="rank" :class="`rank-${index + 1}`">#{{ index + 1 }}</span>
              <span class="name">{{ player.name }} <span v-if="player.id === geoStore.socket?.id">(Te)</span></span>
              <span class="score">{{ Math.round(player.score).toLocaleString() }} pt</span>
           </div>
        </div>
      </div>

      <div class="action-buttons">
        <button class="btn primary-btn return-btn" @click="emit('close')">
          Bezárás
          <Icon name="ph:x-bold" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGeoStore } from '~/stores/geoGame';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const geoStore = useGeoStore();
const emit = defineEmits(['close']);

const sortedPlayers = computed(() => {
   return [...geoStore.players].sort((a, b) => b.score - a.score);
});
</script>

<style scoped lang="scss">
.leaderboard-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  margin-top: 1rem;
}

.leaderboard-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
  max-width: 400px;
  max-height: 40vh;
  overflow-y: auto;
}

.leaderboard-item {
  display: flex;
  align-items: center;
  background: rgba(255,255,255,0.05);
  padding: 1rem;
  border-radius: 12px;
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.1);
  
  .rank {
    font-weight: 800;
    font-size: 1.25rem;
    width: 40px;
    color: #94a3b8;
  }
  .rank-1 { color: #fbbf24; }
  .rank-2 { color: #e2e8f0; }
  .rank-3 { color: #b45309; }

  .name {
    flex: 1;
    font-weight: 600;
    font-size: 1.1rem;
    text-align: left;
  }

  .score {
    font-weight: 800;
    font-size: 1.2rem;
    color: #38bdf8;
  }
}

.finished-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(12px);
  pointer-events: auto;
}

.result-modal {
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 24px;
  padding: 4rem;
  width: 90%;
  max-width: 600px;
  text-align: center;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
  animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1);

  h2 {
    font-size: 2.8rem;
    font-weight: 800;
    margin: 0 0 3rem 0;
    background: linear-gradient(to right, #34d399, #38bdf8);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
}

.final-score-section {
  display: flex;
  justify-content: center;
  margin-bottom: 4rem;

  .score-circle {
    width: 250px;
    height: 250px;
    border-radius: 50%;
    background: radial-gradient(circle at center, rgba(56, 189, 248, 0.1) 0%, rgba(15, 23, 42, 0.5) 100%);
    border: 4px solid #38bdf8;
    box-shadow: 0 0 30px rgba(56, 189, 248, 0.3), inset 0 0 30px rgba(56, 189, 248, 0.3);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    
    .score-label {
      font-size: 1.1rem;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #94a3b8;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }

    .score-value {
      font-size: 4rem;
      font-weight: 900;
      color: #f8fafc;
      line-height: 1.1;
      text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
    }

    .max-score {
      font-size: 1.2rem;
      color: #64748b;
      margin-top: 0.5rem;
      font-weight: 500;
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
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(16, 185, 129, 0.6);
        background: linear-gradient(135deg, #34d399 0%, #059669 100%);
      }
    }
  }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(40px); scale: 0.95; }
  to { opacity: 1; transform: translateY(0); scale: 1; }
}
</style>
