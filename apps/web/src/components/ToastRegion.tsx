import { useEffect } from 'react';
import { toastClass, useUiStore } from '../ui/store';

export function ToastRegion() {
  const toasts = useUiStore((state) => state.toasts);
  const dismissToast = useUiStore((state) => state.dismissToast);

  useEffect(() => {
    if (toasts.length === 0) {
      return;
    }
    const timers = toasts.map((toast) => window.setTimeout(() => dismissToast(toast.id), 6000));
    return () => {
      for (const timer of timers) {
        window.clearTimeout(timer);
      }
    };
  }, [toasts, dismissToast]);

  return (
    <div className="toast-region" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={toastClass(toast.tone)}>
          <p>{toast.message}</p>
          <button type="button" className="button secondary" onClick={() => dismissToast(toast.id)}>
            <span className="visually-hidden">Dismiss: {toast.message}</span>
            <span aria-hidden="true">Close</span>
          </button>
        </div>
      ))}
    </div>
  );
}
