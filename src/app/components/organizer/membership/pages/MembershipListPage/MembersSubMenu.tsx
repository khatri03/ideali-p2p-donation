import React, { useState, useRef, useCallback } from 'react';
import { Box, Flex, Icon, Portal, Text, useClipboard, useToast } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { MdChevronRight, MdGroup, MdLink, MdPeople, MdPersonAdd } from 'react-icons/md';

interface Props {
  membershipId: string;
  onAddMember: () => void;
  canViewActiveMembers?: boolean;
}

const SUBMENU_WIDTH = 210;

export default function MembersSubMenu({ membershipId, onAddMember, canViewActiveMembers = true }: Props) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const signUpUrl = `${window.location.origin}/membership/register/${membershipId}`;
  const { onCopy, hasCopied } = useClipboard(signUpUrl);
  const toast = useToast();
  const navigate = useNavigate();

  const handleActiveMembers = () => {
    setOpen(false);
    navigate(
      `/organizer/membership/members?typeId=${encodeURIComponent(membershipId)}&status=Active`,
    );
  };

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

  const handleCopy = () => {
    onCopy();
    toast({ title: 'Sign-up link copied!', status: 'success', position: 'top-right', duration: 2000 });
  };

  return (
    <Box
      ref={triggerRef}
      onMouseEnter={handleTriggerEnter}
      onMouseLeave={scheduleClose}
      onClick={handleTriggerClick}
    >
      <Flex
        align="center" justify="space-between"
        px={3} py={2} cursor="pointer" borderRadius="md" mx={1}
        bg={open ? 'blue.50' : 'transparent'}
        _hover={{ bg: 'blue.50' }}
        transition="background 0.12s"
      >
        <Flex align="center" gap={2}>
          <Icon as={MdPeople} boxSize={4} color="blue.500" />
          <Text fontSize="sm" fontWeight="medium" color="blue.600">Members</Text>
        </Flex>
        <Icon as={MdChevronRight} boxSize={4} color="blue.400" />
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
              <Flex align="center" gap={1.5}>
                <Icon as={MdPeople} boxSize={3} color="blue.400" />
                <Text fontSize="10px" fontWeight="bold" color="blue.400" textTransform="uppercase" letterSpacing="wider">
                  Members
                </Text>
              </Flex>
            </Box>

            {canViewActiveMembers && (
              <Flex align="center" gap={2.5} px={3} py={2.5} cursor="pointer"
                _hover={{ bg: 'gray.50' }} transition="background 0.12s" borderRadius="md" mx={1}
                onClick={handleActiveMembers}
              >
                <Flex w="28px" h="28px" borderRadius="md" bg="green.50" border="1px solid" borderColor="green.200" align="center" justify="center" flexShrink={0}>
                  <Icon as={MdGroup} boxSize={3.5} color="green.500" />
                </Flex>
                <Box>
                  <Text fontSize="sm" fontWeight="medium" color="gray.800">Active Members</Text>
                  <Text fontSize="10px" color="gray.500">View enrolled members</Text>
                </Box>
              </Flex>
            )}

            <Flex align="center" gap={2.5} px={3} py={2.5} cursor="pointer"
              _hover={{ bg: 'gray.50' }} transition="background 0.12s" borderRadius="md" mx={1}
              onClick={handleCopy}
            >
              <Flex w="28px" h="28px" borderRadius="md" bg="purple.50" border="1px solid" borderColor="purple.200" align="center" justify="center" flexShrink={0}>
                <Icon as={MdLink} boxSize={3.5} color="purple.500" />
              </Flex>
              <Box>
                <Text fontSize="sm" fontWeight="medium" color="gray.800">
                  {hasCopied ? '✓ Copied!' : 'Copy Sign-up Link'}
                </Text>
                <Text fontSize="10px" color="gray.500">Share registration link</Text>
              </Box>
            </Flex>

            <Flex align="center" gap={2.5} px={3} py={2.5} cursor="pointer"
              _hover={{ bg: 'blue.50' }} transition="background 0.12s" borderRadius="md" mx={1}
              onClick={onAddMember}
            >
              <Flex w="28px" h="28px" borderRadius="md" bg="blue.50" border="1px solid" borderColor="blue.200" align="center" justify="center" flexShrink={0}>
                <Icon as={MdPersonAdd} boxSize={3.5} color="blue.600" />
              </Flex>
              <Box>
                <Text fontSize="sm" fontWeight="medium" color="blue.700">Add Member</Text>
                <Text fontSize="10px" color="gray.500">Register a new member</Text>
              </Box>
            </Flex>
          </Box>
        </Portal>
      )}
    </Box>
  );
}
