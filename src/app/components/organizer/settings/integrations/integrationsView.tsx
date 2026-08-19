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
import {
  getIntegrationMeta,
  PREVIEW_INTEGRATIONS,
} from '../../../../service/organizer/Settings/quickBooks/quickBOption';
import connect from '../../../../../assets/img/organizer/integrations/connect.svg';
import buttonConnect from '../../../../../assets/img/organizer/integrations/buttonConnect.svg';

const QB_META = { bg: '#2CA01C', shortLabel: 'QB' };

// ── Empty State ────────────────────────────────────────────────────────────────

function EmptyState({ onOpenModal }: { onOpenModal: () => void }) {
  // All hooks unconditionally at the top
  const labelColor = useColorModeValue('gray.700', 'gray.300');
  const subTextColor = useColorModeValue('gray.500', 'gray.400');
  const iconBg = useColorModeValue('purple.50', 'whiteAlpha.100');
  const iconColor = useColorModeValue('purple.400', 'purple.300');
  const itemBorder = useColorModeValue('gray.200', 'whiteAlpha.200');
  const itemHoverBg = useColorModeValue('gray.50', 'whiteAlpha.50');

  return (
    <Center flexDirection="column" gap={5} py={6}>
      <Center
        w="52px"
        h="52px"
        borderRadius="12px"
        bg={iconBg}
        color={iconColor}
      >
        <img src={connect} />
      </Center>
      <Box textAlign="center">
        <Text fontSize="sm" fontWeight="700" color={labelColor}>
          No Integration Connected
        </Text>
        <Text fontSize="xs" color={subTextColor} mt="4px" maxW="300px">
          Connect a marketing platform to automatically sync your donor contacts
          for email campaigns, newsletters, and more.
        </Text>
      </Box>
      <Flex gap={3} justify="center" flexWrap="wrap">
        {PREVIEW_INTEGRATIONS.map((integration) => (
          <Flex
            key={integration.name}
            direction="column"
            align="center"
            p={3}
            border="1px solid"
            borderColor={itemBorder}
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
      <PermissionGate permission="integration:create">
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
      </PermissionGate>
    </Center>
  );
}

// ── Single Integration Card ────────────────────────────────────────────────────

function IntegrationCard({
  avatarBg,
  shortLabel,
  name,
  subtitle,
  providerValue,
  lastConnectedValue,
}: {
  avatarBg: string;
  shortLabel: string;
  name: string;
  subtitle: string;
  providerValue: string;
  lastConnectedValue: string;
}) {
  // All hooks unconditionally at the top
  const labelColor = useColorModeValue('gray.800', 'white');
  const subTextColor = useColorModeValue('gray.500', 'gray.400');
  const metaLabelColor = useColorModeValue('gray.500', 'gray.400');
  const metaValueColor = useColorModeValue('gray.700', 'gray.200');
  const cardBorder = useColorModeValue('gray.200', 'whiteAlpha.200');
  const cardBg = useColorModeValue('white', 'navy.700');
  const dividerColor = useColorModeValue('gray.100', 'whiteAlpha.100');
  const greenBg = useColorModeValue('green.50', 'rgba(72,187,120,0.07)');
  const badgeBg = useColorModeValue('green.100', 'rgba(72,187,120,0.15)');
  const badgeColor = useColorModeValue('green.600', 'green.300');

  return (
    <Box
      border="1px solid"
      borderColor={cardBorder}
      borderRadius="12px"
      overflow="hidden"
      bg={cardBg}
    >
      {/* Card header */}
      <Flex
        align="center"
        gap={3}
        px={4}
        py={3}
        bg={greenBg}
        borderBottom="1px solid"
        borderColor={dividerColor}
      >
        <Center
          w="38px"
          h="38px"
          borderRadius="9px"
          bg={avatarBg}
          color="white"
          fontWeight="700"
          fontSize="12px"
          flexShrink={0}
        >
          {shortLabel}
        </Center>
        <Box flex={1}>
          <Flex align="center" gap={2}>
            <Text fontSize="13px" fontWeight="700" color={labelColor}>
              {name}
            </Text>
            <Flex
              align="center"
              gap={1}
              px="6px"
              py="2px"
              bg={'#20C55D'}
              borderRadius="20px"
            >
              <Box w="5px" h="5px" borderRadius="full" bg="white " />
              <Text
                fontSize="10px"
                fontWeight="700"
                color={'White'}
                letterSpacing="0.4px"
                textTransform="uppercase"
              >
                Connected
              </Text>
            </Flex>
          </Flex>
          <Text fontSize="11px" color={subTextColor} mt="1px">
            {subtitle}
          </Text>
        </Box>
      </Flex>

      {/* Provider | Last Connected */}
      <Flex px={4} py="10px" gap={4}>
        <Flex align="center" gap={2} flex={1}>
          <Box color={metaLabelColor}>
            <Box
              as="svg"
              width="13px"
              height="13px"
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
          </Box>
          <Box>
            <Text fontSize="10px" color={metaLabelColor} fontWeight="500">
              Provider
            </Text>
            <Text fontSize="12px" fontWeight="600" color={metaValueColor}>
              {providerValue}
            </Text>
          </Box>
        </Flex>

        <Box w="1px" bg={dividerColor} alignSelf="stretch" />

        <Flex align="center" gap={2} flex={1}>
          <Box color={metaLabelColor}>
            <Box
              as="svg"
              width="13px"
              height="13px"
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
          </Box>
          <Box>
            <Text fontSize="10px" color={metaLabelColor} fontWeight="500">
              Last Connected
            </Text>
            <Text fontSize="12px" fontWeight="600" color={metaValueColor}>
              {lastConnectedValue}
            </Text>
          </Box>
        </Flex>
      </Flex>
    </Box>
  );
}

// ── In-Progress Card ───────────────────────────────────────────────────────────
// Extracted into its own component so hooks are always called unconditionally

function ConnectingCard({ providerName }: { providerName: string }) {
  const borderColor = useColorModeValue('blue.200', 'blue.700');
  const bg = useColorModeValue('blue.50', 'rgba(66,153,225,0.07)');
  const titleColor = useColorModeValue('blue.700', 'blue.300');
  const subColor = useColorModeValue('blue.500', 'blue.400');

  return (
    <Flex
      align="center"
      gap={3}
      px={4}
      py={3}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="12px"
      bg={bg}
    >
      <Spinner size="sm" color="blue.400" />
      <Box>
        <Text fontSize="13px" fontWeight="600" color={titleColor}>
          Connecting to {providerName}
        </Text>
        <Text fontSize="11px" color={subColor}>
          OAuth authorization in progress…
        </Text>
      </Box>
    </Flex>
  );
}

// ── Connected View ─────────────────────────────────────────────────────────────

function ConnectedView({
  connectedItems,
  qbStatus,
  isConnecting,
  connectedProvider,
  onOpenModal,
}: {
  connectedItems: ConnectedIntegration[];
  qbStatus: QuickbooksStatusData | null;
  isConnecting: boolean;
  connectedProvider: string;
  onOpenModal: () => void;
}) {
  // All hooks unconditionally at the top
  const labelColor = useColorModeValue('gray.700', 'gray.300');

  return (
    <Flex direction="column" gap={4}>
      {/* Header row */}
      <Flex align="center" justify="space-between">
        <Text fontSize="13px" fontWeight="600" color={labelColor}>
          Connected Integrations
        </Text>
        <PermissionGate permission="integration:create">
          <Button
            size="sm"
            colorScheme="blue"
            borderRadius="8px"
            fontSize="12px"
            fontWeight="600"
            px={4}
            leftIcon={
              <Box fontSize="16px" lineHeight={1} mt="-1px">
                +
              </Box>
            }
            onClick={onOpenModal}
          >
            Add New Integration
          </Button>
        </PermissionGate>
      </Flex>

      {/* Standard contact-sync cards */}
      {connectedItems.map((item) => {
        const meta = getIntegrationMeta(item.name);
        return (
          <IntegrationCard
            key={item.uniqueId}
            avatarBg={meta.bg}
            shortLabel={meta.shortLabel}
            name={item.name}
            subtitle="Email marketing & automation"
            providerValue={item.name}
            lastConnectedValue={new Date(
              item.lastConnectedUtc,
            ).toLocaleString()}
          />
        );
      })}

      {/* QuickBooks card */}
      {qbStatus && (
        <IntegrationCard
          avatarBg={QB_META.bg}
          shortLabel={QB_META.shortLabel}
          name={qbStatus.name}
          subtitle="Accounting & Invoicing"
          providerValue={qbStatus.name}
          lastConnectedValue={new Date(
            qbStatus.connectedAtUtc,
          ).toLocaleString()}
        />
      )}

      {/* In-progress card — ConnectingCard is its own component so hooks
          inside it are never called conditionally from this level */}
      {isConnecting && <ConnectingCard providerName={connectedProvider} />}
    </Flex>
  );
}

// ── IntegrationsView (main export) ─────────────────────────────────────────────

export interface IntegrationsViewProps {
  isLoadingInitial: boolean;
  isConnecting: boolean;
  isConnected: boolean;
  connectedProvider: string;
  connectedItems: ConnectedIntegration[];
  qbStatus: QuickbooksStatusData | null;
  onOpenModal: () => void;
}

export default function IntegrationsView({
  isLoadingInitial,
  isConnecting,
  connectedProvider,
  connectedItems,
  qbStatus,
  onOpenModal,
}: IntegrationsViewProps) {
  if (isLoadingInitial) {
    return (
      <Center py={10}>
        <Spinner size="md" color="blue.500" />
      </Center>
    );
  }

  const hasAnyConnection =
    connectedItems.length > 0 || qbStatus !== null || isConnecting;

  if (!hasAnyConnection) {
    return <EmptyState onOpenModal={onOpenModal} />;
  }

  return (
    <PermissionGate permission="integration:list:view" showAccessDenied deniedMessage="You don't have permission to view integrations.">
      <ConnectedView
        connectedItems={connectedItems}
        qbStatus={qbStatus}
        isConnecting={isConnecting}
        connectedProvider={connectedProvider}
        onOpenModal={onOpenModal}
      />
    </PermissionGate>
  );
}
