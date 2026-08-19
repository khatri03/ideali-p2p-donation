import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Badge,
  Box,
  Button,
  Divider,
  Flex,
  Icon,
  IconButton,
  Text,
  useToast,
} from '@chakra-ui/react';
import { MdDelete, MdChevronRight } from 'react-icons/md';
import { FiBell } from 'react-icons/fi';
import organizerNotificationService, {
  OrganizerNotificationItem,
} from '../../app/service/organizer/notifications/organizerNotificationService';

function formatItemDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '';
  }
}

function stripHtml(html: string): string {
  return html?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || '';
}

export default function NotificationBell() {
  const navigate = useNavigate();
  const toast = useToast();

  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState<OrganizerNotificationItem[]>([]);
  const [bellRinging, setBellRinging] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [markingAllRead, setMarkingAllRead] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const isFirstPollRef = useRef(true);
  const toastedIdsRef = useRef<Set<number>>(new Set());
  // IDs optimistically marked read locally but not yet confirmed by server —
  // prevents the poll cycle from reversing an optimistic decrement.
  const pendingReadIds = useRef<Set<number>>(new Set());

  // ── Shared fetch + smart-merge helper ────────────────────────────────────
  // useCallback with empty deps is safe: setters are stable, refs are always current.
  const refreshData = useCallback(async () => {
    try {
      const [summary, list] = await Promise.all([
        organizerNotificationService.getSummary(),
        organizerNotificationService.getNotifications(1, 10),
      ]);
      // Auto-clean: if server now shows an item as read, it no longer needs to
      // be in pendingReadIds. This prevents the count from undercounting after
      // the server has processed the read.
      list.pageData.forEach(s => {
        if (s.isRead) pendingReadIds.current.delete(s.recipientId);
      });
      // Subtract remaining pending reads so the badge never jumps back.
      setUnreadCount(Math.max(0, summary.unread - pendingReadIds.current.size));
      // Smart merge: preserve pending-read state, skip re-render if nothing changed.
      setItems(prev => {
        const merged = list.pageData.map(s => ({
          ...s,
          isRead: pendingReadIds.current.has(s.recipientId) ? true : s.isRead,
        }));
        const unchanged =
          prev.length === merged.length &&
          prev.every((p, i) => {
            const m = merged[i];
            return m && p.recipientId === m.recipientId && p.isRead === m.isRead && p.subject === m.subject;
          });
        return unchanged ? prev : merged;
      });
    } catch { /* silent */ }
  }, []);

  // ── Polling (new-notification detection + periodic refresh) ───────────────
  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const newItems = await organizerNotificationService.pollNotifications();
        if (cancelled) return;

        if (!isFirstPollRef.current && newItems.length > 0) {
          const fresh = newItems.filter(n => !toastedIdsRef.current.has(n.recipientId));
          fresh.forEach(n => toastedIdsRef.current.add(n.recipientId));

          if (fresh.length > 0) {
            setBellRinging(true);
            setTimeout(() => setBellRinging(false), 1200);
            window.dispatchEvent(new CustomEvent('new-notifications'));

            fresh.slice(0, 3).forEach((item, idx) => {
              setTimeout(() => {
                toast({
                  position: 'bottom-right',
                  duration: 7000,
                  isClosable: true,
                  render: ({ onClose }) => (
                    <Box
                      bg="white"
                      borderRadius="12px"
                      boxShadow="0 4px 24px rgba(0,0,0,0.15)"
                      borderLeft="4px solid #2563EB"
                      p={4}
                      minW="320px"
                      maxW="380px"
                    >
                      <Flex justify="space-between" align="flex-start" mb={2}>
                        <Flex align="center" gap={2}>
                          <Box
                            w="28px" h="28px" borderRadius="full" bg="#2563EB"
                            display="flex" alignItems="center" justifyContent="center" flexShrink={0}
                          >
                            <Icon as={FiBell} color="white" w="14px" h="14px" />
                          </Box>
                          <Text fontSize="xs" fontWeight="700" color="#2563EB" textTransform="uppercase" letterSpacing="wider">
                            New Notification
                          </Text>
                        </Flex>
                        <Box as="button" color="gray.400" fontSize="lg" lineHeight="1"
                          _hover={{ color: 'gray.600' }} onClick={onClose} ml={2}>×</Box>
                      </Flex>
                      <Text fontSize="sm" fontWeight="600" color="gray.800" mb={1} noOfLines={2}>
                        {item.subject}
                      </Text>
                      <Text fontSize="xs" color="gray.500" mb={3}>
                        From: {item.createdBy || 'System Admin'}
                      </Text>
                      <Button size="xs" bg="#2563EB" color="white" _hover={{ bg: '#1d4ed8' }}
                        borderRadius="full" px={4}
                        onClick={() => {
                          navigate(`/organizer/notifications/view/${item.recipientId}`);
                          onClose();
                        }}>
                        View
                      </Button>
                    </Box>
                  ),
                });
              }, idx * 600);
            });
          }
        }

        isFirstPollRef.current = false;
        if (!cancelled) await refreshData();
      } catch { /* silent */ }
    }

    // Initial load then every 45 s.
    refreshData();
    const id = setInterval(poll, 45000);
    return () => { cancelled = true; clearInterval(id); };
  }, [refreshData]);

  // ── Listen for reads that happen outside this component ──────────────────
  // e.g. the user navigated to a detail page via toast or list View icon.
  useEffect(() => {
    function onExternalRead(e: Event) {
      const { recipientId } = (e as CustomEvent<{ recipientId: number }>).detail;
      // pendingReadIds already has this ID if the bell's own handleViewItem fired —
      // skip to avoid decrementing twice.
      if (pendingReadIds.current.has(recipientId)) return;
      pendingReadIds.current.add(recipientId);
      setUnreadCount(c => Math.max(0, c - 1));
      setItems(prev => {
        const target = prev.find(n => n.recipientId === recipientId);
        if (!target || target.isRead) return prev;
        return prev.map(n => n.recipientId === recipientId ? { ...n, isRead: true } : n);
      });
    }
    window.addEventListener('notification-marked-read', onExternalRead);
    return () => window.removeEventListener('notification-marked-read', onExternalRead);
  }, []);

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

  // Re-fetch the moment the panel opens so stale cached data (e.g. a notification
  // marked read via the detail page) is corrected immediately.
  function handleOpen() {
    const opening = !open;
    setOpen(opening);
    if (opening) refreshData();
  }

  async function handleMarkRead(item: OrganizerNotificationItem) {
    if (item.isRead) return;
    // Register as pending so polling won't reverse the decrement.
    pendingReadIds.current.add(item.recipientId);
    // Optimistic — immediate badge decrement + read dot removal.
    setItems(prev => prev.map(n => n.recipientId === item.recipientId ? { ...n, isRead: true } : n));
    setUnreadCount(c => Math.max(0, c - 1));
    try {
      await organizerNotificationService.markAsRead(item.recipientId);
      // Keep in pendingReadIds — refreshData auto-cleans it once the server
      // response confirms isRead: true, preventing the badge from jumping back
      // if a stale server count arrives before the next refresh.
    } catch {
      // Revert.
      pendingReadIds.current.delete(item.recipientId);
      setItems(prev => prev.map(n => n.recipientId === item.recipientId ? { ...n, isRead: false } : n));
      setUnreadCount(c => c + 1);
    }
  }

  async function handleMarkAllRead() {
    const unread = items.filter(n => !n.isRead);
    if (unread.length === 0) return;
    setMarkingAllRead(true);
    unread.forEach(n => pendingReadIds.current.add(n.recipientId));
    // Optimistic.
    setItems(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await Promise.all(unread.map(n => organizerNotificationService.markAsRead(n.recipientId)));
      // Re-fetch so refreshData auto-cleans pendingReadIds and syncs the badge
      // with the server's confirmed count.
      await refreshData();
    } catch {
      // Revert — re-fetch to get consistent state.
      unread.forEach(n => pendingReadIds.current.delete(n.recipientId));
      await refreshData();
    } finally {
      setMarkingAllRead(false);
    }
  }

  async function handleDelete(e: React.MouseEvent, item: OrganizerNotificationItem) {
    e.stopPropagation();
    setDeletingId(item.recipientId);
    pendingReadIds.current.delete(item.recipientId);
    const wasUnread = !item.isRead;
    setItems(prev => prev.filter(n => n.recipientId !== item.recipientId));
    if (wasUnread) setUnreadCount(c => Math.max(0, c - 1));
    try {
      await organizerNotificationService.deleteNotification(item.recipientId);
    } catch {
      setItems(prev =>
        [...prev, item].sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())
      );
      if (wasUnread) setUnreadCount(c => c + 1);
    } finally {
      setDeletingId(null);
    }
  }

  function handleViewItem(item: OrganizerNotificationItem) {
    // Inline optimistic update so the badge/dot change in the exact same render
    // as the panel close — no async batching delay.
    if (!item.isRead) {
      pendingReadIds.current.add(item.recipientId);
      setUnreadCount(c => Math.max(0, c - 1));
      setItems(prev =>
        prev.map(n => n.recipientId === item.recipientId ? { ...n, isRead: true } : n)
      );
      organizerNotificationService.markAsRead(item.recipientId).catch(() => {
        pendingReadIds.current.delete(item.recipientId);
        setUnreadCount(c => c + 1);
        setItems(prev =>
          prev.map(n => n.recipientId === item.recipientId ? { ...n, isRead: false } : n)
        );
      });
    }
    setOpen(false);
    navigate(`/organizer/notifications/view/${item.recipientId}`);
  }

  const newCount = items.filter(n => !n.isRead).length;

  return (
    <Box
      position="relative"
      ref={panelRef}
      sx={{
        '@keyframes ringBell': {
          '0%':   { transform: 'rotate(0deg)' },
          '10%':  { transform: 'rotate(-18deg)' },
          '20%':  { transform: 'rotate(18deg)' },
          '30%':  { transform: 'rotate(-14deg)' },
          '40%':  { transform: 'rotate(14deg)' },
          '50%':  { transform: 'rotate(-8deg)' },
          '60%':  { transform: 'rotate(8deg)' },
          '70%':  { transform: 'rotate(-4deg)' },
          '80%':  { transform: 'rotate(4deg)' },
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
      {/* Bell button — blue theme, red badge */}
      <Box
        as="button"
        position="relative"
        w={{ base: '40px', md: '44px' }}
        h={{ base: '40px', md: '44px' }}
        borderRadius="full"
        bg={unreadCount > 0 ? '#EFF6FF' : 'white'}
        boxShadow={bellRinging ? '0 0 0 4px rgba(37,99,235,0.2)' : '0 2px 8px rgba(0,0,0,0.10)'}
        display="flex"
        alignItems="center"
        justifyContent="center"
        cursor="pointer"
        role="group"
        border="1px solid"
        borderColor={unreadCount > 0 ? '#2563EB' : 'gray.200'}
        _hover={{ bg: unreadCount > 0 ? '#DBEAFE' : 'gray.50', transform: 'scale(1.08)' }}
        _active={{ transform: 'scale(0.96)' }}
        onClick={handleOpen}
        transition="all 0.2s"
      >
        <Icon
          as={FiBell}
          w="19px" h="19px"
          strokeWidth="2.2"
          color={unreadCount > 0 ? '#2563EB' : 'gray.400'}
          transition="transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)"
          _groupHover={{ transform: bellRinging ? undefined : 'rotate(-14deg)' }}
          style={{ animation: bellRinging ? 'ringBell 1.2s ease' : 'none' }}
        />
        {unreadCount > 0 && (
          <Box
            position="absolute" top="-4px" right="-4px"
            bg="#E05353" color="white" borderRadius="full"
            minW="20px" h="20px"
            display="flex" alignItems="center" justifyContent="center"
            fontSize="10px" fontWeight="bold" px="4px" lineHeight="1"
            boxShadow="0 0 0 2px white"
            animation={bellRinging ? 'badgePop 0.4s ease' : undefined}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Box>
        )}
      </Box>

      {/* Dropdown panel */}
      {open && (
        <Box
          position="absolute"
          top="calc(100% + 12px)"
          right="0"
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
          <Flex align="center" justify="space-between" px={4} py={3} borderBottomWidth="1px" borderColor="gray.100">
            <Flex align="center" gap={2}>
              <Text fontWeight="700" fontSize="sm" color="gray.900">Notifications</Text>
              {newCount > 0 && (
                <Badge bg="#2563EB" color="white" borderRadius="full" px={2} py={0.5} fontSize="11px" fontWeight="700">
                  {newCount} new
                </Badge>
              )}
            </Flex>
            <Flex align="center" gap={3}>
              {newCount > 0 && (
                <Text
                  fontSize="xs" color="#2563EB" cursor="pointer" fontWeight="600"
                  _hover={{ textDecoration: 'underline' }}
                  onClick={handleMarkAllRead}
                  opacity={markingAllRead ? 0.5 : 1}
                  pointerEvents={markingAllRead ? 'none' : 'auto'}
                >
                  Mark all read
                </Text>
              )}
              <Box
                as="button" fontSize="18px" color="gray.400" lineHeight="1"
                _hover={{ color: 'gray.700' }} onClick={() => setOpen(false)}
              >
                ×
              </Box>
            </Flex>
          </Flex>

          {/* List */}
          {items.length === 0 ? (
            <Flex direction="column" align="center" justify="center" py={10} gap={2}>
              <Icon as={FiBell} w="32px" h="32px" color="gray.200" />
              <Text fontSize="sm" color="gray.400" fontWeight="500">No notifications</Text>
              <Text fontSize="xs" color="gray.300">You're all caught up!</Text>
            </Flex>
          ) : (
            <Box maxH="420px" overflowY="auto">
              {items.map((item, idx) => (
                <Box key={item.recipientId}>
                  <Flex
                    px={4} py={3} gap={3} align="flex-start"
                    bg={item.isRead ? 'white' : 'rgba(37,99,235,0.04)'}
                    cursor="pointer"
                    _hover={{ bg: item.isRead ? 'gray.50' : 'rgba(37,99,235,0.08)' }}
                    transition="background 0.15s"
                    animation={`rowIn 0.25s ease both ${Math.min(idx, 6) * 0.04}s`}
                    onClick={() => handleViewItem(item)}
                  >
                    {/* Unread dot */}
                    <Box pt="6px" flexShrink={0} w="8px">
                      {!item.isRead && (
                        <Box w="8px" h="8px" borderRadius="full" bg="#2563EB" />
                      )}
                    </Box>

                    {/* Content */}
                    <Box flex={1} minW={0}>
                      <Text
                        fontSize="sm" fontWeight={item.isRead ? '500' : '700'}
                        color="gray.900" noOfLines={1} mb={0.5}
                      >
                        {item.subject}
                      </Text>
                      <Text fontSize="xs" color="gray.500" noOfLines={1} mb={1}>
                        {stripHtml(item.content)}
                      </Text>
                      <Text fontSize="xs" color="gray.400">
                        {item.createdBy || 'Super Admin'} · {formatItemDate(item.sentAt)}
                      </Text>
                    </Box>

                    {/* Actions */}
                    <Flex align="center" gap={1} flexShrink={0}>
                      <IconButton
                        aria-label="Delete"
                        icon={<MdDelete />}
                        size="xs"
                        variant="ghost"
                        colorScheme="gray"
                        color="gray.400"
                        _hover={{ color: 'red.500', bg: 'red.50' }}
                        isLoading={deletingId === item.recipientId}
                        onClick={(e) => handleDelete(e, item)}
                      />
                      <Icon as={MdChevronRight} color="gray.300" w="16px" h="16px" />
                    </Flex>
                  </Flex>
                  {idx < items.length - 1 && <Divider />}
                </Box>
              ))}
            </Box>
          )}

          {/* Footer */}
          {items.length > 0 && (
            <>
              <Divider />
              <Flex justify="center" py={3}>
                <Text
                  fontSize="sm" color="#2563EB" fontWeight="600" cursor="pointer"
                  _hover={{ textDecoration: 'underline' }}
                  onClick={() => { setOpen(false); navigate('/organizer/notifications/list'); }}
                >
                  View All Notifications →
                </Text>
              </Flex>
            </>
          )}
        </Box>
      )}
    </Box>
  );
}
