import { create } from 'zustand';

export type ToastTone = 'ok' | 'err';

export type Toast = {
  id: string;
  message: string;
  tone: ToastTone;
};

type UiState = {
  navOpen: boolean;
  setNavOpen: (open: boolean) => void;
  toasts: Toast[];
  pushToast: (message: string, tone: ToastTone) => void;
  dismissToast: (id: string) => void;
};

export const useUiStore = create<UiState>((set) => ({
  navOpen: false,
  setNavOpen: (navOpen) => set({ navOpen }),
  toasts: [],
  pushToast: (message, tone) => set((state) => ({
    toasts: [...state.toasts, { id: crypto.randomUUID(), message, tone }],
  })),
  dismissToast: (id) => set((state) => ({
    toasts: state.toasts.filter((toast) => toast.id !== id),
  })),
}));

export function toastClass(tone: ToastTone): string {
  switch (tone) {
    case 'ok':
      return 'toast ok';
    case 'err':
      return 'toast err';
    default: {
      const exhaustive: never = tone;
      return exhaustive;
    }
  }
}
