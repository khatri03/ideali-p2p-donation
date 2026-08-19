import React from 'react';
import {
  Flex,
  Box,
  Text,
  Button,
  Center,
  Spinner,
  useColorModeValue,
} from '@chakra-ui/react';
import { ConnectedIntegration } from '../../../../service/organizer/Settings/contactSyncService';
import { QuickbooksStatusData } from '../../../../service/organizer/Settings/quickBooks/quickBookService';
import {
  getIntegrationMeta,
  PREVIEW_INTEGRATIONS,
} from '../../../../service/organizer/Settings/quickBooks/quickBOption';
import connect from '../../../../../assets/img/organizer/integrations/connect.svg';
import buttonConnect from '../../../../../assets/img/organizer/integrations/buttonConnect.svg';

// QuickBooks brand colours / label
const QB_META = { bg: '#2CA01C', shortLabel: 'QB' };

// ── Sub-components ─────────────────────────────────────────────────────────────

/** Spinner shown during initial load */
function LoadingState() {
  return (
    <Center py={10}>
      <Spinner size="md" color="blue.500" />
    </Center>
  );
}

/** Shown when one or more integrations are connected / being connected */
function ConnectingState({
  connectedProvider,
  connectedItems,
  isConnecting,
  isConnected,
  justConnected,
  onViewConnected,
  qbStatus,
}: {
  connectedProvider: string;
  connectedItems: ConnectedIntegration[];
  isConnecting: boolean;
  isConnected: boolean;
  justConnected: boolean;
  onViewConnected: () => void;
  qbStatus: QuickbooksStatusData | null;
}) {
  const itemBorder = useColorModeValue('gray.200', 'whiteAlpha.200');
  const labelColor = useColorModeValue('gray.700', 'gray.300');
  const subTextColor = useColorModeValue('gray.500', 'gray.400');

  // Always derive the standard row's meta from actual connectedItems — never
  // from connectedProvider, which may be 'QuickBooks' during a QB OAuth redirect
  // and would produce a wrong/broken badge.
  const standardMeta = getIntegrationMeta(connectedItems[0]?.name ?? '');

  // Show the standard contact-sync row ONLY when there are real connected items.
  // Do NOT show it during a fresh QB OAuth flow — that flow is unrelated to
  // contact-sync providers and connectedItems may be stale/empty at that point.
  const showStandardRow = connectedItems.length > 0;

  return (
    <Flex direction="column" gap={3}>
      {/* ── Standard provider row ─────────────────────────────────────────── */}
      {showStandardRow && (
        <Flex
          align="center"
          gap={3}
          px={4}
          py={3}
          border="1px solid"
          borderColor={itemBorder}
          borderRadius="10px"
        >
          <Center
            w="36px"
            h="36px"
            borderRadius="8px"
            bg={standardMeta.bg}
            color="white"
            fontWeight="700"
            fontSize="12px"
            flexShrink={0}
          >
            {standardMeta.shortLabel}
          </Center>

          <Box flex={1}>
            {/* Always show data from the actual connected item */}
            <Text fontSize="13px" fontWeight="600" color={labelColor}>
              Connected to {connectedItems[0]?.name}
            </Text>
            <Text fontSize="11px" color={subTextColor}>
              {connectedItems[0]?.name}
            </Text>
          </Box>
        </Flex>
      )}

      {/* ── QuickBooks connected row ──────────────────────────────────────── */}
      {/* Show when QB is already connected, OR during a fresh QB OAuth flow  */}
      {(qbStatus || (justConnected && connectedProvider === 'QuickBooks')) &&
        !(justConnected && connectedProvider !== 'QuickBooks') && (
          <Flex
            align="center"
            gap={3}
            px={4}
            py={3}
            border="1px solid"
            borderColor={itemBorder}
            borderRadius="10px"
          >
            <Center
              w="36px"
              h="36px"
              borderRadius="8px"
              bg={QB_META.bg}
              color="white"
              fontWeight="700"
              fontSize="12px"
              flexShrink={0}
            >
              {QB_META.shortLabel}
            </Center>

            <Box flex={1}>
              {/* Fresh QB OAuth flow */}
              {justConnected && connectedProvider === 'QuickBooks' ? (
                <>
                  <Text fontSize="13px" fontWeight="600" color={labelColor}>
                    Connecting to QuickBooks
                  </Text>
                  <Text fontSize="11px" color={subTextColor}>
                    OAuth authorization in progress
                  </Text>
                </>
              ) : (
                /* QB already connected — show real data */
                <>
                  <Text fontSize="13px" fontWeight="600" color={labelColor}>
                    Connected to {qbStatus?.name}
                  </Text>
                  <Text fontSize="11px" color={subTextColor}>
                    Accounting Integration
                  </Text>
                </>
              )}
            </Box>

            {/* Spinner during active QB OAuth */}
            {isConnecting &&
              !isConnected &&
              connectedProvider === 'QuickBooks' && (
                <Spinner size="sm" color="blue.400" />
              )}
          </Flex>
        )}

      {/* ── Success banner — shown after any fresh OAuth completes ───────── */}
      {justConnected && isConnected && (
        <Flex
          align="center"
          gap={3}
          px={4}
          py={3}
          bg="green.50"
          border="1px solid"
          borderColor="green.200"
          borderRadius="10px"
          _dark={{ bg: 'whiteAlpha.50', borderColor: 'green.600' }}
        >
          <Box
            as="svg"
            width="20px"
            height="20px"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--chakra-colors-green-500)"
            strokeWidth={2}
            flexShrink={0}
          >
            <circle cx="12" cy="12" r="9" />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12l2 2 4-4"
            />
          </Box>
          <Box flex={1}>
            <Text
              fontSize="13px"
              fontWeight="600"
              color="green.700"
              _dark={{ color: 'green.300' }}
            >
              Integration Connected
            </Text>
            <Text
              fontSize="11px"
              color="green.600"
              _dark={{ color: 'green.400' }}
            >
              Successfully connected to {connectedProvider}
            </Text>
          </Box>
        </Flex>
      )}

      {/* ── View Connected button ─────────────────────────────────────────── */}
      <Button
        size="sm"
        colorScheme="blue"
        borderRadius="8px"
        fontSize="13px"
        fontWeight="600"
        alignSelf="flex-start"
        rightIcon={
          <Box
            as="svg"
            width="13px"
            height="13px"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </Box>
        }
        onClick={onViewConnected}
      >
        View Connected Integration
      </Button>
    </Flex>
  );
}

/** Empty state shown before any integration is connected */
function EmptyState({ onOpenModal }: { onOpenModal: () => void }) {
  const labelColor = useColorModeValue('gray.700', 'gray.300');
  const subTextColor = useColorModeValue('gray.500', 'gray.400');
  const iconBg = useColorModeValue('purple.50', 'whiteAlpha.100');
  const iconColor = useColorModeValue('purple.400', 'purple.300');
  const itemBorder = useColorModeValue('gray.200', 'whiteAlpha.200');
  const itemHoverBg = useColorModeValue('gray.50', 'whiteAlpha.50');

  return (
    <Center flexDirection="column" gap={5}>
      {/* Icon */}
      <Center
        w="52px"
        h="52px"
        borderRadius="12px"
        bg={iconBg}
        color={iconColor}
      >
        <img src={connect} />
      </Center>

      {/* Copy */}
      <Box textAlign="center">
        <Text fontSize="sm" fontWeight="700" color={labelColor}>
          No Integration Connected
        </Text>
        <Text fontSize="xs" color={subTextColor} mt="4px" maxW="300px">
          Connect a marketing platform to automatically sync your donor contacts
          for email campaigns, newsletters, and more.
        </Text>
      </Box>

      {/* Integration preview cards */}
      <Flex gap={3} justify="center" flexWrap="wrap">
        {PREVIEW_INTEGRATIONS.map((integration) => (
          <Flex
            key={integration.name}
            direction="column"
            align="center"
            p={3}
            border="1px solid"
            borderColor={itemBorder}
            w="100px"
            minW="140px"
            maxW="140px"
            h="100px"
            cursor="pointer"
            borderRadius="12px"
            gap={3}
            _hover={{ bg: itemHoverBg }}
          >
            <Center
              w="40px"
              h="40px"
              borderRadius="8px"
              bg={integration.bg}
              color="white"
              fontWeight="700"
              fontSize="12px"
            >
              {integration.shortLabel}
            </Center>
            <Text
              fontSize="11px"
              fontWeight="500"
              color={labelColor}
              textAlign="center"
            >
              {integration.name}
            </Text>
          </Flex>
        ))}
      </Flex>

      {/* CTA button */}
      <Button
        size="sm"
        colorScheme="blue"
        borderRadius="8px"
        fontSize="13px"
        fontWeight="600"
        px={5}
        leftIcon={
          <img
            src={buttonConnect}
            width="15"
            height="15"
            style={{ objectFit: 'contain' }}
          />
        }
        onClick={onOpenModal}
      >
        Connect Integration
      </Button>
    </Center>
  );
}

// ── ConnectTab ─────────────────────────────────────────────────────────────────

export interface ConnectTabProps {
  isLoadingInitial: boolean;
  isConnecting: boolean;
  isConnected: boolean;
  justConnected: boolean;
  connectedProvider: string;
  connectedItems: ConnectedIntegration[];
  qbStatus: QuickbooksStatusData | null;
  onOpenModal: () => void;
  onViewConnected: () => void;
}

export default function ConnectTab({
  isLoadingInitial,
  isConnecting,
  isConnected,
  justConnected,
  connectedProvider,
  connectedItems,
  qbStatus,
  onOpenModal,
  onViewConnected,
}: ConnectTabProps) {
  if (isLoadingInitial) return <LoadingState />;

  // Show ConnectingState if ANY integration is active (standard OR QuickBooks)
  const hasAnyConnection =
    isConnecting || connectedItems.length > 0 || qbStatus !== null;

  if (hasAnyConnection) {
    return (
      <ConnectingState
        connectedProvider={connectedProvider}
        connectedItems={connectedItems}
        isConnecting={isConnecting}
        isConnected={isConnected}
        justConnected={justConnected}
        qbStatus={qbStatus}
        onViewConnected={onViewConnected}
      />
    );
  }

  return <EmptyState onOpenModal={onOpenModal} />;
}
