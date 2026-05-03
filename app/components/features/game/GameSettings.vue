<template>
  <div class="game-setup-section">
    <div class="section-title">{{ t('game.ui.gameSetup') }}</div>

    <div class="settings-grid">
      <div class="setup-group">
        <MultiSelect
          v-model="geoStore.selectedContinents"
          :options="availableContinents"
          :label="t('game.ui.selectContinents')"
          :placeholder="t('game.ui.allContinents')"
          :disabled="disabled" />
      </div>

      <div class="setup-group">
        <MultiSelect
          v-model="geoStore.selectedCountries"
          :options="availableCountries"
          :label="t('game.ui.selectCountries')"
          :placeholder="t('game.ui.allCountries')"
          :disabled="disabled" />
      </div>

      <div class="setup-group">
        <MultiSelect
          v-model="geoStore.selectedCities"
          :options="availableCities"
          :label="t('game.ui.selectCities')"
          :placeholder="t('game.ui.allCities')"
          :disabled="disabled" />
      </div>

      <div class="setup-group">
        <label for="modeSelect">{{ t('game.ui.selectMode') }}</label>
        <div class="select-wrapper">
          <select
            id="modeSelect"
            v-model="geoStore.selectedMode"
            class="game-select"
            :disabled="disabled"
            @change="blurSelect">
            <option value="timeLimit">{{ t('game.modes.timeLimit') }}</option>
            <option value="distanceLimit">{{ t('game.modes.distanceLimit') }}</option>
            <option value="elimination">{{ t('game.modes.elimination') }}</option>
          </select>
          <Icon name="ph:caret-down-bold" class="select-arrow" />
        </div>
      </div>

      <div class="setup-group">
        <label for="roundSelect">{{ t('game.ui.rounds') }}</label>
        <div class="select-wrapper">
          <select
            id="roundSelect"
            v-model="geoStore.maxRounds"
            class="game-select"
            :disabled="disabled"
            @change="blurSelect">
            <option :value="3">3 {{ t('game.ui.rounds') }}</option>
            <option :value="5">5 {{ t('game.ui.rounds') }}</option>
            <option :value="10">10 {{ t('game.ui.rounds') }}</option>
          </select>
          <Icon name="ph:caret-down-bold" class="select-arrow" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  disabled?: boolean;
}>();

const { t } = useI18n();
const geoStore = useGeoStore();

interface RegionInfo {
  continent: string;
  country: string;
  city: string;
}

const { data: regionsData } = useFetch<RegionInfo[]>('/api/game/regions', {
  default: () => []
});

const availableContinents = computed(() => {
  return [...new Set(regionsData.value.map((r) => r.continent).filter(Boolean))].sort();
});

const availableCountries = computed(() => {
  let filtered = regionsData.value;
  if (geoStore.selectedContinents.length > 0) {
    filtered = filtered.filter((r) => geoStore.selectedContinents.includes(r.continent));
  }
  return [...new Set(filtered.map((r) => r.country).filter(Boolean))].sort();
});

const availableCities = computed(() => {
  let filtered = regionsData.value;
  if (geoStore.selectedCountries.length > 0) {
    filtered = filtered.filter((r) => geoStore.selectedCountries.includes(r.country));
  } else if (geoStore.selectedContinents.length > 0) {
    filtered = filtered.filter((r) => geoStore.selectedContinents.includes(r.continent));
  }
  return [...new Set(filtered.map((r) => r.city).filter(Boolean))].sort();
});

watch(
  () => availableCountries.value,
  (newCountries) => {
    geoStore.selectedCountries = geoStore.selectedCountries.filter((c) => newCountries.includes(c));
  }
);

watch(
  () => availableCities.value,
  (newCities) => {
    geoStore.selectedCities = geoStore.selectedCities.filter((c) => newCities.includes(c));
  }
);

const blurSelect = (event: Event): void => {
  const target = event.target as HTMLSelectElement;
  if (target) {
    target.blur();
  }
};
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

.select-wrapper {
  position: relative;
  width: 100%;
}

.select-arrow {
  position: absolute;
  right: 1.2rem;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  font-size: 1.2rem;
  pointer-events: none;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.game-select {
  width: 100%;
  background: rgba(15, 23, 42, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 1.2rem 3rem 1.2rem 1.5rem;
  color: #f8fafc;
  font-size: 1.05rem;
  font-family: inherit;
  transition: all 0.2s ease;
  box-sizing: border-box;
  appearance: none;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
    background: rgba(0, 0, 0, 0.3);
  }

  &:focus + .select-arrow {
    transform: translateY(-50%) rotate(180deg);
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
