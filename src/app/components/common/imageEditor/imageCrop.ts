/**
 * Geometry for a square crop, expressed in stage units rather than pixels: 1 unit is the width of the
 * stage the image is being framed in. Keeping it relative means the same numbers describe the crop at
 * 320px on a phone and at 420px on a desktop, and nothing has to measure the stage to reason about it.
 */

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 4;
export const ZOOM_STEP = 0.1;
export const OUTPUT_SIZE = 512;
export const JPEG_QUALITY = 0.92;

export interface NaturalSize {
  width: number;
  height: number;
}

export interface CropOffset {
  x: number;
  y: number;
}

export interface SourceRect {
  x: number;
  y: number;
  size: number;
}

export const CENTERED: CropOffset = { x: 0, y: 0 };

const isUsable = ({ width, height }: NaturalSize) =>
  Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0;

// The zero is normalised because a clamp against a zero limit yields -0, which reads as a different
// value to every equality check that matters.
const clamp = (value: number, lowest: number, highest: number) => {
  const held = Math.min(highest, Math.max(lowest, value));

  return held === 0 ? 0 : held;
};

export const clampZoom = (zoom: number): number =>
  Number.isFinite(zoom) ? clamp(zoom, MIN_ZOOM, MAX_ZOOM) : MIN_ZOOM;

/**
 * How large the image is drawn, in stage units, at the given zoom. The shorter side always fills the
 * stage exactly at zoom 1, so no part of the square is ever left empty.
 */
export const coveredSize = (natural: NaturalSize, zoom: number): NaturalSize => {
  if (!isUsable(natural)) {
    return { width: 1, height: 1 };
  }

  const shortest = Math.min(natural.width, natural.height);
  const scale = clampZoom(zoom) / shortest;

  return { width: natural.width * scale, height: natural.height * scale };
};

/** How far the image can travel from centre before an edge would come inside the stage. */
export const offsetLimit = (natural: NaturalSize, zoom: number): CropOffset => {
  const covered = coveredSize(natural, zoom);

  return {
    x: Math.max(0, (covered.width - 1) / 2),
    y: Math.max(0, (covered.height - 1) / 2),
  };
};

export const clampOffset = (
  offset: CropOffset,
  natural: NaturalSize,
  zoom: number,
): CropOffset => {
  const limit = offsetLimit(natural, zoom);
  const x = Number.isFinite(offset?.x) ? offset.x : 0;
  const y = Number.isFinite(offset?.y) ? offset.y : 0;

  return { x: clamp(x, -limit.x, limit.x), y: clamp(y, -limit.y, limit.y) };
};

/**
 * The square of the original image the stage is showing, in the image's own pixels. This is what gets
 * copied out, so the saved photo is what the fundraiser framed rather than the whole file.
 */
export const sourceRect = (
  natural: NaturalSize,
  zoom: number,
  offset: CropOffset,
): SourceRect => {
  if (!isUsable(natural)) {
    return { x: 0, y: 0, size: 0 };
  }

  const size = Math.min(natural.width, natural.height) / clampZoom(zoom);
  const safeOffset = clampOffset(offset, natural, zoom);

  return {
    x: clamp(natural.width / 2 - safeOffset.x * size - size / 2, 0, natural.width - size),
    y: clamp(natural.height / 2 - safeOffset.y * size - size / 2, 0, natural.height - size),
    size,
  };
};

const OUTPUT_TYPES: Record<string, string> = {
  'image/png': 'image/png',
  'image/webp': 'image/webp',
};

const EXTENSIONS: Record<string, string> = {
  'image/png': 'png',
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
};

/** JPEG is the fallback: it is the one every browser can encode, and a photo loses nothing by it. */
export const outputType = (sourceType: string): string => OUTPUT_TYPES[sourceType] ?? 'image/jpeg';

export const outputName = (sourceName: string, type: string): string => {
  const withoutExtension = sourceName.replace(/\.[^.]+$/, '') || 'photo';

  return `${withoutExtension}.${EXTENSIONS[type] ?? 'jpg'}`;
};
