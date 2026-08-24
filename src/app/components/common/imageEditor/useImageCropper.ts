import { useCallback, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import {
  CENTERED,
  CropOffset,
  MIN_ZOOM,
  NaturalSize,
  ZOOM_STEP,
  clampOffset,
  clampZoom,
} from './imageCrop';

const KEYBOARD_NUDGE = 0.05;
const WHEEL_SENSITIVITY = 0.0025;

export interface ImageCropper {
  natural: NaturalSize | null;
  zoom: number;
  offset: CropOffset;
  isDragging: boolean;
  stage: React.RefObject<HTMLDivElement>;
  adopt: (natural: NaturalSize) => void;
  reset: () => void;
  changeZoom: (zoom: number) => void;
  stepZoom: (direction: 1 | -1) => void;
  nudge: (x: number, y: number) => void;
  handlePointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
  handlePointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
  handlePointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
  zoomByWheel: (deltaY: number) => void;
}

/**
 * Framing state for one image: how far in it is zoomed and where it sits. Pointer movement is divided
 * by the stage's measured width, so a drag moves the picture by the same amount of picture whatever
 * size the stage happens to be, and the arrow keys move it without a pointer at all.
 */
export function useImageCropper(): ImageCropper {
  const [natural, setNatural] = useState<NaturalSize | null>(null);
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [offset, setOffset] = useState<CropOffset>(CENTERED);
  const [isDragging, setIsDragging] = useState(false);

  const stage = useRef<HTMLDivElement>(null);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  const reset = useCallback(() => {
    setZoom(MIN_ZOOM);
    setOffset(CENTERED);
  }, []);

  const adopt = useCallback(
    (loaded: NaturalSize) => {
      setNatural(loaded);
      reset();
    },
    [reset],
  );

  const move = useCallback(
    (x: number, y: number) => {
      if (!natural) {
        return;
      }

      setOffset((current) => clampOffset({ x: current.x + x, y: current.y + y }, natural, zoom));
    },
    [natural, zoom],
  );

  const changeZoom = useCallback(
    (next: number) => {
      const safeZoom = clampZoom(next);

      setZoom(safeZoom);

      if (natural) {
        setOffset((current) => clampOffset(current, natural, safeZoom));
      }
    },
    [natural],
  );

  const stepZoom = useCallback(
    (direction: 1 | -1) => changeZoom(zoom + direction * ZOOM_STEP),
    [changeZoom, zoom],
  );

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!natural) {
        return;
      }

      lastPoint.current = { x: event.clientX, y: event.clientY };
      setIsDragging(true);
      event.currentTarget.setPointerCapture?.(event.pointerId);
    },
    [natural],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const previous = lastPoint.current;
      const width = stage.current?.getBoundingClientRect().width;

      if (!previous || !width) {
        return;
      }

      lastPoint.current = { x: event.clientX, y: event.clientY };
      move((event.clientX - previous.x) / width, (event.clientY - previous.y) / width);
    },
    [move],
  );

  const handlePointerUp = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    lastPoint.current = null;
    setIsDragging(false);
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  }, []);

  const zoomByWheel = useCallback(
    (deltaY: number) => {
      if (!natural) {
        return;
      }

      changeZoom(zoom - deltaY * WHEEL_SENSITIVITY);
    },
    [changeZoom, natural, zoom],
  );

  const nudge = useCallback(
    (x: number, y: number) => move(x * KEYBOARD_NUDGE, y * KEYBOARD_NUDGE),
    [move],
  );

  return {
    natural,
    zoom,
    offset,
    isDragging,
    stage,
    adopt,
    reset,
    changeZoom,
    stepZoom,
    nudge,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    zoomByWheel,
  };
}
