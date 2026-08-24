import { useEffect } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { Box, chakra } from '@chakra-ui/react';
import { coveredSize } from './imageCrop';
import { CROP_PREVIEW_ALT, CROP_STAGE_LABEL } from './imageEditorCopy';
import type { ImageCropper } from './useImageCropper';

interface CropStageProps {
  cropper: ImageCropper;
  previewUrl: string;
  onLoaded: (image: HTMLImageElement) => void;
  onFailed: () => void;
}

const ZOOM_IN_KEYS = ['+', '='];
const ZOOM_OUT_KEYS = ['-', '_'];

/**
 * The circle the photo is framed in. Pointer drags and the arrow keys move the picture, the wheel
 * zooms, and the mask is the crop: what sits outside the circle is what will be cut away.
 */
export const CropStage = ({ cropper, previewUrl, onLoaded, onFailed }: CropStageProps) => {
  const { stage, zoomByWheel } = cropper;

  // Registered by hand so the wheel can be stopped from scrolling the dialog behind it; React's own
  // wheel binding is passive and cannot refuse the scroll.
  useEffect(() => {
    const element = stage.current;

    if (!element) {
      return undefined;
    }

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      zoomByWheel(event.deltaY);
    };

    element.addEventListener('wheel', handleWheel, { passive: false });

    return () => element.removeEventListener('wheel', handleWheel);
  }, [stage, zoomByWheel]);

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const nudges: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    };

    if (nudges[event.key]) {
      event.preventDefault();
      cropper.nudge(...nudges[event.key]);
      return;
    }

    if (ZOOM_IN_KEYS.includes(event.key)) {
      event.preventDefault();
      cropper.stepZoom(1);
      return;
    }

    if (ZOOM_OUT_KEYS.includes(event.key)) {
      event.preventDefault();
      cropper.stepZoom(-1);
    }
  };

  const covered = coveredSize(cropper.natural ?? { width: 1, height: 1 }, cropper.zoom);

  return (
    <Box
      ref={stage}
      role="group"
      aria-label={CROP_STAGE_LABEL}
      tabIndex={0}
      position="relative"
      w="100%"
      maxW={{ base: '240px', '2sm': '280px', md: '320px' }}
      mx="auto"
      sx={{ aspectRatio: '1 / 1', touchAction: 'none' }}
      borderRadius="full"
      overflow="hidden"
      bg="gray.100"
      _dark={{ bg: 'whiteAlpha.200' }}
      userSelect="none"
      cursor={cropper.isDragging ? 'grabbing' : 'grab'}
      _focusVisible={{ outline: '3px solid', outlineColor: 'brand.500', outlineOffset: '3px' }}
      onKeyDown={handleKeyDown}
      onPointerDown={cropper.handlePointerDown}
      onPointerMove={cropper.handlePointerMove}
      onPointerUp={cropper.handlePointerUp}
      onPointerCancel={cropper.handlePointerUp}
    >
      <chakra.img
        src={previewUrl}
        alt={CROP_PREVIEW_ALT}
        draggable={false}
        onLoad={(event) => onLoaded(event.currentTarget)}
        onError={onFailed}
        position="absolute"
        left={`${50 + cropper.offset.x * 100}%`}
        top={`${50 + cropper.offset.y * 100}%`}
        w={`${covered.width * 100}%`}
        h={`${covered.height * 100}%`}
        maxW="none"
        transform="translate(-50%, -50%)"
        pointerEvents="none"
      />

      <Box
        position="absolute"
        inset={0}
        borderRadius="full"
        pointerEvents="none"
        boxShadow="inset 0 0 0 2px rgba(255, 255, 255, 0.9)"
      />
    </Box>
  );
};

export default CropStage;
