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
            :placeholder="t('game.ui.usernamePlaceholder')" />
        </div>

        <button class="btn primary-btn singleplayer-btn" @click="handleSingleplayer">
          <Icon name="ph:user-bold" />
          {{ t('game.actions.singlePlayer') }}
        </button>

        <div class="multiplayer-buttons">
          <button class="btn secondary-btn create-btn" @click="handleCreate">
            <Icon name="ph:plus-circle-bold" />
            {{ t('game.actions.createLobby') }}
          </button>
          <button class="btn secondary-btn join-btn" @click="handleJoin">
            <Icon name="ph:users-three-bold" />
            {{ t('game.actions.joinLobby') }}
          </button>
        </div>
      </div>

      <div class="game-setup">
        <div class="section-title">{{ t('game.ui.gameSetup') }}</div>
        <div class="setup-group">
          <label for="mapSelect">{{ t('game.ui.selectMap') }}</label>
          <select id="mapSelect" v-model="localSelectedMap" class="game-select">
            <option value="world">{{ t('game.maps.world') }}</option>
            <option value="europe">{{ t('game.maps.europe') }}</option>
            <option value="asia">{{ t('game.maps.asia') }}</option>
          </select>
        </div>

        <div class="setup-group">
          <label for="modeSelect">{{ t('game.ui.selectMode') }}</label>
          <select id="modeSelect" v-model="localSelectedMode" class="game-select">
            <option value="timeLimit">{{ t('game.modes.timeLimit') }}</option>
            <option value="distanceLimit">{{ t('game.modes.distanceLimit') }}</option>
            <option value="elimination">{{ t('game.modes.elimination') }}</option>
          </select>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useGeoStore } from '~/stores/geoGame';

const { t } = useI18n();
const router = useRouter();
const geoStore = useGeoStore();

const localSelectedMap = ref<string>('world');
const localSelectedMode = ref<string>('timeLimit');
const localUsername = ref<string>('');

const saveSettings = (): void => {
  sessionStorage.setItem('ranzagg_map', localSelectedMap.value);
  sessionStorage.setItem('ranzagg_gamemode', localSelectedMode.value);
};

const handleSingleplayer = (): void => {
  const username = localUsername.value.trim() || t('game.ui.you');
  sessionStorage.setItem('ranzagg_username', username);
  sessionStorage.setItem('ranzagg_mode', 'single');
  saveSettings();

  geoStore.createRoom(username);

  const unwatch = watch(
    () => geoStore.status,
    (status: string) => {
      if (status === 'lobby' && geoStore.isHost && geoStore.roomId) {
        geoStore.startGame();
        router.push(`/game/${geoStore.roomId}`);
        unwatch();
      }
    }
  );
};

const handleCreate = (): void => {
  const username = localUsername.value.trim();
  if (!username) {
    alert(t('game.ui.enterUsername'));
    return;
  }

  sessionStorage.setItem('ranzagg_username', username);
  sessionStorage.setItem('ranzagg_mode', 'multi');
  saveSettings();

  geoStore.createRoom(username);
  if (geoStore.roomId) {
    router.push(`/lobby/${geoStore.roomId}`);
  }
};

const handleJoin = (): void => {
  const username = localUsername.value.trim();
  if (!username) {
    alert(t('game.ui.enterUsername'));
    return;
  }

  const roomId = prompt(t('game.actions.joinLobbyPrompt'));
  if (roomId?.trim()) {
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

.menu-panel {
  width: 100%;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  gap: 3rem;
  position: relative;
  z-index: 1;
  margin: auto;
}

.lobby-controls,
.game-setup {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.multiplayer-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.game-setup {
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

.game-input,
.game-select {
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
}

.game-select {
  appearance: none;
  background-image: url('data:image/svg+xml;charset=US-ASCII,<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 7.5L10 12.5L15 7.5" stroke="%2394a3b8" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/></svg>');
  background-repeat: no-repeat;
  background-position: right 1.2rem center;
  background-size: 1.2em;
  cursor: pointer;

  option {
    background: #1e293b;
    color: #f8fafc;
    padding: 0.5rem;
  }
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

  &.primary-btn {
    background: linear-gradient(135deg, #4ade80 0%, #3b82f6 100%);
    color: #020617;
    font-weight: 800;

    &:hover {
      transform: translateY(-3px);
      box-shadow:
        0 10px 25px -5px rgba(74, 222, 128, 0.4),
        0 8px 10px -6px rgba(74, 222, 128, 0.1);
    }

    &:active {
      transform: translateY(-1px);
    }
  }

  &.secondary-btn {
    background: rgba(30, 41, 59, 0.3);
    color: #f8fafc;
    border: 1px solid rgba(255, 255, 255, 0.08);

    &:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.2);
      transform: translateY(-3px);
      box-shadow: 0 8px 20px -6px rgba(0, 0, 0, 0.3);
    }

    &:active {
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
    padding: 6rem 1rem 2rem 1rem;
    align-items: flex-start;
  }

  .panel-background-logo {
    display: none;
  }

  .menu-panel {
    gap: 2rem;
  }

  .lobby-controls,
  .game-setup {
    gap: 1rem;
  }

  .multiplayer-buttons {
    grid-template-columns: 1fr;
  }

  .game-input,
  .game-select {
    padding: 1rem 1.2rem;
    font-size: 1rem;
  }

  .btn {
    padding: 1rem 1.5rem;
    font-size: 1rem;
  }
}

@media (max-height: 700px) {
  .game-menu-container {
    align-items: flex-start;
    padding-top: 5rem;
  }

  .menu-panel {
    margin-top: 1rem;
    margin-bottom: 2rem;
  }
}
</style>
