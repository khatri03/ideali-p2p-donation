import React from 'react';
import PermissionGate from '../../../common/PermissionGate';
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
import { getIntegrationMeta } from '../../../../service/organizer/Settings/quickBooks/quickBOption';
import buttonConnect from '../../../../../assets/img/organizer/integrations/buttonConnect.svg';

// QuickBooks brand colours / label
const QB_META = { bg: '#2CA01C', shortLabel: 'QB' };

// ── Sub-components ─────────────────────────────────────────────────────────────

function EmptyConnectedState() {
  const emptyTextColor = useColorModeValue('gray.500', 'gray.400');
  const emptyIconColor = useColorModeValue('gray.300', 'gray.600');

  return (
    <Center flexDirection="column" py={10} gap={3}>
      <Box color={emptyIconColor}>
        <Box
          as="svg"
          width="48px"
          height="48px"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
          />
        </Box>
      </Box>
      <Text fontSize="sm" fontWeight="600" color={emptyTextColor}>
        No Connected Integrations
      </Text>
      <Text fontSize="xs" color={emptyTextColor} textAlign="center">
        You haven't connected any integrations yet.
        <br />
        Go to the Connect tab to get started.
      </Text>
    </Center>
  );
}

/** A single standard (contact-sync) connected integration card */
function ConnectedIntegrationCard({ item }: { item: ConnectedIntegration }) {
  const labelColor = useColorModeValue('gray.700', 'gray.300');
  const subTextColor = useColorModeValue('gray.500', 'gray.400');
  const itemBorder = useColorModeValue('gray.200', 'whiteAlpha.200');

  const meta = getIntegrationMeta(item.name);

  const detailRows = [
    {
      icon: (
        <Box
          as="svg"
          width="14px"
          height="14px"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </Box>
      ),
      label: 'Provider',
      value: item.name,
      mono: false,
    },
    {
      icon: (
        <Box
          as="svg"
          width="14px"
          height="14px"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </Box>
      ),
      label: 'Last Connected',
      value: new Date(item.lastConnectedUtc).toLocaleString(),
      mono: false,
    },
  ];

  return (
    <Flex direction="column" gap={3}>
      {/* Green connected banner */}
      <Flex
        align="center"
        gap={2}
        px={4}
        py="10px"
        bg="green.50"
        border="1px solid"
        borderColor="green.200"
        borderRadius="10px"
        _dark={{ bg: 'whiteAlpha.50', borderColor: 'green.700' }}
      >
        <Box
          w="8px"
          h="8px"
          borderRadius="full"
          bg="green.400"
          flexShrink={0}
        />
        <Text
          fontSize="13px"
          fontWeight="600"
          color="green.700"
          _dark={{ color: 'green.300' }}
        >
          Connected to {item.name}
        </Text>
      </Flex>

      {/* Provider card + detail rows */}
      <Box
        border="1px solid"
        borderColor={itemBorder}
        borderRadius="10px"
        overflow="hidden"
      >
        {/* Header */}
        <Flex
          align="center"
          gap={3}
          px={4}
          py={3}
          bg={useColorModeValue('white', 'transparent')}
          borderBottom="1px solid"
          borderColor={itemBorder}
        >
          <Center
            w="36px"
            h="36px"
            borderRadius="8px"
            bg={meta.bg}
            color="white"
            fontWeight="700"
            fontSize="12px"
            flexShrink={0}
          >
            {meta.shortLabel}
          </Center>
          <Box>
            <Text fontSize="13px" fontWeight="700" color={labelColor}>
              {item.name}
            </Text>
            <Text fontSize="11px" color={subTextColor}>
              Email Marketing Platform
            </Text>
          </Box>
        </Flex>

        {/* Detail rows */}
        {detailRows.map((row, i, arr) => (
          <Flex
            key={row.label}
            align="center"
            px={4}
            py="10px"
            gap={3}
            bg={useColorModeValue(
              i % 2 === 0 ? 'gray.50' : 'white',
              i % 2 === 0 ? 'whiteAlpha.50' : 'transparent',
            )}
            borderBottom={i < arr.length - 1 ? '1px solid' : 'none'}
            borderColor={itemBorder}
          >
            <Box color={subTextColor} flexShrink={0}>
              {row.icon}
            </Box>
            <Text
              fontSize="12px"
              fontWeight="500"
              color={subTextColor}
              w="110px"
              flexShrink={0}
            >
              {row.label}
            </Text>
            <Text
              fontSize="12px"
              fontWeight="600"
              color={labelColor}
              fontFamily={row.mono ? 'mono' : 'inherit'}
              isTruncated
            >
              {row.value}
            </Text>
          </Flex>
        ))}
      </Box>
    </Flex>
  );
}

/** QuickBooks connected integration card */
function QbIntegrationCard({ qb }: { qb: QuickbooksStatusData }) {
  const labelColor = useColorModeValue('gray.700', 'gray.300');
  const subTextColor = useColorModeValue('gray.500', 'gray.400');
  const itemBorder = useColorModeValue('gray.200', 'whiteAlpha.200');

  const detailRows = [
    {
      icon: (
        <Box
          as="svg"
          width="14px"
          height="14px"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </Box>
      ),
      label: 'Provider',
      value: qb.name,
      valueColor: undefined,
    },
    {
      icon: (
        <Box
          as="svg"
          width="14px"
          height="14px"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </Box>
      ),
      label: 'Connected At',
      value: new Date(qb.connectedAtUtc).toLocaleString(),
      valueColor: undefined,
    },
    {
      icon: (
        <Box
          as="svg"
          width="14px"
          height="14px"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </Box>
      ),
      label: 'Status',
      value: qb.isConnected ? 'Active' : 'Disconnected',
      valueColor: qb.isConnected ? 'green.500' : 'red.400',
    },
  ];

  return (
    <Flex direction="column" gap={3}>
      {/* Green connected banner */}
      <Flex
        align="center"
        gap={2}
        px={4}
        py="10px"
        bg="green.50"
        border="1px solid"
        borderColor="green.200"
        borderRadius="10px"
        _dark={{ bg: 'whiteAlpha.50', borderColor: 'green.700' }}
      >
        <Box
          w="8px"
          h="8px"
          borderRadius="full"
          bg="green.400"
          flexShrink={0}
        />
        <Text
          fontSize="13px"
          fontWeight="600"
          color="green.700"
          _dark={{ color: 'green.300' }}
        >
          Connected to {qb.name}
        </Text>
      </Flex>

      {/* Provider card + detail rows */}
      <Box
        border="1px solid"
        borderColor={itemBorder}
        borderRadius="10px"
        overflow="hidden"
      >
        {/* Header */}
        <Flex
          align="center"
          gap={3}
          px={4}
          py={3}
          bg={useColorModeValue('white', 'transparent')}
          borderBottom="1px solid"
          borderColor={itemBorder}
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
          <Box>
            <Text fontSize="13px" fontWeight="700" color={labelColor}>
              {qb.name}
            </Text>
            <Text fontSize="11px" color={subTextColor}>
              Accounting &amp; Invoicing
            </Text>
          </Box>
        </Flex>

        {/* Detail rows */}
        {detailRows.map((row, i, arr) => (
          <Flex
            key={row.label}
            align="center"
            px={4}
            py="10px"
            gap={3}
            bg={useColorModeValue(
              i % 2 === 0 ? 'gray.50' : 'white',
              i % 2 === 0 ? 'whiteAlpha.50' : 'transparent',
            )}
            borderBottom={i < arr.length - 1 ? '1px solid' : 'none'}
            borderColor={itemBorder}
          >
            <Box color={subTextColor} flexShrink={0}>
              {row.icon}
            </Box>
            <Text
              fontSize="12px"
              fontWeight="500"
              color={subTextColor}
              w="110px"
              flexShrink={0}
            >
              {row.label}
            </Text>
            <Text
              fontSize="12px"
              fontWeight="600"
              color={row.valueColor ?? labelColor}
              isTruncated
            >
              {row.value}
            </Text>
          </Flex>
        ))}
      </Box>
    </Flex>
  );
}

// ── ConnectedTab ───────────────────────────────────────────────────────────────

export interface ConnectedTabProps {
  isLoadingConnected: boolean;
  connectedItems: ConnectedIntegration[];
  qbStatus: QuickbooksStatusData | null;
  onOpenModal: () => void;
}

export default function ConnectedTab({
  isLoadingConnected,
  connectedItems,
  qbStatus,
  onOpenModal,
}: ConnectedTabProps) {
  const labelColor = useColorModeValue('gray.700', 'gray.300');

  if (isLoadingConnected) {
    return (
      <Center py={10}>
        <Spinner size="md" color="blue.500" />
      </Center>
    );
  }

  const hasAnything = connectedItems.length > 0 || qbStatus !== null;
  if (!hasAnything) return (
    <PermissionGate permission="integration:list:view" showAccessDenied deniedMessage="You don't have permission to view integrations.">
      <EmptyConnectedState />
    </PermissionGate>
  );

  return (
    <PermissionGate permission="integration:list:view" showAccessDenied deniedMessage="You don't have permission to view integrations.">
    <Flex direction="column" gap={3}>
      {/* Header row */}
      <Flex align="center" justify="space-between" mb={1}>
        <Text fontSize="13px" fontWeight="600" color={labelColor}>
          Connected Integrations
        </Text>
        <PermissionGate permission="integration:create">
          <Button
            size="xs"
            colorScheme="blue"
            borderRadius="7px"
            fontSize="12px"
            fontWeight="600"
            px={3}
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
        </PermissionGate>
      </Flex>

      {/* Standard contact-sync integration cards */}
      {connectedItems.map((item) => (
        <ConnectedIntegrationCard key={item.uniqueId} item={item} />
      ))}

      {/* QuickBooks card — rendered when QB is connected */}
      {qbStatus && <QbIntegrationCard qb={qbStatus} />}
    </Flex>
    </PermissionGate>
  );
}
