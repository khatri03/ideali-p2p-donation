export const CROP_INSTRUCTION =
  'Drag the photo to move it, and zoom in to fill the circle. Only what you can see inside the circle is saved.';
export const CROP_PREVIEW_ALT = 'The photo you chose';
export const CROP_STAGE_LABEL =
  'Photo position. Drag the photo, or use the arrow keys to move it and the plus and minus keys to zoom.';
export const CROP_ZOOM_LABEL = 'Zoom';
export const CROP_ZOOM_IN = 'Zoom in';
export const CROP_ZOOM_OUT = 'Zoom out';
export const CROP_RESET = 'Recentre';
export const CROP_CANCEL = 'Cancel';
export const CROP_CONFIRM = 'Use this photo';
export const CROP_APPLYING = 'Saving...';
export const CROP_PREPARING = 'Opening your photo...';
export const CROP_LOAD_FAILED = 'That image could not be opened. Choose another file.';
export const CROP_RENDER_FAILED = 'That image could not be prepared. Try again, or choose another file.';

const KILOBYTE = 1024;
const MEGABYTE = KILOBYTE * KILOBYTE;

/** Names the exact file that was picked, so nobody has to guess which one the dialog is showing. */
export const describeChosenFile = (name: string, bytes: number): string => {
  const size =
    bytes >= MEGABYTE
      ? `${(bytes / MEGABYTE).toFixed(1)} MB`
      : `${Math.max(1, Math.round(bytes / KILOBYTE))} KB`;

  return `${name} — ${size}`;
};
