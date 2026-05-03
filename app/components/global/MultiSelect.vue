<template>
  <div ref="wrapperRef" class="multi-select-wrapper">
    <label v-if="label" class="select-label">{{ label }}</label>
    <div
      class="select-trigger"
      :class="{ disabled, active: isOpen }"
      role="button"
      tabindex="0"
      @click="toggleDropdown"
      @keydown.enter="toggleDropdown"
      @keydown.space.prevent="toggleDropdown">
      <div class="selected-text">
        <span v-if="modelValue.length === 0" class="placeholder">{{ placeholder }}</span>
        <span v-else-if="modelValue.length === 1">{{ modelValue[0] }}</span>
        <span v-else>{{ t('game.ui.selectedCount', { count: modelValue.length }) }}</span>
      </div>
      <Icon name="ph:caret-down-bold" class="select-arrow" :class="{ 'is-open': isOpen }" />
    </div>

    <Transition name="dropdown">
      <div v-show="isOpen" class="dropdown-menu" role="listbox" :aria-multiselectable="true">
        <div class="search-box">
          <Icon name="ph:magnifying-glass-bold" class="search-icon" />
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="t('game.ui.searchPlaceholder')"
            class="search-input"
            @click.stop />
        </div>
        <div class="options-list">
          <div v-if="filteredOptions.length === 0" class="no-results">
            {{ t('game.ui.noResults') }}
          </div>
          <label
            v-for="option in filteredOptions"
            :key="option"
            class="option-item"
            :class="{ selected: modelValue.includes(option) }"
            @click.stop>
            <input
              type="checkbox"
              :value="option"
              :checked="modelValue.includes(option)"
              @change="toggleOption(option)" />
            <span class="option-text">{{ option }}</span>
          </label>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { onClickOutside } from '@vueuse/core';

const props = defineProps<{
  modelValue: string[];
  options: string[];
  label?: string;
  placeholder: string;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string[]];
}>();

const { t } = useI18n();
const isOpen = ref(false);
const searchQuery = ref('');
const wrapperRef = ref<HTMLElement | null>(null);

onClickOutside(wrapperRef, () => {
  isOpen.value = false;
});

const toggleDropdown = () => {
  if (props.disabled) return;
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    searchQuery.value = '';
  }
};

const filteredOptions = computed(() => {
  if (!searchQuery.value) return props.options;
  const q = searchQuery.value.toLowerCase();
  return props.options.filter((opt) => opt.toLowerCase().includes(q));
});

const toggleOption = (option: string) => {
  const current = [...props.modelValue];
  const index = current.indexOf(option);
  if (index === -1) {
    current.push(option);
  } else {
    current.splice(index, 1);
  }
  emit('update:modelValue', current);
};
</script>

<style scoped lang="scss">
.multi-select-wrapper {
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.select-label {
  font-size: 0.85rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 600;
}

.select-trigger {
  width: 100%;
  background: rgba(15, 23, 42, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 1.2rem 3rem 1.2rem 1.5rem;
  color: #f8fafc;
  font-size: 1.05rem;
  transition: all 0.2s ease;
  box-sizing: border-box;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;

  &:hover:not(.disabled) {
    border-color: rgba(255, 255, 255, 0.1);
  }

  &.active {
    border-color: #3b82f6;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
    background: rgba(0, 0, 0, 0.3);
  }

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.placeholder {
  color: #94a3b8;
}

.select-arrow {
  position: absolute;
  right: 1.2rem;
  color: #94a3b8;
  font-size: 1.2rem;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &.is-open {
    transform: rotate(180deg);
  }
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 0.5rem);
  left: 0;
  width: 100%;
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
  z-index: 50;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.search-box {
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  position: relative;
  display: flex;
  align-items: center;

  .search-icon {
    position: absolute;
    left: 1.5rem;
    color: #94a3b8;
  }

  .search-input {
    width: 100%;
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 0.8rem 1rem 0.8rem 2.5rem;
    color: #f8fafc;
    font-size: 0.95rem;

    &:focus {
      outline: none;
      border-color: #3b82f6;
    }
  }
}

.options-list {
  max-height: 250px;
  overflow-y: auto;
  padding: 0.5rem 0;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
  }
}

.no-results {
  padding: 1rem;
  text-align: center;
  color: #94a3b8;
  font-size: 0.9rem;
}

.option-item {
  display: flex;
  align-items: center;
  padding: 0.8rem 1.5rem;
  cursor: pointer;
  transition: background 0.2s;
  gap: 1rem;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  &.selected {
    background: rgba(59, 130, 246, 0.1);
  }

  input[type='checkbox'] {
    appearance: none;
    width: 18px;
    height: 18px;
    border: 2px solid #64748b;
    border-radius: 4px;
    background: transparent;
    cursor: pointer;
    position: relative;
    transition: all 0.2s;
    margin: 0;

    &:checked {
      background: #3b82f6;
      border-color: #3b82f6;

      &::after {
        content: '';
        position: absolute;
        left: 5px;
        top: 2px;
        width: 4px;
        height: 8px;
        border: solid white;
        border-width: 0 2px 2px 0;
        transform: rotate(45deg);
      }
    }
  }

  .option-text {
    color: #f8fafc;
    font-size: 0.95rem;
    user-select: none;
  }
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition:
    opacity 0.2s,
    transform 0.2s;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
