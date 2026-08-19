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
  Input,
  InputGroup,
  InputRightElement,
  Button,
  Icon,
  useToast,
  Flex,
  IconButton,
  Image,
} from '@chakra-ui/react';
import { FiCopy, FiArrowRight, FiChevronLeft, FiDownload } from 'react-icons/fi';
import { FaFacebookF, FaFacebookMessenger } from 'react-icons/fa';
import { MdEmail } from 'react-icons/md';
import { MdQrCode2 } from 'react-icons/md';
import { BiCodeAlt } from 'react-icons/bi';
import QRService from '../../../../service/organizer/donation/QRService';
import Loader from '../../../common/Loader';
import { hasPermission } from 'app/service/organizer/rolesPermissions/permissionsService';

type ModalView = 'share' | 'qr' | 'embed';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId: string;
  campaignName: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  campaignId,
  campaignName,
}) => {
  const toast = useToast();
  const domain = window.location.origin;

  const canViewQrCode   = hasPermission('Donation.Campaign.ViewQrCode');
  const canViewEmbedCode = hasPermission('Donation.Campaign.ViewEmbeddedCode');
  const shareUrl = `${domain}/donate/${campaignId}`;

  // ── View state ──
  const [view, setView] = useState<ModalView>('share');

  // ── QR Code state ──
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const QR_WIDTH = 300;
  const QR_HEIGHT = 300;

  // ── Embed state ──
  const [activeTab, setActiveTab] = useState<'inline' | 'popup'>('inline');

  const inlineCode = `<iframe src="${domain}/donate/${campaignId}" 
  style="border:0;
  width:100%;
  height:1100px;">

  </iframe>`;

  const popupCode = `<button onclick="openDonationPopup()" 
        style="
            padding: 8px 18px;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
        ">
    Donate
</button>

<script>
function openDonationPopup() {
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.background = "rgba(0,0,0,0.5)";
    overlay.style.display = "flex";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    overlay.style.zIndex = "99999";
    overlay.style.padding = "10px"; 

    const modal = document.createElement("div");
    modal.style.background = "white";
    modal.style.padding = "6px";
    modal.style.borderRadius = "8px";
    modal.style.position = "relative";
    modal.style.width = "90%";        
    modal.style.maxWidth = "500px";   
    modal.style.height = "auto";

    const closeBtn = document.createElement("div");
    closeBtn.innerHTML = "✕";
    closeBtn.style.position = "absolute";
    closeBtn.style.top = "8px";
    closeBtn.style.right = "12px";
    closeBtn.style.cursor = "pointer";
    closeBtn.style.fontSize = "18px";
    closeBtn.style.fontWeight = "bold";
    closeBtn.onclick = () => overlay.remove();

    const frame = document.createElement("iframe");
    frame.src = "${domain}/donate/${campaignId}";
    frame.style.width = "100%";          
    frame.style.height = "85vh";        
    frame.style.border = "0";
    frame.style.borderRadius = "6px";

    modal.appendChild(closeBtn);
    modal.appendChild(frame);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
}
</script>

`;

  // ── Reset to share view when modal opens/closes ──
  useEffect(() => {
    if (!isOpen) {
      setView('share');
      // Clean up QR blob URL
      if (qrCodeData && qrCodeData.startsWith('blob:')) {
        URL.revokeObjectURL(qrCodeData);
      }
      setQrCodeData(null);
      setQrError(null);
    }
  }, [isOpen]);

  // ── Generate QR code when switching to QR view ──
  useEffect(() => {
    if (view === 'qr' && campaignId && !qrCodeData && !qrLoading) {
      generateQRCode();
    }
  }, [view, campaignId]);

  // ── Cleanup on unmount ──
  useEffect(() => {
    return () => {
      if (qrCodeData && qrCodeData.startsWith('blob:')) {
        URL.revokeObjectURL(qrCodeData);
      }
    };
  }, [qrCodeData]);

  // ── Handlers: Share view ──
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: 'Link copied!',
      description: 'Campaign link has been copied to clipboard',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const handleFacebookShare = () => {
    const apiBase = (import.meta.env.VITE_API_BASE_URL as string)?.replace(/\/$/, '') || '';
    const fbshareUrl = `${apiBase}/api/social-sharing/share/facebook/${campaignId}`;
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fbshareUrl)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Support the campaign: ${campaignName}`);
    const body = encodeURIComponent(
        `Hi,\n\nI'd love for you to support this campaign: ${campaignName}.\n\nClick here to donate: ${shareUrl}\n\nThank you!`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleMessengerShare = () => {
    const apiBase = (import.meta.env.VITE_API_BASE_URL as string)?.replace(/\/$/, '') || '';
    const fbshareUrl = `${apiBase}/api/social-sharing/share/facebook/${campaignId}`.trim();;

    const messengerUrl = `https://www.facebook.com/dialog/send?link=${encodeURIComponent(fbshareUrl)}&app_id=1489707369239658&redirect_uri=${encodeURIComponent(window.location.origin)}`;
    window.open(messengerUrl, '_blank', 'width=600,height=400');
  };

  // ── Handlers: QR view ──
  const generateQRCode = async () => {
    setQrLoading(true);
    setQrError(null);
    try {
      if (qrCodeData && qrCodeData.startsWith('blob:')) {
        URL.revokeObjectURL(qrCodeData);
      }
      const qrBlobUrl = await QRService.generateCampaignQRCode(
        campaignId,
        QR_WIDTH,
        QR_HEIGHT,
        false
      );
      setQrCodeData(qrBlobUrl);
    } catch (err: any) {
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
      setQrError(errorMessage);
    } finally {
      setQrLoading(false);
    }
  };

  const handleDownloadQR = async () => {
    if (!qrCodeData) return;
    try {
      const response = await fetch(qrCodeData);
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${campaignName.replace(/[^a-z0-9]/gi, '_')}_QR_Code.png`;
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
    } catch (err) {
      toast({
        title: 'Download Failed',
        description: 'Failed to download QR code. Please try again!',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleCopyQRLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
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

  // ── Handlers: Embed view ──
  const handleCopyEmbed = () => {
    const code = activeTab === 'inline' ? inlineCode : popupCode;
    navigator.clipboard.writeText(code);
    toast({
      title: 'Code copied!',
      description: 'Embed code has been copied to clipboard',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  // ── Header titles per view ──
  const headerTitle = {
    share: 'Share your link to start receiving contributions',
    qr: 'QR Code',
    embed: 'Select your embed method',
  }[view];

  const headerSubtitle = {
    share: 'Copy and share via email, SMS or social',
    qr: 'Scan QR',
    embed: 'Share where you want to receive contributions',
  }[view];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" isCentered>
      <ModalOverlay bg="blackAlpha.600" />
      <ModalContent maxW="650px" minH="520px" borderRadius="xl" overflow="hidden">

        {/* ── Blue Header ── */}
        <Box bg="#044bd9" pt={6} pb={4} px={6} position="relative">
          <ModalCloseButton
            color="white"
            top={4}
            right={4}
            _hover={{ bg: 'whiteAlpha.200' }}
          />
          <VStack spacing={1} align="center">
            <Text color="white" fontSize="lg" fontWeight="semibold">
              {headerTitle}
            </Text>
            <Text color="whiteAlpha.800" fontSize="sm">
              {headerSubtitle}
            </Text>
          </VStack>
        </Box>

        {/* ── Body ── */}
        <ModalBody p={0}>

          {/* ══ SHARE VIEW ══ */}
          {view === 'share' && (
            <Box px={6} py={6}>
              <VStack spacing={4} align="stretch">
                {/* Link Copy Section */}
                <InputGroup size="md">
                  <Input
                    value={shareUrl}
                    readOnly
                    pr="4.5rem"
                    bg="gray.50"
                    borderColor="gray.200"
                    fontSize="sm"
                    _focus={{ borderColor: '#044bd9', boxShadow: '0 0 0 1px #044bd9' }}
                  />
                  <InputRightElement width="4.5rem">
                    <Button
                      h="1.75rem"
                      size="sm"
                      bg="#044bd9"
                      color="white"
                      _hover={{ bg: '#033fb6' }}
                      onClick={handleCopyLink}
                      leftIcon={<Icon as={FiCopy} />}
                    >
                      Copy
                    </Button>
                  </InputRightElement>
                </InputGroup>

                {/* QR Code Option */}
                {canViewQrCode && (
                  <Box
                    borderWidth="1px"
                    borderColor="gray.200"
                    borderRadius="md"
                    p={4}
                    cursor="pointer"
                    _hover={{ bg: 'gray.50', borderColor: 'gray.300' }}
                    onClick={() => setView('qr')}
                  >
                    <Flex justify="space-between" align="center">
                      <HStack spacing={3}>
                        <Box bg="blue.50" p={2} borderRadius="md">
                          <Icon as={MdQrCode2} boxSize={6} color="#044bd9" />
                        </Box>
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="semibold" fontSize="md">QR code</Text>
                          <Text fontSize="xs" color="gray.600">
                            Place on all printed assets e.g mail, flyers, letters and posters.
                          </Text>
                        </VStack>
                      </HStack>
                      <Icon as={FiArrowRight} boxSize={5} color="gray.400" />
                    </Flex>
                  </Box>
                )}

                {/* Embed Code Option */}
                {canViewEmbedCode && (
                  <Box
                    borderWidth="1px"
                    borderColor="gray.200"
                    borderRadius="md"
                    p={4}
                    cursor="pointer"
                    _hover={{ bg: 'gray.50', borderColor: 'gray.300' }}
                    onClick={() => setView('embed')}
                  >
                    <Flex justify="space-between" align="center">
                      <HStack spacing={3}>
                        <Box bg="blue.50" p={2} borderRadius="md">
                          <Icon as={BiCodeAlt} boxSize={6} color="#044bd9" />
                        </Box>
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="semibold" fontSize="md">Get embed code</Text>
                          <Text fontSize="xs" color="gray.600">
                            Choose between an on-page embed or a popup window.
                          </Text>
                        </VStack>
                      </HStack>
                      <Icon as={FiArrowRight} boxSize={5} color="gray.400" />
                    </Flex>
                  </Box>
                )}

                {/* Social Share Buttons */}
                <HStack spacing={3} justify="center" pt={10}>
                  <IconButton
                    aria-label="Share on Facebook"
                    icon={<Icon as={FaFacebookF} />}
                    bg="#1877F2"
                    color="white"
                    borderRadius="full"
                    size="lg"
                    _hover={{ bg: '#166FE5' }}
                    onClick={handleFacebookShare}
                  />
                  <IconButton
                    aria-label="Send via Email"
                    icon={<Icon as={MdEmail} />}
                    bg="#EA4335"
                    color="white"
                    borderRadius="full"
                    size="lg"
                    _hover={{ bg: '#c5382b' }}
                    onClick={handleEmailShare}
                  />
                  <IconButton
                    aria-label="Send on Facebook Messenger"
                    icon={<Icon as={FaFacebookMessenger} />}
                    bg="#0084FF"
                    color="white"
                    borderRadius="full"
                    size="lg"
                    _hover={{ bg: '#006fd6' }}
                    onClick={handleMessengerShare}
                  />
                </HStack>
              </VStack>
            </Box>
          )}

          {/* ══ QR CODE VIEW ══ */}
          {view === 'qr' && (
            <Box px={4} py={4}>
              <VStack spacing={1} align="stretch">
                {/* QR Code Display */}
                <Box
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  h="280px"
                >
                  {qrLoading ? (
                    <Loader message="Generating QR Code" subtitle="Please wait..." />
                  ) : qrError ? (
                    <VStack spacing={3}>
                      <Text color="red.500" fontSize="sm" textAlign="center">
                        {qrError}
                      </Text>
                      <Button size="sm" colorScheme="blue" onClick={generateQRCode}>
                        Try Again
                      </Button>
                    </VStack>
                  ) : qrCodeData ? (
                    <Box p={4} bg="white" borderRadius="md">
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
                <Text fontSize="sm" color="gray.600" textAlign="center" px={2}>
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
                    onClick={() => setView('share')}
                    size="sm"
                    color="gray.600"
                    _hover={{ bg: 'gray.50' }}
                  >
                    Back
                  </Button>
                </HStack>
              </VStack>
            </Box>
          )}

          {/* ══ EMBED CODE VIEW ══ */}
          {view === 'embed' && (
            <VStack spacing={0} align="stretch">
              {/* Tabs */}
              <HStack spacing={0} bg="gray.50" borderBottomWidth="1px" borderColor="gray.200">
                <Button
                  flex={1}
                  variant="ghost"
                  borderRadius="0"
                  py={4}
                  bg={activeTab === 'inline' ? 'white' : 'transparent'}
                  borderBottomWidth={activeTab === 'inline' ? '2px' : '0'}
                  borderBottomColor="#044bd9"
                  color={activeTab === 'inline' ? 'gray.800' : 'gray.600'}
                  fontWeight={activeTab === 'inline' ? 'semibold' : 'normal'}
                  _hover={{ bg: activeTab === 'inline' ? 'white' : 'gray.100' }}
                  onClick={() => setActiveTab('inline')}
                >
                  Embed inline HTML
                </Button>
                <Button
                  flex={1}
                  variant="ghost"
                  borderRadius="0"
                  py={4}
                  bg={activeTab === 'popup' ? 'white' : 'transparent'}
                  borderBottomWidth={activeTab === 'popup' ? '2px' : '0'}
                  borderBottomColor="#044bd9"
                  color={activeTab === 'popup' ? 'gray.800' : 'gray.600'}
                  fontWeight={activeTab === 'popup' ? 'semibold' : 'normal'}
                  _hover={{ bg: activeTab === 'popup' ? 'white' : 'gray.100' }}
                  onClick={() => setActiveTab('popup')}
                >
                  Embed popup form
                </Button>
              </HStack>

              {/* Content */}
              <Box px={6} py={6}>
                <VStack spacing={4} align="stretch">
                  {/* Instruction Text */}
                  <Text color="#044bd9" fontWeight="medium" fontSize="sm">
                    {activeTab === 'inline'
                      ? 'Just copy this code into an HTML block. No dev skills needed!'
                      : 'Add this code to open a popup form with the help of button.'}
                  </Text>

                  {/* Code Box */}
                  <Box
                    bg="gray.50"
                    borderWidth="1px"
                    borderColor="gray.200"
                    borderRadius="md"
                    p={4}
                    h="200px"
                    overflowY="auto"
                    css={{
                      '&::-webkit-scrollbar': { width: '8px' },
                      '&::-webkit-scrollbar-track': { background: '#f1f1f1', borderRadius: '4px' },
                      '&::-webkit-scrollbar-thumb': { background: '#cbd5e0', borderRadius: '4px' },
                      '&::-webkit-scrollbar-thumb:hover': { background: '#a0aec0' },
                    }}
                  >
                    <Text
                      as="pre"
                      fontSize="xs"
                      fontFamily="monospace"
                      color="gray.700"
                      whiteSpace="pre-wrap"
                      wordBreak="break-word"
                    >
                      {activeTab === 'inline' ? inlineCode : popupCode}
                    </Text>
                  </Box>

                  {/* Buttons */}
                  <HStack justify="space-between" pt={2}>
                    <Button
                      variant="ghost"
                      leftIcon={<Icon as={FiChevronLeft} />}
                      onClick={() => setView('share')}
                      size="sm"
                      color="gray.600"
                      _hover={{ bg: 'gray.50' }}
                    >
                      Back
                    </Button>
                    <Button
                      leftIcon={<Icon as={FiCopy} />}
                      bg="#044bd9"
                      color="white"
                      _hover={{ bg: '#033fb6' }}
                      onClick={handleCopyEmbed}
                      px={6}
                    >
                      Copy the Code
                    </Button>
                  </HStack>
                </VStack>
              </Box>
            </VStack>
          )}

        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
