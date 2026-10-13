import { describe, expect, it } from 'vitest';
import { shouldLightDismiss } from './dialog';

const rect = { top: 100, right: 400, bottom: 300, left: 200 };

describe('shouldLightDismiss', () => {
  it('closes when the backdrop click lands outside the dialog box', () => {
    expect(shouldLightDismiss(true, rect, 10, 10)).toBe(true);
  });

  it('keeps the dialog open for clicks inside it or on a child', () => {
    expect(shouldLightDismiss(true, rect, 250, 150)).toBe(false);
    expect(shouldLightDismiss(false, rect, 10, 10)).toBe(false);
  });
});
