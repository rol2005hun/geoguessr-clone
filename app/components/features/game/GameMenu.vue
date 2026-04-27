<template>
  <div class="game-menu-container">
    <div class="glass-panel menu-panel">
      <div class="lobby-controls">
        <button class="btn primary-btn create-btn" @click="emit('create')">
          <Icon name="ph:plus-circle-bold" />
          {{ t("game.actions.createLobby") }}
        </button>
        <button class="btn secondary-btn join-btn" @click="emit('join')">
          <Icon name="ph:users-three-bold" />
          {{ t("game.actions.joinLobby") }}
        </button>
      </div>

      <div class="game-setup">
        <div class="setup-group">
          <label for="mapSelect">{{ t("game.ui.selectMap") }}</label>
          <select id="mapSelect" v-model="localSelectedMap" class="game-select">
            <option value="world">{{ t("game.maps.world") }}</option>
            <option value="europe">{{ t("game.maps.europe") }}</option>
            <option value="asia">{{ t("game.maps.asia") }}</option>
          </select>
        </div>

        <div class="setup-group">
          <label for="modeSelect">{{ t("game.ui.selectMode") }}</label>
          <select id="modeSelect" v-model="localSelectedMode" class="game-select">
            <option value="timeLimit">{{ t("game.modes.timeLimit") }}</option>
            <option value="distanceLimit">{{ t("game.modes.distanceLimit") }}</option>
            <option value="elimination">{{ t("game.modes.elimination") }}</option>
          </select>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
  selectedMap: { type: String, required: true },
  selectedMode: { type: String, required: true }
});

const emit = defineEmits(['update:selectedMap', 'update:selectedMode', 'create', 'join']);

const localSelectedMap = ref(props.selectedMap);
const localSelectedMode = ref(props.selectedMode);

watch(localSelectedMap, (val) => emit('update:selectedMap', val));
watch(localSelectedMode, (val) => emit('update:selectedMode', val));
</script>

<style scoped lang="scss">
.game-menu-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  width: 100%;
  pointer-events: auto;
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
}

.lobby-controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.game-setup {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);

  .setup-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    label {
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #94a3b8;
    }
  }
}

.game-select {
  background: rgba(15, 23, 42, 0.9);
  color: #f8fafc;
  border: 1px solid rgba(255, 255, 255, 0.15);
  padding: 1rem 1.25rem;
  border-radius: 12px;
  outline: none;
  font-size: 1.05rem;
  font-weight: 500;
  transition: all 0.3s ease;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  background-size: 1em;

  &:hover, &:focus {
    border-color: #38bdf8;
    box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.2);
  }
  
  option {
    background: #1e293b;
    color: #fff;
    padding: 1rem;
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

  &.primary-btn {
    background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
    color: #fff;
    box-shadow: 0 4px 15px rgba(14, 165, 233, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.1);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(14, 165, 233, 0.6);
      background: linear-gradient(135deg, #38bdf8 0%, #0369a1 100%);
    }
  }

  &.secondary-btn {
    background: rgba(255, 255, 255, 0.05);
    color: #f8fafc;
    border: 1px solid rgba(255, 255, 255, 0.2);

    &:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.3);
      transform: translateY(-2px);
    }
  }
}

@keyframes floatPanel {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@media (max-width: 768px) {
  .game-menu-container {
    padding: 1rem;
  }
}
</style>