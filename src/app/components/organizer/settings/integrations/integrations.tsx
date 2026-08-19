import React, { useEffect, useState } from 'react';
import {
  Box,
  Flex,
  Text,
  useColorModeValue,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import Card from 'themeComponents/card/Card';
import ContactSyncService, {
  AvailableIntegration,
  ConnectedIntegration,
} from '../../../../service/organizer/Settings/contactSyncService';
import QuickbooksService, {
  QuickbooksStatusData,
} from '../../../../service/organizer/Settings/quickBooks/quickBookService';
import { QUICKBOOKS_OPTION } from 'app/service/organizer/Settings/quickBooks/quickBOption';
import SelectIntegrationModal from './selectIntegrationModal';
import IntegrationsView from '../integrations/integrationsView';
import HttpClient from 'app/service/httpClient/HttpClient';

// ── Helpers ────────────────────────────────────────────────────────────────────

function generateState(length = 32): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from(crypto.getRandomValues(new Uint8Array(length)))
    .map((b) => chars[b % chars.length])
    .join('');
}

// Session-storage keys
const SS = {
  PROVIDER: 'oauth_provider',
  PROVIDER_NAME: 'oauth_provider_name',
  STATE: 'oauth_state',
  IS_QUICKBOOKS: 'oauth_is_quickbooks',
} as const;

const INTEGRATIONS_RETURN_URL = `${window.location.origin}/organizer/setting/integrations`;

// ── Helper: fetch full QB status object ────────────────────────────────────────
async function fetchQbStatusFull(): Promise<QuickbooksStatusData | null> {
  try {
    const res = await HttpClient.get<{
      data: QuickbooksStatusData;
      success: boolean;
    }>('/quickbooks/integration/qb-status');
    if (res.data?.data?.isConnected) return res.data.data;
    return null;
  } catch {
    return null;
  }
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function Integrations() {
  // Modal state
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [availableIntegrations, setAvailableIntegrations] = useState<
    AvailableIntegration[]
  >([]);
  const [isLoadingIntegrations, setIsLoadingIntegrations] = useState(false);
  const [integrationError, setIntegrationError] = useState<string | null>(null);
  const [selectedValue, setSelectedValue] = useState<number | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  // Connection state
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedProvider, setConnectedProvider] = useState('');
  const [connectedItems, setConnectedItems] = useState<ConnectedIntegration[]>(
    [],
  );
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);

  // QuickBooks status
  const [qbStatus, setQbStatus] = useState<QuickbooksStatusData | null>(null);

  const toast = useToast();
  const cardBg = useColorModeValue('white', 'navy.800');
  const subTextColor = useColorModeValue('gray.500', 'gray.400');

  // ── OAuth Callback Handler ──────────────────────────────────────────────────

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const stateParam = params.get('state');
    const realmId = params.get('realmId');

    if (!code) {
      Promise.all([ContactSyncService.getConnectedItems(), fetchQbStatusFull()])
        .then(([items, qb]) => {
          setConnectedItems(items);
          setQbStatus(qb);
        })
        .catch(() => {})
        .finally(() => setIsLoadingInitial(false));
      return;
    }

    const savedState = sessionStorage.getItem(SS.STATE);
    const providerName =
      sessionStorage.getItem(SS.PROVIDER_NAME) ?? 'Integration';
    const isQuickbooks = sessionStorage.getItem(SS.IS_QUICKBOOKS) === 'true';

    setIsConnecting(true);
    setConnectedProvider(providerName);
    setIsLoadingInitial(false);

    if (!savedState || savedState !== stateParam) {
      toast({
        title: 'Security check failed.',
        description: 'State mismatch detected. Please try connecting again.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
      setIsConnecting(false);
      clearOAuthSession();
      return;
    }

    if (isQuickbooks) {
      finishQuickbooksConnect(code, savedState, realmId ?? '');
    } else {
      finishStandardConnect(code);
    }
  }, []);

  // ── OAuth helpers ───────────────────────────────────────────────────────────

  function clearOAuthSession() {
    Object.values(SS).forEach((key) => sessionStorage.removeItem(key));
    window.history.replaceState({}, '', window.location.pathname);
  }

  async function finishQuickbooksConnect(
    code: string,
    state: string,
    realmId: string,
  ) {
    try {
      await QuickbooksService.handleCallback(
        code,
        state,
        realmId,
        INTEGRATIONS_RETURN_URL,
      );
      setIsConnected(true);
      // Fetch BOTH QB status and standard connected items before clearing
      // isConnecting so all existing integrations remain visible
      const [qb, items] = await Promise.all([
        fetchQbStatusFull(),
        ContactSyncService.getConnectedItems(),
      ]);
      setQbStatus(qb);
      setConnectedItems(items);
      setIsConnecting(false);
      clearOAuthSession();
    } catch {
      toast({
        title: 'Failed to connect QuickBooks.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setIsConnecting(false);
    }
  }

  async function finishStandardConnect(code: string) {
    const provider = Number(sessionStorage.getItem(SS.PROVIDER));
    try {
      await ContactSyncService.connectIntegration(
        provider,
        code,
        INTEGRATIONS_RETURN_URL,
      );
      setIsConnected(true);
      // Fetch BOTH before clearing isConnecting so every existing integration
      // (CC + QB) stays visible and hasAnyConnection never momentarily hits false
      const [items, qb] = await Promise.all([
        ContactSyncService.getConnectedItems(),
        fetchQbStatusFull(),
      ]);
      setConnectedItems(items);
      setQbStatus(qb);
      setIsConnecting(false);
      clearOAuthSession();
    } catch {
      toast({
        title: 'Failed to connect integration.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setIsConnecting(false);
    }
  }

  // ── Modal open ──────────────────────────────────────────────────────────────

  const handleOpenModal = async () => {
    onOpen();
    setSelectedValue(null);
    setIntegrationError(null);
    setAvailableIntegrations([]);
    setIsLoadingIntegrations(true);

    try {
      const data = await ContactSyncService.getAvailableIntegrations();
      setAvailableIntegrations(data);
    } catch {
      setIntegrationError('Failed to load integrations. Please try again.');
    } finally {
      setIsLoadingIntegrations(false);
    }
  };

  // ── QuickBooks OAuth — Step 1 ────────────────────────────────────────────────

  const handleQuickbooksConnect = async () => {
    setIsConfirming(true);
    try {
      const state = generateState(32);
      sessionStorage.setItem(SS.STATE, state);
      sessionStorage.setItem(SS.PROVIDER_NAME, 'QuickBooks');
      sessionStorage.setItem(SS.IS_QUICKBOOKS, 'true');

      const authUrl = await QuickbooksService.getAuthUrl(
        INTEGRATIONS_RETURN_URL,
        state,
      );
      if (!authUrl) throw new Error('No auth URL returned from QuickBooks.');
      window.location.href = authUrl;
      onClose();
    } catch {
      toast({
        title: 'Failed to connect QuickBooks.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsConfirming(false);
    }
  };

  // ── Standard OAuth — Step 1 ──────────────────────────────────────────────────

  const handleStandardConnect = async () => {
    if (selectedValue === null) return;
    setIsConfirming(true);
    try {
      const state = generateState(32);
      sessionStorage.setItem(SS.STATE, state);
      sessionStorage.setItem(SS.PROVIDER, String(selectedValue));
      sessionStorage.setItem(
        SS.PROVIDER_NAME,
        availableIntegrations.find((i) => i.value === selectedValue)?.text ??
          '',
      );
      sessionStorage.setItem(SS.IS_QUICKBOOKS, 'false');

      const response = await ContactSyncService.getAuthUrl(
        selectedValue,
        INTEGRATIONS_RETURN_URL,
        state,
      );
      const authUrl = response?.authUrl;
      if (!authUrl) return;
      window.location.href = authUrl;
      onClose();
    } catch {
      toast({
        title: 'Failed to connect integration.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsConfirming(false);
    }
  };

  // ── Unified confirm handler ─────────────────────────────────────────────────

  const handleConfirm = () => {
    if (selectedValue === QUICKBOOKS_OPTION.value) {
      handleQuickbooksConnect();
    } else {
      handleStandardConnect();
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <Flex direction="column" pt={{ sm: '25px', lg: '5px' }} mt={14}>
        <Card p="0px" bg={cardBg} overflow="hidden">
          {/* ── Header ── */}
          <Flex px={5} pt={4} pb={3} align="center" justify="space-between">
            <Box>
              <Text
                fontSize="lg"
                fontWeight="700"
                color={useColorModeValue('gray.800', 'white')}
              >
                Integrations
              </Text>
              <Text fontSize="xs" color={subTextColor} mt="2px">
                Connect third-party marketing tools to sync your donor contacts
              </Text>
            </Box>
          </Flex>

          {/* ── Body ── */}
          <Box px={5} py={5}>
            <IntegrationsView
              isLoadingInitial={isLoadingInitial}
              isConnecting={isConnecting}
              isConnected={isConnected}
              connectedProvider={connectedProvider}
              connectedItems={connectedItems}
              qbStatus={qbStatus}
              onOpenModal={handleOpenModal}
            />
          </Box>
        </Card>
      </Flex>

      {/* ── Integration Selection Modal ── */}
      <SelectIntegrationModal
        isOpen={isOpen}
        onClose={onClose}
        availableIntegrations={availableIntegrations}
        isLoading={isLoadingIntegrations}
        error={integrationError}
        selectedValue={selectedValue}
        isConfirming={isConfirming}
        onSelect={setSelectedValue}
        onConfirm={handleConfirm}
      />
    </>
  );
}
