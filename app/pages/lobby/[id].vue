<template>
  <div class="game-lobby-container">
    <Icon name="ph:globe-hemisphere-east-duotone" class="panel-background-logo" />

    <div class="lobby-panel" :class="{ 'is-host': geoStore.isHost }">
      <div class="lobby-main">
        <div class="lobby-header">
        <button class="back-btn" @click="handleLeaveLobby">
          <Icon name="ph:arrow-left-bold" />
          {{ t('game.actions.backToMenu') }}
        </button>
        <h2 class="section-title">{{ t('game.ui.lobbyTitle') }}</h2>
      </div>

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
            <span v-if="player.isHost" class="host-badge">HOST</span>
          </li>
        </ul>
      </div>

        <button
          v-if="geoStore.isHost"
          class="btn primary-btn start-btn"
          :disabled="isLoading"
          @click="handleStartGame">
          <Icon v-if="isLoading" name="svg-spinners:ring-resize" />
          <Icon v-else name="ph:play-circle-bold" />
          {{ t('game.actions.startGame') }}
        </button>
      </div>

      <div v-if="geoStore.isHost" class="lobby-settings-wrapper">
        <div class="lobby-settings-area">
          <GameSettings :disabled="isLoading" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useGeoStore } from '~/stores/geoGame';
import { useI18n } from 'vue-i18n';
import { useToast } from '~/composables/useToast';
import GameSettings from '~/components/features/game/GameSettings.vue';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const geoStore = useGeoStore();
const { addToast } = useToast();

const isLoading = ref<boolean>(false);

const currentRoomId = computed<string>(() => {
  const id = route.params.id as string | string[] | undefined;
  const idStr = Array.isArray(id) ? id[0] : id;
  return (idStr ?? '').toUpperCase();
});

const handleStartGame = (): void => {
  if (isLoading.value) return;
  isLoading.value = true;
  geoStore.startGame();
};

const handleLeaveLobby = (): void => {
  geoStore.resetRoomState();
  router.push('/');
};

watch(
  () => geoStore.status,
  (newStatus: string) => {
    if (newStatus === 'playing') {
      isLoading.value = false;
      router.push(`/game/${currentRoomId.value}`);
    }
  },
  { immediate: true }
);

onMounted((): void => {
  try {
    if (!geoStore.socket) {
      geoStore.initSocket();
    }

    if (geoStore.roomId !== currentRoomId.value) {
      let savedUsername = sessionStorage.getItem('ranzagg_username');
      const mode = sessionStorage.getItem('ranzagg_mode');

      if (!savedUsername) {
        if (mode === 'single') {
          savedUsername = t('game.ui.you');
          sessionStorage.setItem('ranzagg_username', savedUsername);
        } else {
          const prompted = prompt(t('game.ui.enterUsername'));
          if (prompted && prompted.trim()) {
            savedUsername = prompted.trim();
            sessionStorage.setItem('ranzagg_username', savedUsername);
          } else {
            addToast(t('error.missingUsername'), 'warning');
            router.push('/');
            return;
          }
        }
      }

      if (savedUsername) {
        geoStore.joinRoom(currentRoomId.value, savedUsername);

        if (mode === 'single') {
          const unwatch = watch(
            () => geoStore.status,
            (status: string) => {
              if (status === 'lobby' && geoStore.isHost) {
                geoStore.startGame();
                unwatch();
              }
            },
            { immediate: true }
          );
        }
      }
    }
  } catch (err: unknown) {
    console.error('Error in lobby mount:', err);
    addToast(t('error.joinLobby'), 'error');
    router.push('/');
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
  z-index: 1000;
  padding: 2rem 1rem;
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
  gap: 2rem;
  position: relative;
  z-index: 1;
  margin: auto;

  &.is-host {
    @media (min-width: 900px) {
      max-width: 1000px;
      flex-direction: row;
      align-items: flex-start;
      gap: 4rem;
    }
  }
}

.lobby-main {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  flex: 1;
}

.lobby-settings-wrapper {
  flex: 1;

  @media (min-width: 900px) {
    border-left: 1px solid rgba(255, 255, 255, 0.05);
    padding-left: 4rem;
  }
}

.lobby-header {
  display: flex;
  justify-content: space-between;
}

.back-btn {
  background: rgba(30, 41, 59, 0.5);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #e2e8f0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 0.6rem 1rem;
  border-radius: 999px;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 1px;

  &:hover {
    color: #f8fafc;
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateX(-4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
}

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
    max-height: 30vh;
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

.lobby-settings-area {
  background: rgba(15, 23, 42, 0.2);
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.host-badge {
  font-size: 0.65rem;
  background: #3b82f6;
  color: white;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-weight: 900;
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

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none !important;
    box-shadow: none !important;
  }

  &.primary-btn {
    background: linear-gradient(135deg, #4ade80 0%, #3b82f6 100%);
    color: #020617;

    &:not(:disabled):hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 25px -5px rgba(74, 222, 128, 0.4);
    }
    &:not(:disabled):active {
      transform: translateY(-1px);
    }
  }
}

.start-btn {
  width: 100%;
}

@media (max-width: 768px) {
  .game-lobby-container {
    padding: 1.5rem 1rem;
    justify-content: flex-start;
  }

  .lobby-panel {
    gap: 1.2rem;
    margin: 0;

    .section-title {
      font-size: 2rem;
    }
  }

  .lobby-code-box {
    padding: 0.8rem 1.2rem;
    .code {
      font-size: 1.4rem;
    }
  }

  .player-list .players {
    grid-template-columns: 1fr;
    max-height: 25vh;
  }
}
</style>
