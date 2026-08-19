import React, { useEffect, useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Box,
  Text,
  Button,
  Icon,
  Image,
  useToast,
} from '@chakra-ui/react';
import { FiCopy, FiChevronLeft, FiDownload } from 'react-icons/fi';
import QRService from '../../../../../service/organizer/donation/QRService';
import Loader from '../../../../common/Loader';
import idealiQrLogo from '../../../../../../assets/img/logo/ideali-qr.svg';

interface MembershipQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  membershipId: string;
  membershipName: string;
}

const QR_WIDTH = 300;
const QR_HEIGHT = 300;

export default function MembershipQRModal({
  isOpen,
  onClose,
  membershipId,
  membershipName,
}: MembershipQRModalProps) {
  const toast = useToast();
  const signUpUrl = `${window.location.origin}/membership/register/${membershipId}`;

  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);

  const generateQRCode = async () => {
    setQrLoading(true);
    setQrError(null);
    try {
      if (qrCodeData && qrCodeData.startsWith('blob:')) {
        URL.revokeObjectURL(qrCodeData);
      }
      const qrBlobUrl = await QRService.generateQRCode(signUpUrl, QR_WIDTH, QR_HEIGHT, false);
      setQrCodeData(qrBlobUrl);
    } catch (err: any) {
      let errorMessage = 'Failed to generate QR code. Please try again.';
      if (err?.response?.status === 404) {
        errorMessage = 'QR code generation service not found. Please contact support.';
      } else if (err?.response?.status === 400) {
        errorMessage = 'Invalid membership data. Please check the membership type.';
      } else if (err?.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (err?.message) {
        errorMessage = err.message;
      }
      setQrError(errorMessage);
    } finally {
      setQrLoading(false);
    }
  };

  // ── Generate QR code when the modal opens ──
  useEffect(() => {
    if (isOpen && membershipId && !qrCodeData && !qrLoading) {
      generateQRCode();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, membershipId]);

  // ── Reset / cleanup when modal closes ──
  useEffect(() => {
    if (!isOpen) {
      if (qrCodeData && qrCodeData.startsWith('blob:')) {
        URL.revokeObjectURL(qrCodeData);
      }
      setQrCodeData(null);
      setQrError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // ── Cleanup on unmount ──
  useEffect(() => {
    return () => {
      if (qrCodeData && qrCodeData.startsWith('blob:')) {
        URL.revokeObjectURL(qrCodeData);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qrCodeData]);

  const handleCopyQRLink = async () => {
    try {
      await navigator.clipboard.writeText(signUpUrl);
      toast({
        title: 'Link Copied',
        description: 'QR link copied to clipboard!',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch {
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy link. Please try it manually.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDownloadQR = async () => {
    if (!qrCodeData) return;
    try {
      const response = await fetch(qrCodeData);
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${membershipName.replace(/[^a-z0-9]/gi, '_')}_QR_Code.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      toast({
        title: 'QR Code Downloaded',
        description: 'Your QR code has been downloaded successfully.',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch {
      toast({
        title: 'Download Failed',
        description: 'Failed to download QR code. Please try again!',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" isCentered>
      <ModalOverlay bg="blackAlpha.600" />
      <ModalContent maxW="480px" borderRadius="xl" overflow="hidden">
        {/* ── Blue Header ── */}
        <Box bg="#044bd9" pt={6} pb={4} px={6} position="relative">
          <ModalCloseButton color="white" top={4} right={4} _hover={{ bg: 'whiteAlpha.200' }} />
          <VStack spacing={1} align="center">
            <Text color="white" fontSize="lg" fontWeight="semibold">QR Code</Text>
            <Text color="whiteAlpha.800" fontSize="sm">Scan QR</Text>
          </VStack>
        </Box>

        {/* ── Body ── */}
        <ModalBody p={0}>
          <Box px={4} py={4}>
            <VStack spacing={1} align="stretch">
              {/* QR Code Display */}
              <Box display="flex" justifyContent="center" alignItems="center" h="280px">
                {qrLoading ? (
                  <Loader message="Generating QR Code" subtitle="Please wait..." />
                ) : qrError ? (
                  <VStack spacing={3}>
                    <Text color="red.500" fontSize="sm" textAlign="center">{qrError}</Text>
                    <Button size="sm" colorScheme="blue" onClick={generateQRCode}>Try Again</Button>
                  </VStack>
                ) : qrCodeData ? (
                  <Box p={4} bg="white" borderRadius="md" position="relative">
                    <Image
                      src={qrCodeData}
                      alt="Membership QR Code"
                      width="240px"
                      height="240px"
                      objectFit="contain"
                    />
                    <Image
                      src={idealiQrLogo}
                      alt="ideali"
                      position="absolute"
                      top="50%"
                      left="50%"
                      transform="translate(-50%, -50%)"
                      h="28px"
                      borderRadius="sm"
                      boxShadow="0 0 0 4px white"
                    />
                  </Box>
                ) : null}
              </Box>

              {/* Description */}
              <Text fontSize="sm" color="gray.600" textAlign="center" px={2}>
                Scan this QR code to activate your membership instantly!
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
                  onClick={handleCopyQRLink}
                  isDisabled={!qrCodeData || qrLoading}
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
                  isDisabled={!qrCodeData || qrLoading}
                >
                  Download QR
                </Button>
              </HStack>

              {/* Back Button */}
              <HStack justify="flex-start">
                <Button
                  variant="ghost"
                  leftIcon={<Icon as={FiChevronLeft} />}
                  onClick={onClose}
                  size="sm"
                  color="gray.600"
                  _hover={{ bg: 'gray.50' }}
                >
                  Back
                </Button>
              </HStack>
            </VStack>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
