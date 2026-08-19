import React, { useState, useRef, useCallback } from 'react';
import { Box, Flex, Icon, Portal, Text, useDisclosure } from '@chakra-ui/react';
import { MdChevronRight, MdWifi, MdWifiOff } from 'react-icons/md';
import MembershipStatusModal from '../../createMembership/shared/MembershipStatusModal';

interface Props {
  membershipId: string;
  currentStatus: boolean;
  onStatusChanged: (id: string, newStatus: boolean) => void;
}

const SUBMENU_WIDTH = 210;

export default function StatusSubMenu({ membershipId, currentStatus, onStatusChanged }: Props) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [pending, setPending] = useState<boolean | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { isOpen: isModalOpen, onOpen: openModal, onClose: closeModal } = useDisclosure();

  const cancelClose = useCallback(() => {
    if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; }
  }, []);

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  }, [cancelClose]);

  const calcPos = () => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    const left = r.right + SUBMENU_WIDTH > window.innerWidth ? r.left - SUBMENU_WIDTH : r.right;
    setPos({ top: r.top, left });
  };

  const handleTriggerEnter = () => {
    cancelClose();
    calcPos();
    setOpen(true);
  };

  const handleTriggerClick = () => {
    calcPos();
    setOpen((v) => !v);
  };

  const handleRequest = (status: boolean) => {
    setPending(status);
    openModal();
    setOpen(false);
  };

  return (
    <>
      <Box
        ref={triggerRef}
        onMouseEnter={handleTriggerEnter}
        onMouseLeave={scheduleClose}
        onClick={handleTriggerClick}
      >
        <Flex
          align="center" justify="space-between"
          px={3} py={2} cursor="pointer" borderRadius="md" mx={1}
          bg={open ? 'gray.50' : 'transparent'}
          _hover={{ bg: 'gray.50' }}
          transition="background 0.12s"
        >
          <Flex align="center" gap={2}>
            <Box
              w="8px" h="8px" borderRadius="full"
              bg={currentStatus ? 'green.400' : 'gray.300'}
              boxShadow={currentStatus ? '0 0 0 3px rgba(72,187,120,0.25)' : 'none'}
            />
            <Text fontSize="sm" fontWeight="medium" color="gray.700">Status</Text>
            <Box
              bg={currentStatus ? 'green.50' : 'gray.100'}
              color={currentStatus ? 'green.600' : 'gray.500'}
              fontSize="10px" fontWeight="bold" px={2} py={0.5}
              borderRadius="full" border="1px solid"
              borderColor={currentStatus ? 'green.200' : 'gray.200'}
            >
              {currentStatus ? 'Online' : 'Offline'}
            </Box>
          </Flex>
          <Icon as={MdChevronRight} boxSize={4} color="gray.400" />
        </Flex>

        {open && (
          <Portal>
            <Box
              position="fixed"
              top={`${pos.top}px`}
              left={`${pos.left}px`}
              zIndex={2000}
              bg="white"
              border="1px solid"
              borderColor="gray.100"
              borderRadius="xl"
              boxShadow="0 8px 24px rgba(0,0,0,0.13)"
              minW={`${SUBMENU_WIDTH}px`}
              py={2}
              onMouseEnter={cancelClose}
              onMouseLeave={scheduleClose}
            >
              <Box px={3} py={1} mb={0.5}>
                <Text fontSize="10px" fontWeight="bold" color="gray.400" textTransform="uppercase" letterSpacing="wider">
                  Status
                </Text>
              </Box>

              <Flex align="center" gap={2.5} px={3} py={2.5} cursor="pointer"
                _hover={{ bg: 'green.50' }} transition="background 0.12s" borderRadius="md" mx={1}
                opacity={currentStatus ? 0.5 : 1}
                onClick={() => !currentStatus && handleRequest(true)}
              >
                <Flex w="28px" h="28px" borderRadius="md" bg="green.50" border="1px solid" borderColor="green.200" align="center" justify="center" flexShrink={0}>
                  <Icon as={MdWifi} boxSize={3.5} color="green.500" />
                </Flex>
                <Box>
                  <Flex align="center" gap={1.5}>
                    <Text fontSize="sm" fontWeight="medium" color="green.700">Online</Text>
                    {currentStatus && <Box bg="green.400" color="white" fontSize="9px" fontWeight="bold" px={1.5} py={0.5} borderRadius="full">Current</Box>}
                  </Flex>
                  <Text fontSize="10px" color="gray.500">Open membership for sign-up</Text>
                </Box>
              </Flex>

              <Flex align="center" gap={2.5} px={3} py={2.5} cursor="pointer"
                _hover={{ bg: 'red.50' }} transition="background 0.12s" borderRadius="md" mx={1}
                opacity={!currentStatus ? 0.5 : 1}
                onClick={() => currentStatus && handleRequest(false)}
              >
                <Flex w="28px" h="28px" borderRadius="md" bg="red.50" border="1px solid" borderColor="red.200" align="center" justify="center" flexShrink={0}>
                  <Icon as={MdWifiOff} boxSize={3.5} color="red.500" />
                </Flex>
                <Box>
                  <Flex align="center" gap={1.5}>
                    <Text fontSize="sm" fontWeight="medium" color="red.600">Offline</Text>
                    {!currentStatus && <Box bg="gray.400" color="white" fontSize="9px" fontWeight="bold" px={1.5} py={0.5} borderRadius="full">Current</Box>}
                  </Flex>
                  <Text fontSize="10px" color="gray.500">Close membership sign-up</Text>
                </Box>
              </Flex>
            </Box>
          </Portal>
        )}
      </Box>

      {pending !== null && (
        <MembershipStatusModal
          isOpen={isModalOpen}
          membershipId={membershipId}
          targetStatus={pending}
          onClose={closeModal}
          onSuccess={(newStatus) => { onStatusChanged(membershipId, newStatus); }}
        />
      )}
    </>
  );
}
