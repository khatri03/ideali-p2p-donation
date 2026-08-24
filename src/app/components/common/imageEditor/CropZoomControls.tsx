import {
  Button,
  IconButton,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Stack,
} from '@chakra-ui/react';
import { MdAdd, MdRemove } from 'react-icons/md';
import { MAX_ZOOM, MIN_ZOOM, ZOOM_STEP } from './imageCrop';
import { CROP_RESET, CROP_ZOOM_IN, CROP_ZOOM_LABEL, CROP_ZOOM_OUT } from './imageEditorCopy';

interface CropZoomControlsProps {
  zoom: number;
  isDisabled: boolean;
  onChange: (zoom: number) => void;
  onStep: (direction: 1 | -1) => void;
  onReset: () => void;
}

const buttonStyle = {
  variant: 'outline' as const,
  borderRadius: '12px',
  minW: '44px',
  minH: '44px',
};

/** Zoom by whichever route suits: the two buttons, the slider, or dragging the slider's thumb. */
export const CropZoomControls = ({
  zoom,
  isDisabled,
  onChange,
  onStep,
  onReset,
}: CropZoomControlsProps) => (
  <Stack direction="row" align="center" gap={3} w="100%">
    <IconButton
      {...buttonStyle}
      aria-label={CROP_ZOOM_OUT}
      icon={<MdRemove />}
      isDisabled={isDisabled || zoom <= MIN_ZOOM}
      cursor={isDisabled || zoom <= MIN_ZOOM ? 'not-allowed' : 'pointer'}
      onClick={() => onStep(-1)}
    />

    <Slider
      aria-label={CROP_ZOOM_LABEL}
      value={zoom}
      min={MIN_ZOOM}
      max={MAX_ZOOM}
      step={ZOOM_STEP}
      isDisabled={isDisabled}
      onChange={onChange}
      focusThumbOnChange={false}
      flex="1"
      minW={0}
      py={3}
      cursor={isDisabled ? 'not-allowed' : 'pointer'}
    >
      <SliderTrack h="6px" borderRadius="full">
        <SliderFilledTrack bg="brand.500" />
      </SliderTrack>
      <SliderThumb boxSize="28px" cursor={isDisabled ? 'not-allowed' : 'grab'} />
    </Slider>

    <IconButton
      {...buttonStyle}
      aria-label={CROP_ZOOM_IN}
      icon={<MdAdd />}
      isDisabled={isDisabled || zoom >= MAX_ZOOM}
      cursor={isDisabled || zoom >= MAX_ZOOM ? 'not-allowed' : 'pointer'}
      onClick={() => onStep(1)}
    />

    <Button
      {...buttonStyle}
      px={4}
      fontSize="sm"
      isDisabled={isDisabled}
      cursor={isDisabled ? 'not-allowed' : 'pointer'}
      onClick={onReset}
    >
      {CROP_RESET}
    </Button>
  </Stack>
);

export default CropZoomControls;
