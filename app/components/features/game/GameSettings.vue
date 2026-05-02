<template>
  <div class="game-setup-section">
    <div class="section-title">{{ t('game.ui.gameSetup') }}</div>

    <div class="settings-grid">
      <div class="setup-group">
        <label for="mapSelect">{{ t('game.ui.selectMap') }}</label>
        <select
          id="mapSelect"
          v-model="geoStore.selectedMap"
          class="game-select"
          :disabled="disabled">
          <option value="world">{{ t('game.maps.world') }}</option>
          <option value="europe">{{ t('game.maps.europe') }}</option>
          <option value="asia">{{ t('game.maps.asia') }}</option>
        </select>
      </div>

      <div class="setup-group">
        <label for="modeSelect">{{ t('game.ui.selectMode') }}</label>
        <select
          id="modeSelect"
          v-model="geoStore.selectedMode"
          class="game-select"
          :disabled="disabled">
          <option value="timeLimit">{{ t('game.modes.timeLimit') }}</option>
          <option value="distanceLimit">{{ t('game.modes.distanceLimit') }}</option>
          <option value="elimination">{{ t('game.modes.elimination') }}</option>
        </select>
      </div>

      <div class="setup-group">
        <label for="roundSelect">{{ t('game.ui.rounds') }}</label>
        <select
          id="roundSelect"
          v-model="geoStore.maxRounds"
          class="game-select"
          :disabled="disabled">
          <option :value="3">3 {{ t('game.ui.rounds') }}</option>
          <option :value="5">5 {{ t('game.ui.rounds') }}</option>
          <option :value="10">10 {{ t('game.ui.rounds') }}</option>
        </select>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useGeoStore } from '~/stores/geoGame';
import { useI18n } from 'vue-i18n';

defineProps<{
  disabled?: boolean;
}>();

const { t } = useI18n();
const geoStore = useGeoStore();
</script>

<style scoped lang="scss">
.game-setup-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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

.settings-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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
  appearance: none;
  background-image: url('data:image/svg+xml;charset=US-ASCII,<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 7.5L10 12.5L15 7.5" stroke="%2394a3b8" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/></svg>');
  background-repeat: no-repeat;
  background-position: right 1.2rem center;
  background-size: 1.2em;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
    background: rgba(0, 0, 0, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  option {
    background: #1e293b;
    color: #f8fafc;
    padding: 0.5rem;
  }
}
</style>
