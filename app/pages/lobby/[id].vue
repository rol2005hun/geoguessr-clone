<template>
  <div class="game-lobby-container">
    <Icon name="ph:globe-hemisphere-east-duotone" class="panel-background-logo" />

    <div class="lobby-panel">
      <h2 class="section-title">{{ t('game.ui.lobbyTitle') }}</h2>

      <div class="lobby-code-box">
        <span class="label">{{ t('game.ui.lobbyId') }}</span>
        <span class="code">{{ currentRoomId }}</span>
      </div>

      <div class="player-list">
        <h3 class="list-title">
          {{ t('game.ui.players') }}
          <span class="count">{{ (geoStore.players || []).length }} / 8</span>
        </h3>

        <ul class="players">
          <li v-for="player in geoStore.players || []" :key="player.id" class="player-item">
            <div class="avatar">
              <Icon name="ph:user-circle-duotone" />
            </div>
            <span class="name">{{ player.name }}</span>
          </li>
        </ul>
      </div>

      <button v-if="geoStore.isHost" class="btn primary-btn start-btn" @click="handleStartGame">
        <Icon name="ph:play-circle-bold" />
        {{ t('game.actions.startGame') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useGeoStore } from '~/stores/geoGame';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const geoStore = useGeoStore();

const currentRoomId = computed<string>(() => {
  const id = route.params.id as string | string[] | undefined;
  const idStr = Array.isArray(id) ? id[0] : id;
  return (idStr ?? '').toUpperCase();
});

const handleStartGame = (): void => {
  geoStore.startGame();
};

watch(
  () => geoStore.status,
  (newStatus: string) => {
    if (newStatus === 'playing') {
      router.push(`/game/${currentRoomId.value}`);
    }
  },
  { immediate: true }
);

onMounted((): void => {
  if (!geoStore.socket) {
    geoStore.initSocket();
  }

  if (geoStore.roomId !== currentRoomId.value) {
    let savedUsername = sessionStorage.getItem('ranzagg_username');
    const mode = sessionStorage.getItem('ranzagg_mode');

    if (!savedUsername) {
      if (mode === 'single') {
        savedUsername = 'Solo Player';
        sessionStorage.setItem('ranzagg_username', savedUsername);
      } else {
        const prompted = prompt(t('game.ui.enterUsername'));
        if (prompted && prompted.trim()) {
          savedUsername = prompted.trim();
          sessionStorage.setItem('ranzagg_username', savedUsername);
        } else {
          router.push('/');
          return;
        }
      }
    }

    if (savedUsername) {
      geoStore.joinRoom(currentRoomId.value, savedUsername);

      if (mode === 'single') {
        const unwatch = watch(
          () => geoStore.isHost,
          (isHost: boolean) => {
            if (isHost) {
              geoStore.startGame();
              unwatch();
            }
          },
          { immediate: true }
        );
      }
    }
  }
});
</script>

<style scoped lang="scss">
.game-lobby-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
  box-sizing: border-box;
  overflow-y: auto;
  overflow-x: hidden;
}

.panel-background-logo {
  position: fixed;
  font-size: 80vh;
  color: rgba(74, 222, 128, 0.04);
  top: 50%;
  right: -10%;
  transform: translateY(-50%) rotate(-15deg);
  z-index: 0;
  pointer-events: none;
}

.lobby-panel {
  width: 100%;
  max-width: 520px;
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
  position: relative;
  z-index: 1;
  margin: auto;

  .section-title {
    text-align: center;
    font-size: 2.5rem;
    margin: 0;
    font-weight: 800;
    background: linear-gradient(135deg, #4ade80 0%, #3b82f6 100%);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    text-transform: uppercase;
    letter-spacing: 2px;
  }
}

.lobby-code-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(15, 23, 42, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.05);
  padding: 1.2rem 1.8rem;
  border-radius: 16px;

  .label {
    font-size: 0.9rem;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    font-weight: 700;
  }

  .code {
    font-family: 'Courier New', Courier, monospace;
    font-size: 1.8rem;
    font-weight: 800;
    color: #f8fafc;
    letter-spacing: 4px;
    background: rgba(74, 222, 128, 0.1);
    padding: 0.5rem 1.2rem;
    border-radius: 8px;
    border: 1px solid rgba(74, 222, 128, 0.2);
  }
}

.player-list {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;

  .list-title {
    margin: 0;
    font-size: 0.9rem;
    color: #f8fafc;
    text-transform: uppercase;
    letter-spacing: 2px;
    font-weight: 800;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-left: 4px solid #3b82f6;
    padding-left: 1rem;

    .count {
      color: #3b82f6;
      font-weight: 800;
      background: rgba(59, 130, 246, 0.1);
      padding: 0.4rem 1rem;
      border-radius: 999px;
      font-size: 0.8rem;
    }
  }

  .players {
    list-style: none;
    padding: 0.5rem;
    margin: -0.5rem;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 1rem;
    max-height: 40vh;
    overflow-y: auto;

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
}

.player-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: rgba(15, 23, 42, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.05);
  padding: 1rem;
  border-radius: 12px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    background: rgba(255, 255, 255, 0.03);
    border-color: rgba(255, 255, 255, 0.1);
    transform: translateY(-3px);
  }

  .avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    color: #3b82f6;
    background: rgba(59, 130, 246, 0.1);
    width: 40px;
    height: 40px;
    border-radius: 50%;
  }

  .name {
    font-weight: 600;
    font-size: 1.05rem;
    color: #e2e8f0;
  }
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

  &.primary-btn {
    background: linear-gradient(135deg, #4ade80 0%, #3b82f6 100%);
    color: #020617;

    &:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 25px -5px rgba(74, 222, 128, 0.4);
    }

    &:active {
      transform: translateY(-1px);
    }
  }
}

.start-btn {
  width: 100%;
  margin-top: 1rem;
}

@media (max-width: 768px) {
  .game-lobby-container {
    padding: 6rem 1rem 2rem 1rem;
    align-items: flex-start;
  }

  .panel-background-logo {
    display: none;
  }

  .lobby-panel {
    gap: 1.5rem;

    .section-title {
      font-size: 2rem;
    }
  }

  .lobby-code-box {
    padding: 1rem 1.2rem;

    .code {
      font-size: 1.4rem;
    }
  }

  .player-list .players {
    grid-template-columns: 1fr;
  }
}

@media (max-height: 700px) {
  .game-lobby-container {
    align-items: flex-start;
    padding-top: 5rem;
  }

  .lobby-panel {
    margin-top: 1rem;
    margin-bottom: 2rem;
  }
}
</style>
