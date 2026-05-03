<template>
  <div class="toast-wrapper">
    <TransitionGroup name="toast-anim">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast-item"
        :class="'toast-' + toast.type">
        <div class="toast-indicator"></div>

        <div class="toast-content">
          <div class="icon-circle">
            <Icon v-if="toast.type === 'error'" name="ph:warning-circle-fill" />
            <Icon v-else-if="toast.type === 'success'" name="ph:check-circle-fill" />
            <Icon v-else-if="toast.type === 'warning'" name="ph:warning-fill" />
            <Icon v-else name="ph:info-fill" />
          </div>
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
const { toasts, removeToast } = useToast();
</script>

<style scoped lang="scss">
.toast-wrapper {
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  pointer-events: none;
  width: auto;
}

.toast-item {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 320px;
  max-width: 420px;
  padding: 0.85rem 1rem;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.9);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.3),
    0 10px 10px -5px rgba(0, 0, 0, 0.2);
  color: #f8fafc;
  overflow: hidden;
  position: relative;
}

.toast-indicator {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  flex: 1;
}

.icon-circle {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  flex-shrink: 0;
}

.toast-error {
  .toast-indicator,
  .icon-circle {
    color: #ef4444;
  }
  border-color: rgba(239, 68, 68, 0.2);
}

.toast-success {
  .toast-indicator,
  .icon-circle {
    color: #22c55e;
  }
  border-color: rgba(34, 197, 94, 0.2);
}

.toast-warning {
  .toast-indicator,
  .icon-circle {
    color: #f59e0b;
  }
  border-color: rgba(245, 158, 11, 0.2);
}

.toast-info {
  .toast-indicator,
  .icon-circle {
    color: #3b82f6;
  }
  border-color: rgba(59, 130, 246, 0.2);
}

.toast-text {
  font-size: 0.9rem;
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: -0.01em;
}

.toast-close {
  background: rgba(255, 255, 255, 0.05);
  border: none;
  color: #94a3b8;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.4rem;
  border-radius: 8px;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #f8fafc;
  }
}

.toast-anim-enter-active,
.toast-anim-leave-active {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.toast-anim-enter-from {
  opacity: 0;
  transform: translateX(50px) scale(0.9);
}

.toast-anim-leave-to {
  opacity: 0;
  transform: translateX(50px) scale(0.9);
}

@media (max-width: 640px) {
  .toast-wrapper {
    top: 1rem;
    right: 1rem;
    left: 1rem;
    align-items: center;
  }

  .toast-item {
    min-width: 0;
    width: 100%;
    max-width: none;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.4);
  }

  .toast-anim-enter-from,
  .toast-anim-leave-to {
    transform: translateY(-20px) scale(0.95);
  }
}
</style>
