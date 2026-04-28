<template>
  <div class="finished-container">
    <Icon name="ph:globe-hemisphere-east-duotone" class="panel-background-logo" />

    <div class="result-modal">
      <h2>{{ t('game.ui.gameFinished') }}</h2>

      <div class="leaderboard-section">
        <h3 class="section-subtitle">{{ t('game.ui.leaderboard') }}</h3>
        <div class="leaderboard-list">
          <div
            v-for="(player, index) in sortedPlayers"
            :key="player.id"
            class="leaderboard-item"
            :class="{ 'is-me': player.id === geoStore.socket?.id }">
            <span class="rank" :class="`rank-${index + 1}`">#{{ index + 1 }}</span>
            <span class="name">
              {{ player.name }}
              <span v-if="player.id === geoStore.socket?.id">({{ t('game.ui.you') }})</span>
            </span>
            <span class="score">{{ Math.round(player.score).toLocaleString() }} pt</span>
          </div>
        </div>
      </div>

      <div class="action-buttons">
        <button class="btn primary-btn return-btn" @click="emit('close')">
          <Icon name="ph:house-bold" />
          {{ t('game.actions.backToMenu') }}
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
  const players = geoStore.players || [];
  return [...players].sort((a, b) => b.score - a.score);
});
</script>

<style scoped lang="scss">
.finished-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(circle at top right, rgba(74, 222, 128, 0.15), transparent 40%),
    linear-gradient(135deg, rgba(2, 6, 23, 0.98) 0%, rgba(15, 23, 42, 0.95) 100%);
  backdrop-filter: blur(12px);
  z-index: 2000;
  padding: 1rem;
  box-sizing: border-box;
  overflow: hidden;
}

.panel-background-logo {
  position: absolute;
  font-size: 80vh;
  color: rgba(74, 222, 128, 0.03);
  top: 50%;
  right: -10%;
  transform: translateY(-50%) rotate(-15deg);
  z-index: 0;
  pointer-events: none;
}

.result-modal {
  width: 100%;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
  position: relative;
  z-index: 1;

  h2 {
    text-align: center;
    font-size: 3rem;
    margin: 0;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: -1px;
    background: linear-gradient(135deg, #4ade80 0%, #3b82f6 100%);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    filter: drop-shadow(0 10px 20px rgba(74, 222, 128, 0.2));
  }
}

.leaderboard-section {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;

  .section-subtitle {
    margin: 0;
    font-size: 0.9rem;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 2px;
    font-weight: 800;
    border-left: 3px solid #4ade80;
    padding-left: 1rem;
  }
}

.leaderboard-list {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  max-height: 50vh;
  overflow-y: auto;
  padding-right: 0.5rem;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
  }
}

.leaderboard-item {
  display: flex;
  align-items: center;
  background: rgba(30, 41, 59, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.05);
  padding: 1.2rem 1.5rem;
  border-radius: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &.is-me {
    background: rgba(74, 222, 128, 0.05);
    border-color: rgba(74, 222, 128, 0.2);
  }

  &:hover {
    background: rgba(255, 255, 255, 0.03);
    transform: translateX(10px);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .rank {
    font-weight: 900;
    min-width: 50px;
    font-size: 1.4rem;
    color: #475569;
    &.rank-1 {
      color: #fbbf24;
      font-size: 1.6rem;
    }
    &.rank-2 {
      color: #cbd5e1;
    }
    &.rank-3 {
      color: #92400e;
    }
  }

  .name {
    flex: 1;
    font-weight: 700;
    font-size: 1.1rem;
    color: #f8fafc;
    span {
      font-size: 0.75em;
      color: #64748b;
      margin-left: 8px;
      font-weight: 500;
      text-transform: uppercase;
    }
  }

  .score {
    font-weight: 900;
    color: #4ade80;
    font-size: 1.2rem;
  }
}

.action-buttons {
  margin-top: 1rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  border: none;
  border-radius: 9999px;
  padding: 1.2rem 2.5rem;
  font-size: 1.1rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: inherit;
  text-transform: uppercase;
  letter-spacing: 1px;
  width: 100%;

  &.primary-btn {
    background: linear-gradient(135deg, #4ade80 0%, #3b82f6 100%);
    color: #020617;
    &:hover {
      transform: translateY(-3px);
      box-shadow: 0 12px 30px -5px rgba(74, 222, 128, 0.4);
    }
    &:active {
      transform: translateY(-1px);
    }
  }
}
</style>
