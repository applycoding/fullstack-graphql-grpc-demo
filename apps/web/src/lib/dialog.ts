export type DialogRect = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export function supportsClosedBy(): boolean {
  return typeof HTMLDialogElement !== 'undefined' && 'closedBy' in HTMLDialogElement.prototype;
}

/** Backdrop clicks target the dialog element and land outside its content box. */
export function shouldLightDismiss(targetIsDialog: boolean, rect: DialogRect, x: number, y: number): boolean {
  if (!targetIsDialog) {
    return false;
  }
  const inside = rect.top <= y && y <= rect.bottom && rect.left <= x && x <= rect.right;
  return !inside;
}
