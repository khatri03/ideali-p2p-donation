import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Chakra reads matchMedia for responsive props and colour mode; happy-dom does not implement it.
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: (): void => undefined,
      removeListener: (): void => undefined,
      addEventListener: (): void => undefined,
      removeEventListener: (): void => undefined,
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

if (!window.scrollTo) {
  window.scrollTo = vi.fn();
}

afterEach(() => {
  cleanup();
});
