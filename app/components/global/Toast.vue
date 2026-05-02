<template>
  <div class="toast-wrapper">
    <TransitionGroup name="toast-anim">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast-item"
        :class="'toast-' + toast.type">
        <div class="toast-content">
          <Icon v-if="toast.type === 'error'" name="ph:warning-circle-bold" class="toast-icon" />
          <Icon
            v-else-if="toast.type === 'success'"
            name="ph:check-circle-bold"
            class="toast-icon" />
          <Icon v-else name="ph:info-bold" class="toast-icon" />
          <span class="toast-text">{{ toast.message }}</span>
        </div>
        <button class="toast-close" @click="removeToast(toast.id)">
          <Icon name="ph:x-bold" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { useToast } from '~/composables/useToast';

const { toasts, removeToast } = useToast();
</script>

<style scoped lang="scss">
.toast-wrapper {
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  pointer-events: none;
}

.toast-item {
  pointer-events: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 300px;
  max-width: 400px;
  padding: 1rem;
  border-radius: 0.5rem;
  background: rgba(30, 41, 59, 0.95);
  backdrop-filter: blur(8px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
  border-left: 4px solid transparent;
  color: #f8fafc;
}

.toast-error {
  border-left-color: #ef4444;
}

.toast-success {
  border-left-color: #22c55e;
}

.toast-warning {
  border-left-color: #f59e0b;
}

.toast-info {
  border-left-color: #3b82f6;
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.toast-icon {
  font-size: 1.5rem;
}

.toast-error .toast-icon {
  color: #ef4444;
}

.toast-success .toast-icon {
  color: #22c55e;
}

.toast-text {
  font-size: 0.95rem;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
}

.toast-close {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
  transition: color 0.2s;
}

.toast-close:hover {
  color: #f8fafc;
}

.toast-anim-enter-active,
.toast-anim-leave-active {
  transition: all 0.3s ease;
}

.toast-anim-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-anim-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
