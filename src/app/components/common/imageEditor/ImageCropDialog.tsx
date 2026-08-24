import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
} from '@chakra-ui/react';
import CropStage from './CropStage';
import CropZoomControls from './CropZoomControls';
import { renderCrop } from './cropRenderer';
import {
  CROP_APPLYING,
  CROP_CANCEL,
  CROP_CONFIRM,
  CROP_INSTRUCTION,
  CROP_LOAD_FAILED,
  CROP_PREPARING,
  CROP_RENDER_FAILED,
  describeChosenFile,
} from './imageEditorCopy';
import { useImageCropper } from './useImageCropper';

interface ImageCropDialogProps {
  file: File | null;
  title: string;
  isBusy: boolean;
  onCancel: () => void;
  onConfirm: (photo: File) => void;
}

type StageStatus = 'loading' | 'ready' | 'failed';

/**
 * Frames a chosen image before anything is uploaded. The file itself never leaves the browser: what
 * the caller receives is the square inside the circle, at a fixed size, so what was previewed is
 * exactly what gets saved.
 */
export const ImageCropDialog = ({
  file,
  title,
  isBusy,
  onCancel,
  onConfirm,
}: ImageCropDialogProps) => {
  const cropper = useImageCropper();
  const image = useRef<HTMLImageElement>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<StageStatus>('loading');
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return undefined;
    }

    const url = URL.createObjectURL(file);

    setStatus('loading');
    setRenderError(null);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleLoaded = useCallback(
    (loaded: HTMLImageElement) => {
      if (!loaded.naturalWidth || !loaded.naturalHeight) {
        setStatus('failed');
        return;
      }

      image.current = loaded;
      cropper.adopt({ width: loaded.naturalWidth, height: loaded.naturalHeight });
      setStatus('ready');
    },
    [cropper],
  );

  const handleConfirm = async () => {
    if (!file || !image.current) {
      return;
    }

    setIsRendering(true);
    setRenderError(null);

    try {
      onConfirm(await renderCrop(image.current, file, cropper.zoom, cropper.offset));
    } catch {
      setRenderError(CROP_RENDER_FAILED);
    } finally {
      setIsRendering(false);
    }
  };

  const isLocked = isBusy || isRendering;
  const canConfirm = status === 'ready' && !isLocked;

  return (
    <Modal
      isOpen={Boolean(file)}
      onClose={onCancel}
      size={{ base: 'full', md: 'lg' }}
      isCentered
      closeOnOverlayClick={!isLocked}
      closeOnEsc={!isLocked}
    >
      <ModalOverlay />
      <ModalContent borderRadius={{ base: 0, md: '16px' }}>
        <ModalHeader fontSize={{ base: 'lg', md: 'xl' }}>{title}</ModalHeader>
        <ModalCloseButton isDisabled={isLocked} cursor={isLocked ? 'not-allowed' : 'pointer'} />

        <ModalBody>
          <Stack gap={5} align="center">
            {previewUrl && (
              <CropStage
                cropper={cropper}
                previewUrl={previewUrl}
                onLoaded={handleLoaded}
                onFailed={() => setStatus('failed')}
              />
            )}

            {status === 'loading' && (
              <Text fontSize="sm" color="gray.500" _dark={{ color: 'gray.400' }}>
                {CROP_PREPARING}
              </Text>
            )}

            {status === 'failed' && (
              <Text fontSize="sm" color="red.500" role="alert" textAlign="center">
                {CROP_LOAD_FAILED}
              </Text>
            )}

            {status === 'ready' && (
              <>
                <CropZoomControls
                  zoom={cropper.zoom}
                  isDisabled={isLocked}
                  onChange={cropper.changeZoom}
                  onStep={cropper.stepZoom}
                  onReset={cropper.reset}
                />

                <Text
                  fontSize="sm"
                  color="gray.500"
                  _dark={{ color: 'gray.400' }}
                  textAlign="center"
                >
                  {CROP_INSTRUCTION}
                </Text>
              </>
            )}

            {file && (
              <Text fontSize="sm" fontWeight="600" textAlign="center" wordBreak="break-word">
                {describeChosenFile(file.name, file.size)}
              </Text>
            )}

            {renderError && (
              <Text fontSize="sm" color="red.500" role="alert" textAlign="center">
                {renderError}
              </Text>
            )}
          </Stack>
        </ModalBody>

        <ModalFooter>
          <Stack direction={{ base: 'column-reverse', md: 'row' }} gap={3} w="100%" justify="flex-end">
            <Button
              variant="ghost"
              onClick={onCancel}
              isDisabled={isLocked}
              minH="44px"
              borderRadius="12px"
              cursor={isLocked ? 'not-allowed' : 'pointer'}
              w={{ base: 'full', md: 'auto' }}
            >
              {CROP_CANCEL}
            </Button>

            <Button
              colorScheme="brand"
              onClick={handleConfirm}
              isDisabled={!canConfirm}
              isLoading={isLocked}
              loadingText={CROP_APPLYING}
              minH="44px"
              borderRadius="12px"
              cursor={canConfirm ? 'pointer' : 'not-allowed'}
              w={{ base: 'full', md: 'auto' }}
            >
              {CROP_CONFIRM}
            </Button>
          </Stack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ImageCropDialog;
