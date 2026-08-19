import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Button,
  Flex,
  FormControl,
  HStack,
  Icon,
  Image,
  Input,
  InputGroup,
  InputRightElement,
  IconButton,
  SimpleGrid,
  Skeleton,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Spinner,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useDisclosure,
  useToast,
  Badge,
  VStack,
  RadioGroup,
  Radio,
  Stack,
} from '@chakra-ui/react';
import { MdDelete } from 'react-icons/md';
import { FiZoomIn, FiSearch } from 'react-icons/fi';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import donationService from '../../../../service/organizer/donation/donationService';
import ConfirmationModal from '../../../common/ConfirmationModal';
import StepNavigationButtons from './shared/StepNavigationButtons';

// Unsplash API config
const UNSPLASH_ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY || '';
const UNSPLASH_API_URL = 'https://api.unsplash.com';

interface UnsplashImage {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  alt_description: string | null;
  width: number;
  height: number;
  user: {
    name: string;
    links: { html: string };
  };
  links: {
    download_location: string;
  };
}

// Utility to create a cropped image from canvas
async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('No 2d context');

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas is empty'));
    }, 'image/png');
  });
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });
}

// Import preset banner images
import communityImg from '../../../../../assets/img/organizer/donation/community.png';
import educationImg from '../../../../../assets/img/organizer/donation/education.png';
import environmentImg from '../../../../../assets/img/organizer/donation/environment.png';
import healthCareImg from '../../../../../assets/img/organizer/donation/healthCare.png';
import foodImg from '../../../../../assets/img/organizer/donation/food.png';
// Preset banner images data
const presetBanners = [
  { id: 'community', src: communityImg, name: 'Community' },
  { id: 'education', src: educationImg, name: 'Education' },
  { id: 'healthcare', src: healthCareImg, name: 'Healthcare' },
  { id: 'environment', src: environmentImg, name: 'Environment' },
  { id: 'food', src: foodImg, name: 'Food Relief' },
];

export interface Step7BannerUploadProps {
  bannerImage: File | null;
  setBannerImage: (file: File | null) => void;
  bannerPreview: string | null;
  setBannerPreview: (preview: string | null) => void;
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
  aiPrompt: string;
  setAiPrompt: (prompt: string) => void;
  isGeneratingImage: boolean;
  setIsGeneratingImage: (generating: boolean) => void;
  aiGeneratedImage: string | null;
  setAiGeneratedImage: (image: string | null) => void;
  tabIndex: number;
  setTabIndex: (index: number) => void;
  campaignId?: string;
  bannerId?: string;
  onBannerRemoved?: () => void;
  isFetchingBanner?: boolean;
  // Navigation props
  onPrevStep: () => void;
  onSkip: () => void;
  onSaveAndNext: () => Promise<void>;
  isSubmitting: boolean;
  isUploadingBanner: boolean;
  onSaveAndExit?: () => void;
  isSavingAndExiting?: boolean;
  // Customisation
  stepTitle?: string;
  stepTitleFontSize?: string;
  renderNavigation?: (cropImageSrc: string | null, onCropConfirm: () => void) => React.ReactNode;
}

export default function Step7BannerUpload({
  bannerImage,
  setBannerImage,
  bannerPreview,
  setBannerPreview,
  isDragging,
  setIsDragging,
  aiPrompt,
  setAiPrompt,
  isGeneratingImage,
  setIsGeneratingImage,
  aiGeneratedImage,
  setAiGeneratedImage,
  tabIndex,
  setTabIndex,
  campaignId,
  bannerId,
  onBannerRemoved,
  isFetchingBanner = false,
  onPrevStep,
  onSkip,
  onSaveAndNext,
  isSubmitting,
  isUploadingBanner,
  onSaveAndExit,
  isSavingAndExiting,
  stepTitle = 'Upload Banner',
  stepTitleFontSize,
  renderNavigation,
}: Step7BannerUploadProps) {
  const toast = useToast();
  const [isRemovingBanner, setIsRemovingBanner] = useState(false);
  const { isOpen: isDeleteModalOpen, onOpen: onDeleteModalOpen, onClose: onDeleteModalClose } = useDisclosure();
  const [deleteType, setDeleteType] = useState<'banner' | 'ai'>('banner');

  // Crop editor state
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  // Stock images (Unsplash) state
  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [stockImages, setStockImages] = useState<UnsplashImage[]>([]);
  const [isLoadingStock, setIsLoadingStock] = useState(false);
  const [stockPage, setStockPage] = useState(1);
  const [stockTotalPages, setStockTotalPages] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // AI image size state
  const [aiImageSize, setAiImageSize] = useState<'1:1' | '16:9'>('16:9');

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropConfirm = async () => {
    if (!cropImageSrc || !croppedAreaPixels) return;
    try {
      const croppedBlob = await getCroppedImg(cropImageSrc, croppedAreaPixels);
      const croppedFile = new File([croppedBlob], 'cropped-banner.png', { type: 'image/png' });
      setBannerImage(croppedFile);
      const previewUrl = URL.createObjectURL(croppedBlob);
      setBannerPreview(previewUrl);
      setCropImageSrc(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    } catch (err) {
      console.error('Crop failed:', err);
      toast({
        title: 'Crop Failed',
        description: 'Failed to crop the image. Please try again.',
        status: 'error',
        position: 'top-right',
      });
    }
  };

  const handleCropCancel = () => {
    setCropImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File Type',
        description: 'Please select an image file (JPEG, PNG, or GIF).',
        status: 'error',
        position: 'top-right',
      });
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({
        title: 'File Too Large',
        description: 'Please select an image file smaller than 5MB.',
        status: 'error',
        position: 'top-right',
      });
      return;
    }

    // Open crop editor instead of directly setting the banner
    const reader = new FileReader();
    reader.onloadend = () => {
      setCropImageSrc(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  // Handle drag leave
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Remove banner image
  const handleRemoveBanner = async () => {
    // If we have a campaignId and bannerId, call the API to remove from DB
    if (campaignId && bannerId) {
      setIsRemovingBanner(true);
      try {
        await donationService.removeBanner(campaignId, bannerId);
        toast({
          title: 'Success',
          description: 'Banner removed successfully',
          status: 'success',
          position: 'top-right',
        });
        // Call the callback to notify parent component
        if (onBannerRemoved) {
          onBannerRemoved();
        }
      } catch (error: any) {
        console.error('Error removing banner from database:', error);
        toast({
          title: 'Error',
          description: error?.message || 'Failed to remove banner from database.',
          status: 'error',
          position: 'top-right',
        });
        setIsRemovingBanner(false);
        return; // Don't clear the preview if API call failed
      } finally {
        setIsRemovingBanner(false);
      }
    }

    // Clear local state
    setBannerImage(null);
    if (bannerPreview) {
      // Only revoke if it's a blob URL
      if (bannerPreview.startsWith('blob:')) {
        URL.revokeObjectURL(bannerPreview);
      }
    }
    setBannerPreview(null);

    // Reset file input
    const fileInput = document.getElementById(
      'banner-upload',
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // Cleanup effect to revoke object URLs on unmount
  useEffect(() => {
    return () => {
      if (bannerPreview && bannerPreview.startsWith('blob:')) {
        URL.revokeObjectURL(bannerPreview);
      }
      if (aiGeneratedImage && aiGeneratedImage.startsWith('blob:')) {
        URL.revokeObjectURL(aiGeneratedImage);
      }
    };
  }, [bannerPreview, aiGeneratedImage]);

  // Generate AI Image using OpenAI
  const handleGenerateAIImage = async () => {
    setIsGeneratingImage(true);
    try {
      if (!aiPrompt.trim()) {
        toast({
          title: 'Validation Error',
          description: 'Please enter a prompt to generate an image.',
          status: 'error',
          position: 'top-right',
        });
        return;
      }

      // Call the API endpoint using donationService with selected size
      const response = await donationService.generateAIImage(aiPrompt.trim(), aiImageSize);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to generate image');
      }

      console.info('🎨 Image generated successfully');

      // Set the base64 image from response.data
      setAiGeneratedImage(response.data);

      // Open crop editor with AI-generated image
      const dataUrl = `data:image/png;base64,${response.data}`;
      setCropImageSrc(dataUrl);

      toast({
        title: 'Success',
        description: 'Image generated successfully!',
        status: 'success',
        position: 'top-right',
      });
    } catch (error: any) {
      console.error('Error generating AI image:', error);

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to generate image. Please try again.';

      toast({
        title: 'Generation Error',
        description: errorMessage,
        status: 'error',
        position: 'top-right',
      });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Remove AI generated image
  const handleRemoveAIImage = async () => {
    // If we have a campaignId and bannerId, call the API to remove from DB
    if (campaignId && bannerId) {
      setIsRemovingBanner(true);
      try {
        await donationService.removeBanner(campaignId, bannerId);
        toast({
          title: 'Success',
          description: 'Banner removed successfully',
          status: 'success',
          position: 'top-right',
        });
        // Call the callback to notify parent component
        if (onBannerRemoved) {
          onBannerRemoved();
        }
      } catch (error: any) {
        console.error('Error removing banner from database:', error);
        toast({
          title: 'Error',
          description: error?.message || 'Failed to remove banner from database.',
          status: 'error',
          position: 'top-right',
        });
        setIsRemovingBanner(false);
        return; // Don't clear the preview if API call failed
      } finally {
        setIsRemovingBanner(false);
      }
    }

    // Clear local state
    setAiGeneratedImage(null);
    setAiPrompt('');
    setBannerPreview(null);
    setBannerImage(null);
  };

  // Open delete confirmation modal
  const handleDeleteClick = (type: 'banner' | 'ai') => {
    setDeleteType(type);
    onDeleteModalOpen();
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (deleteType === 'ai') {
      await handleRemoveAIImage();
    } else {
      await handleRemoveBanner();
    }
    onDeleteModalClose();
  };

  // Check if there's an existing image (either uploaded, AI-generated, or fetched from server)
  const hasExistingImage = !!bannerPreview || !!aiGeneratedImage;

  // Handle preset banner selection - open crop editor
  const handlePresetBannerSelect = async (presetSrc: string, _presetName: string) => {
    try {
      setAiGeneratedImage(null);
      setCropImageSrc(presetSrc);
    } catch (error) {
      console.error('Error selecting preset banner:', error);
      toast({
        title: 'Error',
        description: 'Failed to select preset banner. Please try again.',
        status: 'error',
        position: 'top-right',
      });
    }
  };

  // --- Unsplash Stock Images ---
  const fetchStockImages = useCallback(async (query: string, page: number = 1) => {
    if (!UNSPLASH_ACCESS_KEY || UNSPLASH_ACCESS_KEY === 'YOUR_UNSPLASH_ACCESS_KEY_HERE') {
      toast({
        title: 'Configuration Error',
        description: 'Unsplash API key is not configured. Please set VITE_UNSPLASH_ACCESS_KEY in your .env file.',
        status: 'error',
        position: 'top-right',
      });
      return;
    }

    setIsLoadingStock(true);
    setHasSearched(true);
    try {
      const searchTerm = query.trim() || 'donation charity community';
      const res = await fetch(
        `${UNSPLASH_API_URL}/search/photos?query=${encodeURIComponent(searchTerm)}&page=${page}&per_page=20&orientation=landscape`,
        {
          headers: {
            Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
          },
        },
      );

      if (!res.ok) {
        throw new Error(`Unsplash API error: ${res.status}`);
      }

      const data = await res.json();
      if (page === 1) {
        setStockImages(data.results);
      } else {
        setStockImages((prev) => [...prev, ...data.results]);
      }
      setStockPage(page);
      setStockTotalPages(data.total_pages);
    } catch (error: any) {
      console.error('Error fetching stock images:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to fetch stock images. Please try again.',
        status: 'error',
        position: 'top-right',
      });
    } finally {
      setIsLoadingStock(false);
    }
  }, [toast]);

  // Load default stock images when clicking the Stock Images tab
  useEffect(() => {
    if (tabIndex === 2 && stockImages.length === 0 && !hasSearched) {
      fetchStockImages('', 1);
    }
  }, [tabIndex, stockImages.length, hasSearched, fetchStockImages]);

  const handleStockSearch = () => {
    setStockImages([]);
    setStockPage(1);
    fetchStockImages(stockSearchQuery, 1);
  };

  const handleStockSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setStockSearchQuery(value);

    // Debounce search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      if (value.trim().length >= 2 || value.trim().length === 0) {
        setStockImages([]);
        setStockPage(1);
        fetchStockImages(value, 1);
      }
    }, 500);
  };

  const handleLoadMoreStock = () => {
    fetchStockImages(stockSearchQuery, stockPage + 1);
  };

  // Trigger Unsplash download endpoint (required by Unsplash API guidelines)
  const triggerUnsplashDownload = async (downloadLocation: string) => {
    try {
      await fetch(downloadLocation, {
        headers: {
          Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        },
      });
    } catch {
      // Silent fail – this is just for Unsplash analytics
    }
  };

  const handleStockImageSelect = async (image: UnsplashImage) => {
    try {
      setAiGeneratedImage(null);
      // Use the regular size (1080px wide) for the crop editor
      setCropImageSrc(image.urls.regular);
      // Trigger download as per Unsplash guidelines
      triggerUnsplashDownload(image.links.download_location);
    } catch (error) {
      console.error('Error selecting stock image:', error);
      toast({
        title: 'Error',
        description: 'Failed to select stock image. Please try again.',
        status: 'error',
        position: 'top-right',
      });
    }
  };

  return (
    <>
      <Box maxW="100%" h="85%" overflowY="auto">
        <Text fontSize={stepTitleFontSize ?? '32'} fontWeight={stepTitleFontSize ? 'bold' : 'normal'} color={stepTitleFontSize ? 'gray.900' : 'inherit'} mb="4">
          {stepTitle}
        </Text>

        {/* Crop Editor */}
        {cropImageSrc ? (
          <Box mb="8" pb="4">
            <Text fontSize="sm" color="gray.600" mb="2">
              Drag to reposition and use the slider to zoom. The image will be cropped to a 3:1 ratio.
            </Text>
            <Box
              position="relative"
              width="100%"
              height={{ base: '250px', md: '400px' }}
              bg="gray.900"
              borderRadius="lg"
              overflow="hidden"
            >
              <Button
                position="absolute"
                top="2"
                right="2"
                size="xs"
                zIndex={10}
                onClick={handleCropCancel}
                aria-label="Close crop editor"
                bg="red.500"
                color="white"
                _hover={{ bg: 'red.600' }}
                borderRadius="full"
                minW="24px"
                h="24px"
                p="0"
                fontSize="sm"
              >
                ✕
              </Button>
              <Cropper
                image={cropImageSrc}
                crop={crop}
                zoom={zoom}
                aspect={3 / 1}
                objectFit="contain"
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </Box>
            <HStack mt="3" spacing="4" align="center">
              <Icon as={FiZoomIn} color="gray.500" />
              <Slider
                aria-label="zoom"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(val) => setZoom(val)}
                flex="1"
              >
                <SliderTrack>
                  <SliderFilledTrack bg="blue.500" />
                </SliderTrack>
                <SliderThumb boxSize={4} />
              </Slider>
            </HStack>
          </Box>
        ) : isFetchingBanner ? (
        <Box mb="4">
          <Flex
            borderWidth="2px"
            borderColor="gray.300"
            borderRadius="lg"
            bg="gray.50"
            minH="400px"
            alignItems="center"
            justifyContent="center"
            flexDirection="column"
            gap={4}
          >
            <Spinner
              thickness="4px"
              speed="0.65s"
              emptyColor="gray.200"
              color="blue.500"
              size="xl"
            />
            <Text fontSize="md" color="gray.600" fontWeight="medium">
              Loading banner image...
            </Text>
          </Flex>
        </Box>
      ) : hasExistingImage ? (
        /* Show only the image with delete button when an image exists */
        <Box mb="4">
          <Box
            position="relative"
            borderWidth="2px"
            borderColor="gray.300"
            borderRadius="lg"
            overflow="hidden"
            bg="gray.50"
            mb="4"
          >
            <Box
              as="img"
              src={aiGeneratedImage ? `data:image/png;base64,${aiGeneratedImage}` : bannerPreview}
              alt="Banner preview"
              maxH="400px"
              w="100%"
              objectFit="contain"
              display="block"
              mx="auto"
            />
            <Button
              position="absolute"
              top="2"
              right="2"
              size="sm"
              bg="red.500"
              color="white"
              _hover={{ bg: 'red.600' }}
              onClick={() => handleDeleteClick(aiGeneratedImage ? 'ai' : 'banner')}
              aria-label="Remove image"
              isLoading={isRemovingBanner}
            >
              <Icon as={MdDelete} boxSize={5} />
            </Button>
          </Box>
          {/* {bannerImage && (
            <Box mb="3" p="3" bg="gray.50" borderRadius="md">
              <Text fontSize="sm" fontWeight="semibold" color="gray.700">
                File Name: {bannerImage.name}
              </Text>
              <Text fontSize="xs" color="gray.500">
                Size: {(bannerImage.size / 1024 / 1024).toFixed(2)} MB
              </Text>
              <Text fontSize="xs" color="gray.500">
                Type: {bannerImage.type}
              </Text>
            </Box>
          )} */}
        </Box>
      ) : (
        /* Show tabs only when there's no image */
        <Tabs
          index={tabIndex}
          onChange={(index) => setTabIndex(index)}
          colorScheme="purple"
        >
          <TabList width="100%">
            <Tab width="33.33%" fontSize={{ base: 'xs', md: 'sm' }}>Drag &amp; Drop</Tab>
            <Tab width="33.33%" fontSize={{ base: 'xs', md: 'sm' }}>
              <HStack spacing={1}>
                <Text>
                  <Text as="span" display={{ base: 'none', sm: 'inline' }}>Generate Using </Text>AI
                </Text>
                <Badge
                  colorScheme="purple"
                  fontSize="8px"
                  borderRadius="full"
                  px={2}
                  py={1}
                  marginLeft={1}
                  display={{ base: 'none', sm: 'inline-flex' }}
                >
                  BETA
                </Badge>
              </HStack>
            </Tab>
            <Tab width="33.33%" fontSize={{ base: 'xs', md: 'sm' }}>Stock Images</Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              {/* Preset Banner Images Section */}
              <Box mb="6">
                <Text fontSize="sm" color="gray.600" mb="4">
                  Select a banner image from our curated collection of donation campaign visuals
                </Text>
                <Flex gap={3} w="100%" flexWrap="wrap">
                  {presetBanners.map((preset) => (
                    <Box
                      key={preset.id}
                      position="relative"
                      cursor="pointer"
                      onClick={() => handlePresetBannerSelect(preset.src, preset.name)}
                      transition="all 0.2s"
                      _hover={{ transform: 'scale(1.03)' }}
                      flex={{ base: '1 1 calc(33% - 8px)', sm: '1' }}
                      minW={{ base: '80px', sm: '0' }}
                      h={{ base: '60px', sm: '80px', md: '90px' }}
                      borderRadius="lg"
                      overflow="hidden"
                    >
                      <Image
                        src={preset.src}
                        alt={preset.name}
                        w="100%"
                        h="100%"
                        objectFit="cover"
                        border="1px solid"
                        borderColor="gray.200"
                        _hover={{ borderColor: 'blue.400' }}
                      />
                      {/* Gradient overlay for text readability */}
                      <Box
                        position="absolute"
                        bottom="0"
                        left="0"
                        right="0"
                        bgGradient="linear(to-t, blackAlpha.700, transparent)"
                        px={2}
                        py={1}
                      >
                        <Text
                          fontSize="xs"
                          color="white"
                          textAlign="center"
                          fontWeight="semibold"
                          textShadow="0 1px 3px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.5)"
                        >
                          {preset.name}
                        </Text>
                      </Box>
                    </Box>
                  ))}
                </Flex>
              </Box>

              <Box mb="6">
                {/* Hidden file input */}
                <Input
                  type="file"
                  accept="image/jpeg,image/png,image/gif"
                  display="none"
                  id="banner-upload"
                  onChange={handleFileInputChange}
                />

                {/* Drag and Drop Area */}
                <Box
                  as="label"
                  htmlFor="banner-upload"
                  borderWidth="2px"
                  borderStyle="dashed"
                  borderColor={isDragging ? 'blue.500' : 'blue.300'}
                  borderRadius="lg"
                  bg={isDragging ? 'blue.100' : 'blue.50'}
                  p={{ base: 6, md: 12 }}
                  textAlign="center"
                  cursor="pointer"
                  transition="all 0.2s"
                  display="block"
                  _hover={{ borderColor: 'blue.500', bg: 'blue.100' }}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <VStack spacing="3">
                    <Box color="blue.500" fontSize="4xl">
                      <svg
                        width="50"
                        height="50"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
                      </svg>
                    </Box>
                    <Text fontWeight="semibold" color="gray.700">
                      {isDragging
                        ? 'Drop Your Image Here'
                        : 'Drag & Drop Your Image'}
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                      or click to browse your files
                    </Text>
                  </VStack>
                </Box>

                <Text
                  fontSize="sm"
                  color="gray.500"
                  mt="3"
                  textAlign="center"
                >
                  Supported formats: JPG, PNG, GIF (Max size: 5MB)
                </Text>
              </Box>
            </TabPanel>
            <TabPanel>
              <Box
                mb="6"
                p="4"
                borderWidth="1px"
                borderColor="gray.200"
                borderRadius="lg"
                bg="gray.50"
              >
                <Box>
                  <Text fontSize="lg" mb="4" fontWeight="semibold">
                    Generate Image with AI
                  </Text>
                  <Text fontSize="sm" color="gray.600" mb="4">
                    Enter a description to generate a banner image using
                    AI (powered by OpenAI DALL-E)
                  </Text>

                  {/* Image Size Selector */}
                  <Box mb="4">
                    <Text fontSize="sm" fontWeight="medium" color="gray.700" mb="2">
                      Image Size
                    </Text>
                    <HStack spacing="3">
                      <Box
                        as="button"
                        type="button"
                        onClick={() => setAiImageSize('16:9')}
                        px="4"
                        py="2.5"
                        borderRadius="lg"
                        borderWidth="2px"
                        borderColor={aiImageSize === '16:9' ? 'blue.500' : 'gray.200'}
                        bg={aiImageSize === '16:9' ? 'blue.50' : 'white'}
                        cursor="pointer"
                        transition="all 0.2s"
                        _hover={{ borderColor: 'blue.400', bg: 'blue.50' }}
                        flex="1"
                        textAlign="center"
                      >
                        <VStack spacing="1">
                          <Box
                            w="48px"
                            h="27px"
                            borderRadius="4px"
                            bg={aiImageSize === '16:9' ? 'blue.400' : 'gray.300'}
                            transition="all 0.2s"
                          />
                          <Text
                            fontSize="sm"
                            fontWeight={aiImageSize === '16:9' ? '600' : '400'}
                            color={aiImageSize === '16:9' ? 'blue.600' : 'gray.600'}
                          >
                            16:9 Widescreen
                          </Text>
                        </VStack>
                      </Box>
                      <Box
                        as="button"
                        type="button"
                        onClick={() => setAiImageSize('1:1')}
                        px="4"
                        py="2.5"
                        borderRadius="lg"
                        borderWidth="2px"
                        borderColor={aiImageSize === '1:1' ? 'blue.500' : 'gray.200'}
                        bg={aiImageSize === '1:1' ? 'blue.50' : 'white'}
                        cursor="pointer"
                        transition="all 0.2s"
                        _hover={{ borderColor: 'blue.400', bg: 'blue.50' }}
                        flex="1"
                        textAlign="center"
                      >
                        <VStack spacing="1">
                          <Box
                            w="32px"
                            h="32px"
                            borderRadius="4px"
                            bg={aiImageSize === '1:1' ? 'blue.400' : 'gray.300'}
                            transition="all 0.2s"
                          />
                          <Text
                            fontSize="sm"
                            fontWeight={aiImageSize === '1:1' ? '600' : '400'}
                            color={aiImageSize === '1:1' ? 'blue.600' : 'gray.600'}
                          >
                            1:1 Square
                          </Text>
                        </VStack>
                      </Box>
                    </HStack>
                  </Box>

                  <Flex gap="3" mb="4" align="flex-end">
                    <Box flex="1">
                      <FormControl>
                        <Input
                          placeholder="e.g., A professional membership banner with a modern community feel"
                          value={aiPrompt}
                          onChange={(e) => setAiPrompt(e.target.value)}
                          border="1px solid"
                          borderRadius="md"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !isGeneratingImage) {
                              e.preventDefault();
                              handleGenerateAIImage();
                            }
                          }}
                        />
                      </FormControl>
                    </Box>
                    <Button
                      colorScheme="blue"
                      size="sm"
                      onClick={handleGenerateAIImage}
                      isLoading={isGeneratingImage}
                      loadingText="Generating..."
                      disabled={!aiPrompt.trim() || isGeneratingImage}
                    >
                      Generate Image
                    </Button>
                  </Flex>
                </Box>
              </Box>
            </TabPanel>

            {/* Stock Images Tab */}
            <TabPanel>
              <Box mb="6">
              

                {/* Search Bar */}
                <Flex gap="3" mb="4" align="center">
                  <InputGroup flex="1">
                    <Input
                      placeholder="Search stock images (e.g., charity, education, community)..."
                      value={stockSearchQuery}
                      onChange={handleStockSearchInputChange}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleStockSearch();
                        }
                      }}
                      border="1px solid"
                      borderRadius="md"
                    />
                    <InputRightElement>
                      <IconButton
                        aria-label="Search stock images"
                        icon={<Icon as={FiSearch} />}
                        size="sm"
                        variant="ghost"
                        onClick={handleStockSearch}
                        isLoading={isLoadingStock}
                      />
                    </InputRightElement>
                  </InputGroup>
                </Flex>

                {/* Results Grid */}
                {isLoadingStock && stockImages.length === 0 ? (
                  <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} spacing={3}>
                    {Array.from({ length: 8 }).map((_, i) => (
                      <Skeleton
                        key={i}
                        height="140px"
                        borderRadius="lg"
                      />
                    ))}
                  </SimpleGrid>
                ) : stockImages.length > 0 ? (
                  <>
                    <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} spacing={3}>
                      {stockImages.map((image) => (
                        <Box
                          key={image.id}
                          position="relative"
                          cursor="pointer"
                          borderRadius="lg"
                          overflow="hidden"
                          transition="all 0.2s"
                          _hover={{
                            transform: 'scale(1.03)',
                            boxShadow: 'lg',
                          }}
                          onClick={() => handleStockImageSelect(image)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleStockImageSelect(image);
                            }
                          }}
                        >
                          <Image
                            src={image.urls.small}
                            alt={image.alt_description || 'Stock image'}
                            w="100%"
                            h="140px"
                            objectFit="cover"
                            border="1px solid"
                            borderColor="gray.200"
                            borderRadius="lg"
                            _hover={{ borderColor: 'blue.400' }}
                          />
                          {/* Attribution overlay */}
                          <Box
                            position="absolute"
                            bottom="0"
                            left="0"
                            right="0"
                            bgGradient="linear(to-t, blackAlpha.700, transparent)"
                            px={2}
                            py={1}
                          >
                            <Text
                              fontSize="10px"
                              color="white"
                              textAlign="right"
                              noOfLines={1}
                            >
                              {image.user.name}
                            </Text>
                          </Box>
                        </Box>
                      ))}
                    </SimpleGrid>

                    {/* Load More Button */}
                    {stockPage < stockTotalPages && (
                      <Flex justifyContent="center" mt="4">
                        <Button
                          size="sm"
                          colorScheme="blue"
                          variant="outline"
                          onClick={handleLoadMoreStock}
                          isLoading={isLoadingStock}
                          loadingText="Loading..."
                        >
                          Load More
                        </Button>
                      </Flex>
                    )}

                    {/* Unsplash attribution */}
                    
                  </>
                ) : hasSearched ? (
                  <Flex
                    direction="column"
                    alignItems="center"
                    justifyContent="center"
                    py="10"
                    color="gray.500"
                  >
                    <Icon as={FiSearch} boxSize={10} mb="3" color="gray.300" />
                    <Text fontSize="md" fontWeight="medium">
                      No images found
                    </Text>
                    <Text fontSize="sm" mt="1">
                      Try a different search term
                    </Text>
                  </Flex>
                ) : null}
              </Box>
            </TabPanel>
          </TabPanels>
        </Tabs>
      )}

        <ConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={onDeleteModalClose}
          onConfirm={handleDeleteConfirm}
          title="Delete Banner Image"
          message="Are you sure you want to delete this banner image? This action cannot be undone."
          confirmText="Yes, Delete"
          type="danger"
          isLoading={isRemovingBanner}
        />
      </Box>

      {renderNavigation ? renderNavigation(cropImageSrc, handleCropConfirm) : (
        <Box maxW="100%" h="10%">
          <StepNavigationButtons
            onPrev={onPrevStep}
            onSkip={cropImageSrc ? undefined : onSkip}
            onNext={cropImageSrc ? handleCropConfirm : onSaveAndNext}
            nextLabel={cropImageSrc ? 'Crop & Apply' : 'Save & Next'}
            onSaveAndExit={cropImageSrc ? undefined : onSaveAndExit}
            isSubmitting={isSubmitting || isUploadingBanner}
            isSavingAndExiting={isSavingAndExiting}
            loadingText="Uploading..."
            showSkip={!cropImageSrc}
            disableSkip={!!bannerPreview}
            disableNext={cropImageSrc ? false : !bannerPreview}
          />
        </Box>
      )}
    </>
  );
}
