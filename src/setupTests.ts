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

// happy-dom neither decodes images nor draws to a canvas, so anything that frames a picture would have
// nothing to measure and nothing to copy. These give it a decoded size and a working 2D context; what
// the drawing actually produces is proven in a real browser by the Playwright suite.
if (!URL.createObjectURL) {
  URL.createObjectURL = () => 'blob:image-under-test';
  URL.revokeObjectURL = (): void => undefined;
}

Object.defineProperty(HTMLImageElement.prototype, 'naturalWidth', {
  configurable: true,
  get: () => 1600,
});

Object.defineProperty(HTMLImageElement.prototype, 'naturalHeight', {
  configurable: true,
  get: () => 1200,
});

HTMLCanvasElement.prototype.getContext = (() =>
  ({
    imageSmoothingQuality: 'high',
    drawImage: (): void => undefined,
  })) as unknown as HTMLCanvasElement['getContext'];

HTMLCanvasElement.prototype.toBlob = function toBlob(callback, type) {
  callback(new Blob(['cropped'], { type: type ?? 'image/png' }));
};

afterEach(() => {
  cleanup();
});
