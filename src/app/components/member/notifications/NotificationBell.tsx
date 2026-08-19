import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Badge,
  Box,
  Divider,
  Flex,
  HStack,
  Icon,
  Text,
  useToast,
} from '@chakra-ui/react';
import { MdInfo } from 'react-icons/md';
import { FiBell } from 'react-icons/fi';
import memberNotificationService, {
  MemberNotificationItem,
} from '../services/memberNotificationService';
import { useAlertRealtime } from './useAlertRealtime';
import {
  openNotificationBell,
  subscribeToNotificationBell,
} from './notificationBellBus';
import StatusBadge from '../../common/StatusBadge';

const UNSEEN_COUNT_BACKSTOP_MS = 120_000;

// Urgent/Important alerts always get a tinted row background (read or not) —
// Normal just gets the plain blue unread dot.
const priorityRowBg: Record<string, { bg: string; hoverBg: string }> = {
  Urgent: { bg: 'red.50', hoverBg: 'red.100' },
  Important: { bg: 'yellow.50', hoverBg: 'yellow.100' },
};

function formatItemDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return (
      d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }) +
      ' ' +
      d.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    );
  } catch {
    return '';
  }
}

export default function NotificationBell() {
  const navigate = useNavigate();
  const toast = useToast();

  const [open, setOpen] = useState(false);
  const [unseenCount, setUnseenCount] = useState(0);
  const [items, setItems] = useState<MemberNotificationItem[]>([]);
  const [bellRinging, setBellRinging] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);

  const refreshUnseenCount = useCallback(async () => {
    try {
      const count = await memberNotificationService.getUnseenCount();
      setUnseenCount(count);
    } catch {
      /* silent */
    }
  }, []);

  const refreshList = useCallback(async () => {
    try {
      const data = await memberNotificationService.getNotifications(1, 10);
      setItems(data.pageData);
    } catch {
      /* silent */
    }
  }, []);

  const refreshAll = useCallback(() => {
    refreshUnseenCount();
    refreshList();
  }, [refreshUnseenCount, refreshList]);

  // Initial load + 120s backstop poll (covers the no-backplane multi-instance
  // case where a push born on another server instance never reaches this hub
  // connection, plus general resilience if SignalR never connects at all).
  useEffect(() => {
    refreshAll();
    const id = setInterval(refreshUnseenCount, UNSEEN_COUNT_BACKSTOP_MS);
    return () => clearInterval(id);
  }, [refreshAll, refreshUnseenCount]);

  // Live push — fast path only, backstop poll above covers the rest.
  useAlertRealtime({
    enabled: true,
    onRefresh: refreshAll,
    onAlerts: (count) => {
      setBellRinging(true);
      setTimeout(() => setBellRinging(false), 1200);
      toast({
        position: 'top-right',
        duration: 7000,
        isClosable: true,
        containerStyle: { marginRight: '48px' },
        render: ({ onClose }) => (
          <Flex
            bg="orange.50"
            border="1px solid"
            borderColor="orange.200"
            borderRadius="12px"
            boxShadow="0 4px 24px rgba(0,0,0,0.12)"
            p={3}
            minW="320px"
            maxW="380px"
            align="flex-start"
            gap={2.5}
            cursor="pointer"
            onClick={() => {
              openNotificationBell();
              onClose();
            }}
          >
            <Icon
              as={MdInfo}
              color="orange.400"
              boxSize="20px"
              mt="1px"
              flexShrink={0}
            />
            <Box flex={1} minW={0}>
              <Text fontSize="sm" fontWeight="700" color="gray.800" mb={0.5}>
                New alert
              </Text>
              <Text fontSize="xs" color="gray.600">
                {count > 1
                  ? `You have ${count} new notifications.`
                  : 'You have a new notification.'}
              </Text>
            </Box>
            <Box
              as="button"
              color="gray.400"
              fontSize="md"
              lineHeight="1"
              _hover={{ color: 'gray.600' }}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onClose();
              }}
              flexShrink={0}
            >
              ×
            </Box>
          </Flex>
        ),
      });
    },
  });

  // Open the bell when a toast (rendered outside this component) is clicked.
  useEffect(() => {
    return subscribeToNotificationBell(() => {
      setOpen(true);
      refreshAll();
    });
  }, [refreshAll]);

  // ── Close on outside click ────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [open]);

  // ── Actions ───────────────────────────────────────────────────────────────

  async function handleOpen() {
    const opening = !open;
    setOpen(opening);
    if (opening) {
      // Capture the pre-open read/seen state first — marking everything seen
      // below must not race this fetch, or the list can come back already
      // reflecting the mark-as-seen mutation and lose its highlighting.
      await refreshList();
      // Bulk-mark everything currently shown as seen — clears the badge.
      memberNotificationService
        .markAllSeen()
        .then(() => setUnseenCount(0))
        .catch(() => {});
    }
  }

  async function handleMarkAllRead() {
    const unread = items.filter((n) => !n.isRead);
    if (unread.length === 0) return;
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await Promise.all(
        unread.map((n) => memberNotificationService.markAsRead(n.uniqueId)),
      );
    } catch {
      setItems((prev) =>
        prev.map((n) =>
          unread.some((u) => u.uniqueId === n.uniqueId)
            ? { ...n, isRead: false }
            : n,
        ),
      );
    }
  }

  function handleViewItem(item: MemberNotificationItem) {
    // Clicking to view an item marks it read — no separate "Mark as read" action.
    if (!item.isRead) {
      setItems((prev) =>
        prev.map((n) =>
          n.uniqueId === item.uniqueId ? { ...n, isRead: true } : n,
        ),
      );
      memberNotificationService.markAsRead(item.uniqueId).catch(() => {
        setItems((prev) =>
          prev.map((n) =>
            n.uniqueId === item.uniqueId ? { ...n, isRead: false } : n,
          ),
        );
      });
    }
    setOpen(false);
    navigate(`/member/notifications/view/${item.uniqueId}`);
  }

  const newCount = items.filter((n) => !n.isRead).length;

  return (
    <Box
      position="relative"
      ref={panelRef}
      sx={{
        '@keyframes ringBell': {
          '0%':   { transform: 'rotate(0deg)' },
          '10%':  { transform: 'rotate(-14deg)' },
          '20%':  { transform: 'rotate(12deg)' },
          '30%':  { transform: 'rotate(-10deg)' },
          '40%':  { transform: 'rotate(8deg)' },
          '50%':  { transform: 'rotate(-6deg)' },
          '60%':  { transform: 'rotate(4deg)' },
          '70%':  { transform: 'rotate(-2deg)' },
          '100%': { transform: 'rotate(0deg)' },
        },
        '@keyframes badgePop': {
          '0%':   { transform: 'scale(0.6)' },
          '50%':  { transform: 'scale(1.3)' },
          '100%': { transform: 'scale(1)' },
        },
        '@keyframes dropdownIn': {
          '0%':   { opacity: 0, transform: 'translateY(-10px) scale(0.94)' },
          '60%':  { opacity: 1, transform: 'translateY(1px) scale(1.01)' },
          '100%': { opacity: 1, transform: 'translateY(0) scale(1)' },
        },
        '@keyframes rowIn': {
          from: { opacity: 0, transform: 'translateY(-4px)' },
          to:   { opacity: 1, transform: 'translateY(0)' },
        },
      }}
    >
      {/* Bell button — blue theme, red badge (unseen count) */}
      <Box
        as="button"
        position="relative"
        w={{ base: '40px', md: '44px' }}
        h={{ base: '40px', md: '44px' }}
        borderRadius="full"
        bg={unseenCount > 0 ? '#EFF6FF' : 'white'}
        boxShadow={bellRinging ? '0 0 0 4px rgba(224,83,83,0.25)' : '0 2px 8px rgba(0,0,0,0.10)'}
        display="flex"
        alignItems="center"
        justifyContent="center"
        cursor="pointer"
        role="group"
        border="1px solid"
        borderColor={unseenCount > 0 ? '#2563EB' : 'gray.200'}
        _hover={{ bg: unseenCount > 0 ? '#DBEAFE' : 'gray.50', transform: 'scale(1.08)' }}
        _active={{ transform: 'scale(0.96)' }}
        onClick={handleOpen}
        transition="all 0.2s"
      >
        <Icon
          as={FiBell}
          w="19px"
          h="19px"
          strokeWidth="2.2"
          color={unseenCount > 0 ? '#2563EB' : 'gray.400'}
          transition="transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)"
          _groupHover={{ transform: bellRinging ? undefined : 'rotate(-14deg)' }}
          style={{ animation: bellRinging ? 'ringBell 1.2s ease' : 'none' }}
        />
        {unseenCount > 0 && (
          <Box
            position="absolute"
            top="-4px"
            right="-4px"
            bg="#E05353"
            color="white"
            borderRadius="full"
            minW="20px"
            h="20px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            fontSize="10px"
            fontWeight="bold"
            px="4px"
            lineHeight="1"
            boxShadow="0 0 0 2px white"
            animation={bellRinging ? 'badgePop 0.4s ease' : undefined}
          >
            {unseenCount > 99 ? '99+' : unseenCount}
          </Box>
        )}
      </Box>

      {/* Dropdown panel */}
      {open && (
        <Box
          position="absolute"
          top="calc(100% + 12px)"
          right="32px"
          w="380px"
          bg="white"
          borderRadius="16px"
          boxShadow="0 8px 40px rgba(0,0,0,0.14)"
          border="1px solid"
          borderColor="gray.100"
          zIndex={1000}
          overflow="hidden"
          transformOrigin="top right"
          animation="dropdownIn 0.28s cubic-bezier(0.16, 1, 0.3, 1)"
        >
          {/* Header */}
          <Flex
            align="center"
            justify="space-between"
            px={4}
            py={3}
            borderBottomWidth="1px"
            borderColor="gray.100"
          >
            <HStack spacing={2}>
              <Text fontWeight="700" fontSize="sm" color="gray.900">
                Notifications
              </Text>
              {newCount > 0 && (
                <Badge
                  bg="#2563EB"
                  color="white"
                  borderRadius="full"
                  px={2}
                  py={0.5}
                  fontSize="11px"
                  fontWeight="700"
                >
                  {newCount} new
                </Badge>
              )}
            </HStack>
            <HStack spacing={3}>
              {newCount > 0 && (
                <Text
                  fontSize="xs"
                  color="#2563EB"
                  cursor="pointer"
                  fontWeight="600"
                  _hover={{ textDecoration: 'underline' }}
                  onClick={handleMarkAllRead}
                >
                  Mark all read
                </Text>
              )}
              <Box
                as="button"
                fontSize="18px"
                color="gray.400"
                lineHeight="1"
                _hover={{ color: 'gray.700' }}
                onClick={() => setOpen(false)}
              >
                ×
              </Box>
            </HStack>
          </Flex>

          {/* List */}
          {items.length === 0 ? (
            <Flex
              direction="column"
              align="center"
              justify="center"
              py={10}
              gap={2}
            >
              <Icon as={FiBell} w="32px" h="32px" color="gray.200" />
              <Text fontSize="sm" color="gray.400" fontWeight="500">
                No notifications
              </Text>
              <Text fontSize="xs" color="gray.300">
                You're all caught up!
              </Text>
            </Flex>
          ) : (
            <Box maxH="280px" overflowY="auto">
              {items.map((item, idx) => {
                const highlight = priorityRowBg[item.priority];
                return (
                  <Box key={item.uniqueId}>
                    <Box
                      px={4}
                      py={3}
                      bg={highlight?.bg ?? 'white'}
                      cursor="pointer"
                      _hover={{ bg: highlight?.hoverBg ?? 'gray.50' }}
                      transition="background 0.15s"
                      animation={`rowIn 0.25s ease both ${Math.min(idx, 6) * 0.04}s`}
                      onClick={() => handleViewItem(item)}
                    >
                      <Flex
                        align="center"
                        justify="space-between"
                        mb={1}
                        gap={2}
                      >
                        <HStack spacing={1.5}>
                          {!item.isRead && !highlight && (
                            <Box
                              w="6px"
                              h="6px"
                              borderRadius="full"
                              bg="#2563EB"
                              flexShrink={0}
                            />
                          )}
                          <Text
                            fontSize="xs"
                            color="gray.400"
                            whiteSpace="nowrap"
                          >
                            {formatItemDate(item.sentAtUtc)}
                          </Text>
                        </HStack>
                        <StatusBadge
                          label={item.priority}
                          variant="status"
                          flexShrink={0}
                        />
                      </Flex>
                      <Text
                        fontSize="sm"
                        fontWeight={item.isRead ? '500' : '700'}
                        color="gray.900"
                        noOfLines={1}
                      >
                        {item.title}
                      </Text>
                    </Box>
                    {idx < items.length - 1 && <Divider />}
                  </Box>
                );
              })}
            </Box>
          )}

          {/* Footer */}
          {items.length > 0 && (
            <>
              <Divider />
              <Flex justify="center" py={3}>
                <Text
                  fontSize="sm"
                  color="#2563EB"
                  fontWeight="600"
                  cursor="pointer"
                  _hover={{ textDecoration: 'underline' }}
                  onClick={() => {
                    setOpen(false);
                    navigate('/member/notifications/list');
                  }}
                >
                  View all →
                </Text>
              </Flex>
            </>
          )}
        </Box>
      )}
    </Box>
  );
}
