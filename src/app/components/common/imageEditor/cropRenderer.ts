import {
  CropOffset,
  JPEG_QUALITY,
  NaturalSize,
  OUTPUT_SIZE,
  outputName,
  outputType,
  sourceRect,
} from './imageCrop';

const RENDER_FAILED = 'That image could not be prepared.';

const toBlob = (canvas: HTMLCanvasElement, type: string): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error(RENDER_FAILED))),
      type,
      JPEG_QUALITY,
    );
  });

/**
 * Copies the framed square out of the original at a fixed size. Two things fall out of that: the file
 * that leaves the browser is the crop the fundraiser chose, and a photo straight off a phone camera
 * arrives as a few tens of kilobytes rather than several megabytes.
 */
export const renderCrop = async (
  image: HTMLImageElement,
  source: File,
  zoom: number,
  offset: CropOffset,
): Promise<File> => {
  const natural: NaturalSize = { width: image.naturalWidth, height: image.naturalHeight };
  const rect = sourceRect(natural, zoom, offset);

  if (rect.size <= 0) {
    throw new Error(RENDER_FAILED);
  }

  const canvas = document.createElement('canvas');
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;

  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error(RENDER_FAILED);
  }

  context.imageSmoothingQuality = 'high';
  context.drawImage(image, rect.x, rect.y, rect.size, rect.size, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

  const type = outputType(source.type);
  const blob = await toBlob(canvas, type);

  return new File([blob], outputName(source.name, type), { type });
};
