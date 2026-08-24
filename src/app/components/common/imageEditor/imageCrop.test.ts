import { describe, expect, it } from 'vitest';
import {
  MAX_ZOOM,
  MIN_ZOOM,
  clampOffset,
  clampZoom,
  coveredSize,
  offsetLimit,
  outputName,
  outputType,
  sourceRect,
} from './imageCrop';

const LANDSCAPE = { width: 2000, height: 1000 };
const PORTRAIT = { width: 1000, height: 2000 };
const SQUARE = { width: 1200, height: 1200 };

describe('crop geometry', () => {
  it('Cover_ImageWiderThanTall_FillsTheStageAcrossItsShortSide', () => {
    const covered = coveredSize(LANDSCAPE, MIN_ZOOM);

    expect(covered.height).toBe(1);
    expect(covered.width).toBe(2);
  });

  it('Cover_ImageTallerThanWide_FillsTheStageAcrossItsShortSide', () => {
    const covered = coveredSize(PORTRAIT, MIN_ZOOM);

    expect(covered.width).toBe(1);
    expect(covered.height).toBe(2);
  });

  it('Cover_ZoomedIn_GrowsBothSidesByTheZoom', () => {
    expect(coveredSize(SQUARE, 2)).toEqual({ width: 2, height: 2 });
  });

  it('Cover_ImageWithNoDimensions_FallsBackToTheStageItself', () => {
    expect(coveredSize({ width: 0, height: 0 }, MIN_ZOOM)).toEqual({ width: 1, height: 1 });
  });

  it('Zoom_BeyondTheAllowedRange_IsHeldAtTheNearestEnd', () => {
    expect(clampZoom(0.2)).toBe(MIN_ZOOM);
    expect(clampZoom(99)).toBe(MAX_ZOOM);
  });

  it('Zoom_NotANumber_FallsBackToTheStartingZoom', () => {
    expect(clampZoom(Number.NaN)).toBe(MIN_ZOOM);
  });

  it('Limit_SquareImageAtTheStartingZoom_CannotBeMovedAtAll', () => {
    expect(offsetLimit(SQUARE, MIN_ZOOM)).toEqual({ x: 0, y: 0 });
  });

  it('Limit_WideImage_CanOnlyBeMovedAcross', () => {
    expect(offsetLimit(LANDSCAPE, MIN_ZOOM)).toEqual({ x: 0.5, y: 0 });
  });

  it('Offset_DraggedPastTheEdge_StopsWhereTheImageStillCoversTheStage', () => {
    expect(clampOffset({ x: 5, y: 5 }, LANDSCAPE, MIN_ZOOM)).toEqual({ x: 0.5, y: 0 });
    expect(clampOffset({ x: -5, y: -5 }, LANDSCAPE, MIN_ZOOM)).toEqual({ x: -0.5, y: 0 });
  });

  it('Offset_NotANumber_IsTreatedAsCentred', () => {
    expect(clampOffset({ x: Number.NaN, y: undefined as unknown as number }, SQUARE, 2)).toEqual({
      x: 0,
      y: 0,
    });
  });

  it('Crop_CentredSquareImage_TakesTheWholeImage', () => {
    expect(sourceRect(SQUARE, MIN_ZOOM, { x: 0, y: 0 })).toEqual({ x: 0, y: 0, size: 1200 });
  });

  it('Crop_CentredWideImage_TakesTheMiddleSquare', () => {
    expect(sourceRect(LANDSCAPE, MIN_ZOOM, { x: 0, y: 0 })).toEqual({ x: 500, y: 0, size: 1000 });
  });

  it('Crop_DraggedRight_TakesASquareFurtherLeftInTheImage', () => {
    const rect = sourceRect(LANDSCAPE, MIN_ZOOM, { x: 0.25, y: 0 });

    expect(rect).toEqual({ x: 250, y: 0, size: 1000 });
  });

  it('Crop_ZoomedIn_TakesASmallerSquareSoTheStageShowsLess', () => {
    const rect = sourceRect(SQUARE, 2, { x: 0, y: 0 });

    expect(rect).toEqual({ x: 300, y: 300, size: 600 });
  });

  it('Crop_DraggedFurtherThanAllowed_StaysInsideTheImage', () => {
    const rect = sourceRect(LANDSCAPE, MIN_ZOOM, { x: 9, y: 9 });

    expect(rect.x).toBe(0);
    expect(rect.x + rect.size).toBeLessThanOrEqual(LANDSCAPE.width);
  });

  it('Crop_ImageWithNoDimensions_ReportsNothingToCopy', () => {
    expect(sourceRect({ width: 0, height: 0 }, MIN_ZOOM, { x: 0, y: 0 }).size).toBe(0);
  });
});

describe('crop output', () => {
  it('Output_PngAndWebp_KeepTheirOwnFormat', () => {
    expect(outputType('image/png')).toBe('image/png');
    expect(outputType('image/webp')).toBe('image/webp');
  });

  it('Output_AnythingElse_BecomesJpeg', () => {
    expect(outputType('image/jpeg')).toBe('image/jpeg');
    expect(outputType('image/heic')).toBe('image/jpeg');
  });

  it('Name_FileWithAnExtension_KeepsItsNameAndTakesTheNewExtension', () => {
    expect(outputName('holiday.jpeg', 'image/png')).toBe('holiday.png');
  });

  it('Name_FileWithNoName_StillProducesAUsableOne', () => {
    expect(outputName('.png', 'image/jpeg')).toBe('photo.jpg');
  });
});
