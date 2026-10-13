import { beforeEach, describe, expect, it } from 'vitest';
import { useUiStore } from './store';

describe('ui store', () => {
  beforeEach(() => {
    useUiStore.setState({ navOpen: false, toasts: [] });
  });

  it('opens the menu and stacks toasts', () => {
    useUiStore.getState().setNavOpen(true);
    useUiStore.getState().pushToast('Held', 'ok');
    useUiStore.getState().pushToast('No', 'err');
    const { navOpen, toasts } = useUiStore.getState();
    expect(navOpen).toBe(true);
    expect(toasts.map((toast) => toast.tone)).toEqual(['ok', 'err']);
    const first = toasts[0];
    if (!first) {
      throw new Error('missing toast');
    }
    useUiStore.getState().dismissToast(first.id);
    expect(useUiStore.getState().toasts).toHaveLength(1);
  });
});
