<template>
  <div class="game-menu-container">
    <Icon name="ph:globe-hemisphere-east-duotone" class="panel-background-logo" />

    <div class="menu-panel">
      <div class="lobby-controls">
        <div class="section-title">{{ t('game.ui.lobbyControls') }}</div>

        <div class="setup-group">
          <label for="usernameInput">{{ t('game.ui.username') }}</label>
          <input
            id="usernameInput"
            v-model="localUsername"
            class="game-input"
            :placeholder="t('game.ui.usernamePlaceholder')"
            :disabled="isLoading" />
        </div>

        <button
          class="btn primary-btn singleplayer-btn"
          :disabled="isLoading"
          @click="handleSingleplayer">
          <Icon v-if="isLoading" name="svg-spinners:ring-resize" />
          <Icon v-else name="ph:user-bold" />
          {{ t('game.actions.singlePlayer') }}
        </button>

        <div class="multiplayer-buttons">
          <button class="btn secondary-btn create-btn" :disabled="isLoading" @click="handleCreate">
            <Icon v-if="isLoading" name="svg-spinners:ring-resize" />
            <Icon v-else name="ph:plus-circle-bold" />
            {{ t('game.actions.createLobby') }}
          </button>
          <button class="btn secondary-btn join-btn" :disabled="isLoading" @click="handleJoin">
            <Icon v-if="isLoading" name="svg-spinners:ring-resize" />
            <Icon v-else name="ph:users-three-bold" />
            {{ t('game.actions.joinLobby') }}
          </button>
        </div>
      </div>

      <div class="game-setup-wrapper">
        <GameSettings :disabled="isLoading" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useGeoStore } from '~/stores/geoGame';
import { useToast } from '~/composables/useToast';
import GameSettings from '~/components/features/game/GameSettings.vue';

const { t } = useI18n();
const router = useRouter();
const geoStore = useGeoStore();
const { addToast } = useToast();

const localUsername = ref<string>('');
const isLoading = ref<boolean>(false);

const saveSettingsToStorage = (): void => {
  sessionStorage.setItem('ranzagg_map', geoStore.selectedMap);
  sessionStorage.setItem('ranzagg_gamemode', geoStore.selectedMode);
  sessionStorage.setItem('ranzagg_rounds', geoStore.maxRounds.toString());
};

const handleSingleplayer = (): void => {
  if (isLoading.value) return;
  isLoading.value = true;
  const username = localUsername.value.trim() || t('game.ui.you');
  sessionStorage.setItem('ranzagg_username', username);
  sessionStorage.setItem('ranzagg_mode', 'single');
  saveSettingsToStorage();

  geoStore.createRoom(username);

  const unwatch = watch(
    () => geoStore.roomId,
    (newId) => {
      if (newId) {
        setTimeout(() => {
          geoStore.startGame();
          router.push(`/game/${newId}`);
          unwatch();
          isLoading.value = false;
        }, 500);
      }
    }
  );
};

const handleCreate = (): void => {
  if (isLoading.value) return;
  const username = localUsername.value.trim();
  if (!username) {
    addToast(t('error.missingUsername'), 'warning');
    return;
  }
  isLoading.value = true;
  sessionStorage.setItem('ranzagg_username', username);
  sessionStorage.setItem('ranzagg_mode', 'multi');
  saveSettingsToStorage();

  geoStore.createRoom(username);

  const unwatch = watch(
    () => geoStore.roomId,
    (newId) => {
      if (newId) {
        router.push(`/lobby/${newId}`);
        unwatch();
        isLoading.value = false;
      }
    }
  );
};

const handleJoin = (): void => {
  if (isLoading.value) return;
  const username = localUsername.value.trim();
  if (!username) {
    addToast(t('error.missingUsername'), 'warning');
    return;
  }
  const roomId = prompt(t('game.actions.joinLobbyPrompt'));
  if (roomId?.trim()) {
    isLoading.value = true;
    const cleanRoomId = roomId.trim().toUpperCase();
    sessionStorage.setItem('ranzagg_username', username);
    sessionStorage.setItem('ranzagg_mode', 'multi');
    geoStore.joinRoom(cleanRoomId, username);
    router.push(`/lobby/${cleanRoomId}`);
  }
};
</script>

<style scoped lang="scss">
.game-menu-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
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

.menu-panel {
  width: 100%;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  gap: 3rem;
  position: relative;
  z-index: 1;
  margin: auto 0;
}

.lobby-controls {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.game-setup-wrapper {
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.section-title {
  font-size: 1.1rem;
  color: #f8fafc;
  text-transform: uppercase;
  letter-spacing: 2px;
  font-weight: 800;
  margin-bottom: 0.5rem;
  border-left: 3px solid #4ade80;
  padding-left: 1rem;
}

.setup-group {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  label {
    font-size: 0.85rem;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-weight: 600;
  }
}

.game-input {
  width: 100%;
  background: rgba(15, 23, 42, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 1.2rem 1.5rem;
  color: #f8fafc;
  font-size: 1.05rem;
  font-family: inherit;
  transition: all 0.2s ease;
  box-sizing: border-box;
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
    background: rgba(0, 0, 0, 0.3);
  }
  &::placeholder {
    color: #475569;
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.multiplayer-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: none;
  border-radius: 9999px;
  padding: 1.2rem 2.5rem;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: inherit;
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none !important;
    box-shadow: none !important;
  }
  &.primary-btn {
    background: linear-gradient(135deg, #4ade80 0%, #3b82f6 100%);
    color: #020617;
    font-weight: 800;
    &:not(:disabled):hover {
      transform: translateY(-3px);
      box-shadow:
        0 10px 25px -5px rgba(74, 222, 128, 0.4),
        0 8px 10px -6px rgba(74, 222, 128, 0.1);
    }
    &:not(:disabled):active {
      transform: translateY(-1px);
    }
  }
  &.secondary-btn {
    background: rgba(30, 41, 59, 0.3);
    color: #f8fafc;
    border: 1px solid rgba(255, 255, 255, 0.08);
    &:not(:disabled):hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.2);
      transform: translateY(-3px);
      box-shadow: 0 8px 20px -6px rgba(0, 0, 0, 0.3);
    }
    &:not(:disabled):active {
      transform: translateY(-1px);
    }
  }
}

.singleplayer-btn {
  width: 100%;
}

.create-btn,
.join-btn {
  width: 100%;
  padding: 1rem 1.5rem;
  font-size: 1rem;
}

@media (max-width: 768px) {
  .game-menu-container {
    padding: 2rem 1rem;
    justify-content: flex-start;
  }

  .menu-panel {
    gap: 1.5rem;
    margin: 0;
  }

  .lobby-controls {
    gap: 1rem;
  }

  .game-setup-wrapper {
    padding-top: 1rem;
  }

  .multiplayer-buttons {
    grid-template-columns: 1fr;
  }

  .game-input {
    padding: 0.8rem 1.2rem;
  }
}
</style>
