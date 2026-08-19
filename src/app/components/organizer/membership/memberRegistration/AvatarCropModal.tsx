import React, { useState, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import {
  Box, Button, Flex, Icon, Modal, ModalContent, ModalOverlay,
  Slider, SliderFilledTrack, SliderThumb, SliderTrack, Text,
} from '@chakra-ui/react';
import { MdPerson } from 'react-icons/md';

interface Props {
  isOpen: boolean;
  imageSrc: string;
  onCancel: () => void;
  onSave: (croppedBlob: Blob, previewUrl: string) => void;
}

async function getCroppedImg(src: string, crop: Area): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
  const canvas = document.createElement('canvas');
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.95));
}

export default function AvatarCropModal({ isOpen, imageSrc, onCancel, onSave }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
    const url = URL.createObjectURL(blob);
    onSave(blob, url);
  };

  return (
    <Modal isOpen={isOpen} onClose={onCancel} isCentered size="lg">
      <ModalOverlay bg="blackAlpha.600" />
      <ModalContent borderRadius="2xl" mx={4} overflow="hidden">

        {/* Header */}
        <Box px={6} pt={5} pb={4} borderBottom="1px solid" borderColor="gray.100">
          <Text fontSize="10px" fontWeight="bold" color="green.500" textTransform="uppercase" letterSpacing="wider" mb={1}>
            Profile Photo
          </Text>
          <Text fontSize="xl" fontWeight="bold" color="gray.900">Adjust Avatar Crop</Text>
          <Text fontSize="sm" color="gray.500" mt={0.5}>
            Choose the square area you want to use as your avatar before saving.
          </Text>
        </Box>

        {/* Crop area */}
        <Box px={6} py={5}>
          <Box
            position="relative"
            h="280px"
            bg="gray.100"
            borderRadius="2xl"
            overflow="hidden"
          >
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </Box>

          {/* Zoom slider */}
          <Flex align="center" gap={4} mt={5}>
            <Text fontSize="sm" fontWeight="medium" color="gray.700" flexShrink={0}>Zoom</Text>
            <Slider
              flex={1}
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(v) => setZoom(v)}
              colorScheme="blue"
            >
              <SliderTrack bg="gray.200" h="3px" borderRadius="full">
                <SliderFilledTrack bg="#044bd9" />
              </SliderTrack>
              <SliderThumb boxSize={4} bg="#044bd9" _focus={{ boxShadow: 'none' }} />
            </Slider>
            <Text fontSize="sm" color="gray.500" flexShrink={0} w="40px" textAlign="right">
              {zoom.toFixed(2)}x
            </Text>
          </Flex>

          {/* Hint */}
          <Box mt={4} bg="gray.50" border="1px solid" borderColor="gray.200" borderRadius="lg" px={4} py={3}>
            <Text fontSize="xs" color="gray.500" lineHeight="tall">
              Drag the image inside the circle to choose what stays visible in your avatar.
            </Text>
          </Box>
        </Box>

        {/* Footer */}
        <Flex
          px={6}
          py={4}
          borderTop="1px solid"
          borderColor="gray.100"
          justify="flex-end"
          gap={3}
        >
          <Button
            size="sm"
            variant="ghost"
            color="gray.600"
            borderRadius="lg"
            onClick={onCancel}
            _hover={{ bg: 'gray.100' }}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            bg="#044bd9"
            color="white"
            borderRadius="lg"
            px={6}
            leftIcon={<Icon as={MdPerson} />}
            onClick={handleSave}
            _hover={{ bg: '#0340b8' }}
            _active={{ bg: '#02308a' }}
          >
            Use This Avatar
          </Button>
        </Flex>

      </ModalContent>
    </Modal>
  );
}
