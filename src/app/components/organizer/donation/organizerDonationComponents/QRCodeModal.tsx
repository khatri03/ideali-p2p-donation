import React, { useEffect, useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  Text,
  Image,
  Box,
  HStack,
  useToast,
  Icon,
} from '@chakra-ui/react';
import { FiCopy, FiDownload, FiChevronLeft } from 'react-icons/fi';
import QRService from '../../../../service/organizer/donation/QRService';
import Loader from '../../../common/Loader';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId: string;
  campaignName?: string;
  onBack?: () => void; // Optional callback to go back to share modal
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  campaignId,
  campaignName = 'Campaign',
  onBack,
}) => {
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [donationLink, setDonationLink] = useState<string>('');
  
  // Fixed dimensions
  const QR_WIDTH = 300;
  const QR_HEIGHT = 300;
  
  const toast = useToast();

  useEffect(() => {
    if (isOpen && campaignId) {
      generateQRCode();
    }
    
    // Cleanup blob URLs when modal closes
    return () => {
      if (qrCodeData && qrCodeData.startsWith('blob:')) {
        URL.revokeObjectURL(qrCodeData);
      }
    };
  }, [isOpen, campaignId]);

  const generateQRCode = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Clean up previous blob URL
      if (qrCodeData && qrCodeData.startsWith('blob:')) {
        URL.revokeObjectURL(qrCodeData);
      }

      // Get the donation link
      const link = QRService.getDonationLink(campaignId);
      setDonationLink(link);
      
      // Generate QR code with fixed 300x300 dimensions
      const qrBlobUrl = await QRService.generateCampaignQRCode(
        campaignId,
        QR_WIDTH,
        QR_HEIGHT,
        false // includeLogo set to false
      );
      setQrCodeData(qrBlobUrl);
    } catch (err: any) {
      console.error('Error generating QR code:', err);
      
      let errorMessage = 'Failed to generate QR code. Please try again.';
      
      if (err?.response?.status === 404) {
        errorMessage = 'QR code generation service not found. Please contact support.';
      } else if (err?.response?.status === 400) {
        errorMessage = 'Invalid campaign data. Please check the campaign ID.';
      } else if (err?.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadQR = async () => {
    if (!qrCodeData) return;

    try {
      // Fetch the blob from the blob URL
      const response = await fetch(qrCodeData);
      const blob = await response.blob();
      
      // Create download link
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${campaignName.replace(/[^a-z0-9]/gi, '_')}_QR_Code.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the temporary URL
      URL.revokeObjectURL(link.href);

      toast({
        title: 'QR Code Downloaded',
        description: 'Your QR code has been downloaded successfully.',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Error downloading QR code:', err);
      toast({
        title: 'Download Failed',
        description: 'Failed to download QR code. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(donationLink);
      toast({
        title: 'Link Copied',
        description: 'QR link copied to clipboard!',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Error copying link:', err);
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy link. Please try it manually.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleModalClose = () => {
    // Clean up blob URL when closing
    if (qrCodeData && qrCodeData.startsWith('blob:')) {
      URL.revokeObjectURL(qrCodeData);
    }
    setQrCodeData(null);
    setError(null);
    onClose();
  };

  const handleBack = () => {
    if (onBack) {
      handleModalClose();
      onBack();
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleModalClose} 
      size="2xl"
      isCentered
    >
      <ModalOverlay bg="blackAlpha.600" />
      <ModalContent maxW="650px" minH="300px" borderRadius="xl" overflow="hidden">
        {/* Blue Header */}
        <Box bg="#044bd9" pt={6} pb={4} px={6} position="relative">
          <ModalCloseButton 
            color="white" 
            top={4} 
            right={4}
            _hover={{ bg: 'whiteAlpha.200' }}
          />
          {/* <Text color="white" fontSize="lg" fontWeight="semibold" textAlign="center">
            QR Code
          </Text> */}
          <VStack spacing={1} align="center">
            <Text color="white" fontSize="lg" fontWeight="semibold">
              QR Code
            </Text>
            <Text color="whiteAlpha.800" fontSize="sm">
              Copy and share via email, SMS or social.
            </Text>
          </VStack>
        </Box>

        <ModalBody p={0}>
          <Box px={6} py={6}>
            <VStack spacing={3} align="stretch">
              {/* QR Code Display */}
              <Box 
                display="flex" 
                justifyContent="center" 
                alignItems="center" 
                h="280px"
              >
                {loading ? (
                  <Loader
                    message="Generating QR Code"
                    subtitle="Please wait..."
                  />
                ) : error ? (
                  <VStack spacing={3}>
                    <Text color="red.500" fontSize="sm" textAlign="center">
                      {error}
                    </Text>
                    <Button 
                      size="sm" 
                      colorScheme="blue" 
                      onClick={generateQRCode}
                    >
                      Try Again
                    </Button>
                  </VStack>
                ) : qrCodeData ? (
                  <Box
                    p={4}
                    bg="white"
                    borderRadius="md"
                  >
                    <Image
                      src={qrCodeData}
                      alt="Campaign QR Code"
                      width="240px"
                      height="240px"
                      objectFit="contain"
                    />
                  </Box>
                ) : null}
              </Box>

              {/* Description */}
              <Text 
                fontSize="sm" 
                color="gray.600" 
                textAlign="center"
                px={4}
              >
                Scan this QR code to open the campaign page directly.
              </Text>

              {/* Action Buttons */}
              <HStack spacing={3} pt={2}>
                <Button
                  flex={1}
                  leftIcon={<Icon as={FiCopy} />}
                  bg="white"
                  color="gray.700"
                  borderWidth="1px"
                  borderColor="gray.300"
                  _hover={{ bg: 'gray.50' }}
                  onClick={handleCopyLink}
                  isDisabled={!qrCodeData || loading}
                >
                  Copy QR Link
                </Button>
                <Button
                  flex={1}
                  leftIcon={<Icon as={FiDownload} />}
                  bg="#044bd9"
                  color="white"
                  _hover={{ bg: '#033fb6' }}
                  onClick={handleDownloadQR}
                  isDisabled={!qrCodeData || loading}
                >
                  Download QR
                </Button>
              </HStack>

              {/* Back Button */}
              {onBack && (
                <HStack justify="flex-start">
                  <Button
                    variant="ghost"
                    leftIcon={<Icon as={FiChevronLeft} />}
                    onClick={handleBack}
                    size="sm"
                    color="gray.600"
                    _hover={{ bg: 'gray.50' }}
                  >
                    Back
                  </Button>
                </HStack>
              )}
            </VStack>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default QRCodeModal;