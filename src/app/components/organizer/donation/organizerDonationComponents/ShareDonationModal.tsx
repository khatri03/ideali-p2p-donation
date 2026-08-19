import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  Button,
  Text,
  Box,
  useToast,
  VStack,
  HStack,
  Icon,
} from '@chakra-ui/react';
import { FiChevronLeft, FiCopy } from 'react-icons/fi';

interface ShareDonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId: string;
  organizerUniqueId?: string; 
  onBack?: () => void;
}

export const ShareDonationModal: React.FC<ShareDonationModalProps> = ({ 
  isOpen, 
  onClose, 
  campaignId,
  organizerUniqueId, 
  onBack,
}) => {
  const toast = useToast();
  const domain = window.location.origin;
  const [activeTab, setActiveTab] = useState<'inline' | 'popup'>('inline');
  const embedSrc = organizerUniqueId 
  ? `${domain}/campaign-list/${organizerUniqueId}`
  : `${domain}/donate/${campaignId}`;

const inlineCode = `<iframe src="${embedSrc}" 
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
    frame.src = "${embedSrc}";
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

  const handleCopy = (): void => {
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

  const handleBack = () => {
    if (onBack) {
      onClose();
      onBack();
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      size="2xl"
      isCentered
    >
      <ModalOverlay bg="blackAlpha.600" />
      <ModalContent maxW="650px" minH={organizerUniqueId ? "420px" : "520px"} borderRadius="xl" overflow="hidden">
        {/* Blue Header */}
        <Box bg="#044bd9" pt={6} pb={4} px={6} position="relative">
          <ModalCloseButton 
            color="white" 
            top={4} 
            right={4}
            _hover={{ bg: 'whiteAlpha.200' }}
          />
          {/* <Text color="white" fontSize="lg" fontWeight="semibold" textAlign="center">
            Select your embed method
          </Text> */}
            <VStack spacing={1} align="center">
                      <Text color="white" fontSize="lg" fontWeight="semibold">
                        Select your embed method
                      </Text>
                      <Text color="whiteAlpha.800" fontSize="sm">
                        Share where you want to receive contributions
                      </Text>
                    </VStack>
        </Box>

        <ModalBody p={0}>
          <VStack spacing={0} align="stretch">
            {organizerUniqueId && (
  <Box px={6} pt={4} pb={2}>
    <HStack
      border="1px solid"
      borderColor="gray.200"
      borderRadius="md"
      bg="white"
      px={2}
      py={1}
      spacing={2}
    >
      <Text
        flex={1}
        fontSize="xs"
        color="gray.700"
        fontFamily="monospace"
        isTruncated
      >
        {embedSrc}
      </Text>
      <Button
        size="xs"
        leftIcon={<Icon as={FiCopy} />}
        bg="#044bd9"
        color="white"
        _hover={{ bg: '#033fb6' }}
        flexShrink={0}
        onClick={() => {
          navigator.clipboard.writeText(embedSrc);
          toast({
            title: 'Link copied!',
            status: 'success',
            duration: 2000,
            isClosable: true,
          });
        }}
      >
        Copy
      </Button>
    </HStack>
  </Box>
)}
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
                  h="280px"
                  overflowY="auto"
                  css={{
                    '&::-webkit-scrollbar': {
                      width: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                      background: '#f1f1f1',
                      borderRadius: '4px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      background: '#cbd5e0',
                      borderRadius: '4px',
                    },
                    '&::-webkit-scrollbar-thumb:hover': {
                      background: '#a0aec0',
                    },
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
                  {onBack && (
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
                  )}
                  <Box flex={1} />
                  <Button
                    leftIcon={<Icon as={FiCopy} />}
                    bg="#044bd9"
                    color="white"
                    _hover={{ bg: '#033fb6' }}
                    onClick={handleCopy}
                    px={6}
                  >
                    Copy the Code
                  </Button>
                </HStack>
              </VStack>
            </Box>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};