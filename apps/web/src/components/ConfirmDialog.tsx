import { useEffect, useId, useRef } from 'react';
import { shouldLightDismiss, supportsClosedBy } from '../lib/dialog';

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
};

export function ConfirmDialog({ open, title, description, confirmLabel, onConfirm, onClose }: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    ref.current?.setAttribute('closedby', 'any');
  }, []);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) {
      return;
    }
    if (open && !dialog.open) {
      dialog.showModal();
    }
    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || supportsClosedBy()) {
      return;
    }
    const onClick = (event: MouseEvent) => {
      const rect = dialog.getBoundingClientRect();
      if (shouldLightDismiss(event.target === dialog, rect, event.clientX, event.clientY)) {
        dialog.close();
      }
    };
    dialog.addEventListener('click', onClick);
    return () => dialog.removeEventListener('click', onClick);
  }, []);

  return (
    <dialog ref={ref} aria-labelledby={titleId} onClose={onClose}>
      <h2 id={titleId}>{title}</h2>
      <p>{description}</p>
      <div className="dialog-actions">
        <form method="dialog">
          <button type="submit" className="button secondary">Keep booking</button>
        </form>
        <button type="button" className="button danger" onClick={onConfirm}>{confirmLabel}</button>
      </div>
    </dialog>
  );
}
