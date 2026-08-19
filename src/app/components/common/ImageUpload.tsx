import React, { useState } from 'react';
import { Box, Flex, Text, Input, useColorModeValue } from '@chakra-ui/react';

interface ImageUploadProps {
  onFileSelect: (file: File) => void;
  previewUrl: string | null;
  onError?: (error: string) => void;
  maxSizeMB?: number; // Maximum file size in MB
  acceptedFormats?: string; // e.g., "image/png, image/jpeg"
  variant?: 'circle' | 'rounded';
}

export default function ImageUpload({
  onFileSelect,
  previewUrl,
  onError,
  maxSizeMB = 5,
  acceptedFormats = "image/png, image/jpeg, image/jpg, image/svg+xml",
  variant = 'circle'
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  
  // Reset error state when previewUrl changes
  React.useEffect(() => {
    setImageLoadError(false);
  }, [previewUrl]);

  const borderColor = useColorModeValue('gray.300', 'gray.600');
  const hoverBorderColor = useColorModeValue('blue.500', 'blue.400');
  const bgColor = useColorModeValue('gray.50', 'gray.800');

  const handleFileChange = (file: File) => {
    // Validate file type
    if (acceptedFormats && !acceptedFormats.includes(file.type)) {
      if (onError) onError('Invalid file format. Please upload PNG, JPG, or SVG.');
      return;
    }

    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      if (onError) onError(`File size should not exceed ${maxSizeMB}MB.`);
      return;
    }

    onFileSelect(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileChange(file);
    }
  };

  return (
    <Flex justify="center" align="center" direction="column" mb={4}>
      <Box
        position="relative"
        w="150px"
        h="150px"
        borderRadius={variant === 'circle' ? 'full' : 'xl'}
        border="2px dashed"
        borderColor={isDragging ? hoverBorderColor : borderColor}
        overflow="hidden"
        cursor="pointer"
        bg={bgColor}
        _hover={{ borderColor: hoverBorderColor }}
        onClick={() => document.getElementById('image-upload-input')?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        transition="all 0.2s"
      >
        {previewUrl && !imageLoadError ? (
          <Box
            as="img"
            src={previewUrl}
            alt="Upload Preview"
            w="100%"
            h="100%"
            objectFit="cover"
            onError={() => setImageLoadError(true)}
          />
        ) : (
          <Flex w="100%" h="100%" justify="center" align="center" direction="column" color="gray.400" p={2}>
             <Text fontSize="xs" textAlign="center" fontWeight="medium">Upload Logo</Text>
             <Text fontSize="10px" textAlign="center" mt={1}>PNG, JPG, SVG</Text>
          </Flex>
        )}
      </Box>
      <Input
        type="file"
        id="image-upload-input"
        accept={acceptedFormats}
        display="none"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileChange(file);
        }}
      />
    </Flex>
  );
}

