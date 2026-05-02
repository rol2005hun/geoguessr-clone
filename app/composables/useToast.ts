import { ref } from 'vue';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

const toasts = ref<Toast[]>([]);
let toastIdCounter = 0;

export const useToast = () => {
  const addToast = (message: string, type: ToastType = 'error', duration: number = 4000): void => {
    const id = toastIdCounter++;
    toasts.value.push({ id, message, type });

    setTimeout(() => {
      removeToast(id);
    }, duration);
  };

  const removeToast = (id: number): void => {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  };

  return {
    toasts,
    addToast,
    removeToast
  };
};
