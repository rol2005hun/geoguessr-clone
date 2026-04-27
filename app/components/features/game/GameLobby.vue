<template>
  <div class="game-lobby-container">
    <div class="glass-panel menu-panel lobby-panel">
      <h2 class="section-title">{{ t("game.ui.lobbyTitle") }}</h2>
      <div class="lobby-code-box">
        <span class="label">{{ t("game.ui.lobbyId") }}:</span>
        <span class="code">{{ geoStore.roomId }}</span>
      </div>
      
      <div class="player-list">
        <h3 class="list-title">{{ t("game.ui.players") }} <span class="count">({{ geoStore.players.length }}/8)</span></h3>
        <ul class="players">
          <li v-for="player in geoStore.players" :key="player.id" class="player-item">
            <div class="avatar">
              <Icon name="ph:user-circle-duotone" />
            </div>
            <span class="name">{{ player.name }}</span>
          </li>
        </ul>
      </div>

      <button class="btn primary-btn start-btn" @click="emit('start')">
        <Icon name="ph:play-circle-bold" />
        {{ t("game.actions.startGame") }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useGeoStore } from '~/stores/geoGame';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const geoStore = useGeoStore();

const emit = defineEmits(['start']);
</script>

<style scoped lang="scss">
.game-lobby-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  width: 100%;
}

.glass-panel {
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 2.5rem;
  box-shadow: 0 30px 60px -15px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  gap: 2rem;
  width: 100%;
  max-width: 480px;
  animation: floatPanel 6s ease-in-out infinite;

  .section-title {
    margin: 0;
    font-size: 1.8rem;
    font-weight: 700;
    text-align: center;
    color: #f8fafc;
  }
}

.lobby-panel {
  .lobby-code-box {
    background: rgba(0, 0, 0, 0.4);
    padding: 1.2rem;
    border-radius: 12px;
    border: 1px dashed rgba(56, 189, 248, 0.3);
    display: flex;
    justify-content: space-between;
    align-items: center;

    .label {
      color: #94a3b8;
      font-size: 0.9rem;
      text-transform: uppercase;
    }
    .code {
      font-size: 1.5rem;
      font-weight: 800;
      letter-spacing: 4px;
      color: #38bdf8;
      text-shadow: 0 0 10px rgba(56, 189, 248, 0.4);
    }
  }

  .player-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;

    .list-title {
      margin: 0;
      font-size: 1.1rem;
      color: #cbd5e1;
      display: flex;
      justify-content: space-between;

      .count {
        color: #64748b;
        font-size: 0.9rem;
      }
    }

    ul.players {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-height: 200px;
      overflow-y: auto;

      .player-item {
        background: rgba(255, 255, 255, 0.05);
        padding: 0.75rem 1rem;
        border-radius: 10px;
        display: flex;
        align-items: center;
        gap: 1rem;
        transition: background 0.2s;

        &:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .avatar {
          font-size: 1.8rem;
          color: #cbd5e1;
        }

        .name {
          font-size: 1.1rem;
          font-weight: 500;
        }
      }
    }
  }
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.start-btn {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: #fff;
  box-shadow: 0 4px 15px rgba(34, 197, 94, 0.4);
  margin-top: 1rem;

  &:hover {
    box-shadow: 0 8px 25px rgba(34, 197, 94, 0.6);
    background: linear-gradient(135deg, #4ade80 0%, #15803d 100%);
    transform: translateY(-2px);
  }
}

@keyframes floatPanel {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@media (max-width: 768px) {
  .game-lobby-container {
    padding: 1rem;
  }
}
</style>