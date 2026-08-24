import { ChakraProvider } from '@chakra-ui/react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ImageCropDialog from './ImageCropDialog';
import { CROP_PREVIEW_ALT } from './imageEditorCopy';
import { MAX_ZOOM, MIN_ZOOM } from './imageCrop';

const chosenFile = (name = 'holiday.png', type = 'image/png', bytes = 2_300_000) =>
  new File([new Uint8Array(8)], name, { type });

const openDialog = (file: File | null, overrides: Partial<{ isBusy: boolean }> = {}) => {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();

  render(
    <ChakraProvider>
      <ImageCropDialog
        file={file}
        title="Position your photo"
        isBusy={overrides.isBusy ?? false}
        onCancel={onCancel}
        onConfirm={onConfirm}
      />
    </ChakraProvider>,
  );

  return { onConfirm, onCancel };
};

const showImageAsLoaded = async () => {
  const preview = await screen.findByAltText(CROP_PREVIEW_ALT);

  fireEvent.load(preview);

  return preview;
};

describe('ImageCropDialog', () => {
  it('Dialog_NoFileChosen_StaysClosed', () => {
    openDialog(null);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('Dialog_FileChosen_NamesTheExactFileSoTheChoiceIsUnambiguous', async () => {
    openDialog(chosenFile('summer-run.png'));

    expect(await screen.findByText(/summer-run\.png/)).toBeInTheDocument();
  });

  it('Dialog_ImageStillOpening_WillNotLetThePhotoBeUsedYet', () => {
    openDialog(chosenFile());

    expect(screen.getByRole('button', { name: /Use this photo/i })).toBeDisabled();
  });

  it('Dialog_ImageOpened_OffersTheFramingControls', async () => {
    openDialog(chosenFile());
    await showImageAsLoaded();

    expect(await screen.findByRole('slider', { name: 'Zoom' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeEnabled();
    expect(screen.getByRole('button', { name: /Use this photo/i })).toBeEnabled();
  });

  it('Zoom_AtTheStartingZoom_CannotBeZoomedOutFurther', async () => {
    openDialog(chosenFile());
    await showImageAsLoaded();

    expect(await screen.findByRole('button', { name: 'Zoom out' })).toBeDisabled();
  });

  it('Zoom_ZoomInPressed_MovesTheZoomOffItsStartingValue', async () => {
    openDialog(chosenFile());
    await showImageAsLoaded();

    await userEvent.click(await screen.findByRole('button', { name: 'Zoom in' }));

    const slider = screen.getByRole('slider', { name: 'Zoom' });

    expect(Number(slider.getAttribute('aria-valuenow'))).toBeGreaterThan(MIN_ZOOM);
    expect(Number(slider.getAttribute('aria-valuenow'))).toBeLessThanOrEqual(MAX_ZOOM);
  });

  it('Zoom_RecentrePressed_PutsTheFramingBackWhereItStarted', async () => {
    openDialog(chosenFile());
    await showImageAsLoaded();

    await userEvent.click(await screen.findByRole('button', { name: 'Zoom in' }));
    await userEvent.click(screen.getByRole('button', { name: 'Recentre' }));

    expect(screen.getByRole('slider', { name: 'Zoom' })).toHaveAttribute(
      'aria-valuenow',
      String(MIN_ZOOM),
    );
  });

  it('Confirm_PhotoFramed_HandsBackACroppedFileRatherThanTheOriginal', async () => {
    const { onConfirm } = openDialog(chosenFile('holiday.png', 'image/png'));
    await showImageAsLoaded();

    await userEvent.click(await screen.findByRole('button', { name: /Use this photo/i }));

    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));

    const cropped = onConfirm.mock.calls[0][0] as File;

    expect(cropped).toBeInstanceOf(File);
    expect(cropped.name).toBe('holiday.png');
    expect(cropped.type).toBe('image/png');
    expect(cropped.size).toBeLessThan(2_300_000);
  });

  it('Confirm_JpegChosen_KeepsAFormatEveryBrowserCanWrite', async () => {
    const { onConfirm } = openDialog(chosenFile('portrait.jpeg', 'image/jpeg'));
    await showImageAsLoaded();

    await userEvent.click(await screen.findByRole('button', { name: /Use this photo/i }));

    await waitFor(() => expect(onConfirm).toHaveBeenCalled());

    expect((onConfirm.mock.calls[0][0] as File).name).toBe('portrait.jpg');
  });

  it('Confirm_ImageCannotBePrepared_ExplainsItAndUploadsNothing', async () => {
    const toBlob = HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob = function failing(callback) {
      callback(null);
    };

    try {
      const { onConfirm } = openDialog(chosenFile());
      await showImageAsLoaded();

      await userEvent.click(await screen.findByRole('button', { name: /Use this photo/i }));

      expect(
        await screen.findByText(/could not be prepared/i, { selector: '[role="alert"]' }),
      ).toBeInTheDocument();
      expect(onConfirm).not.toHaveBeenCalled();
    } finally {
      HTMLCanvasElement.prototype.toBlob = toBlob;
    }
  });

  it('Dialog_ImageThatWillNotOpen_ExplainsItAndOffersNoFraming', async () => {
    openDialog(chosenFile('broken.png'));

    fireEvent.error(await screen.findByAltText(CROP_PREVIEW_ALT));

    expect(await screen.findByText(/could not be opened/i)).toBeInTheDocument();
    expect(screen.queryByRole('slider', { name: 'Zoom' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Use this photo/i })).toBeDisabled();
  });

  it('Cancel_Pressed_LeavesTheFramingWithoutUploading', async () => {
    const { onCancel, onConfirm } = openDialog(chosenFile());
    await showImageAsLoaded();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('Dialog_UploadInFlight_RefusesToStartASecondOne', async () => {
    openDialog(chosenFile(), { isBusy: true });
    await showImageAsLoaded();

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(await screen.findByRole('button', { name: /Saving/i })).toBeDisabled();
  });
});
