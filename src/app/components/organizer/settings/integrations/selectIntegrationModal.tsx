import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Flex,
  Box,
  Text,
  Button,
  Center,
  Spinner,
  IconButton,
  useColorModeValue,
} from '@chakra-ui/react';
import { CloseIcon } from '@chakra-ui/icons';
import { AvailableIntegration } from '../../../../service/organizer/Settings/contactSyncService';
import {
  getIntegrationMeta,
  QUICKBOOKS_OPTION,
} from '../../../../service/organizer/Settings/quickBooks/quickBOption';

// ── Sub-components ─────────────────────────────────────────────────────────────

interface IntegrationRowProps {
  value: number;
  text: string;
  isSelected: boolean;
  onSelect: (value: number) => void;
  itemBorder: string;
  itemSelectedBorder: string;
  itemSelectedBg: string;
  itemHoverBg: string;
  itemLabelColor: string;
}

function IntegrationRow({
  value,
  text,
  isSelected,
  onSelect,
  itemBorder,
  itemSelectedBorder,
  itemSelectedBg,
  itemHoverBg,
  itemLabelColor,
}: IntegrationRowProps) {
  const meta = getIntegrationMeta(text);

  return (
    <Flex
      key={value}
      align="center"
      gap={3}
      px={4}
      py={3}
      border="1px solid"
      borderColor={isSelected ? itemSelectedBorder : itemBorder}
      borderRadius="10px"
      bg={isSelected ? itemSelectedBg : 'transparent'}
      cursor="pointer"
      _hover={{ bg: isSelected ? itemSelectedBg : itemHoverBg }}
      onClick={() => onSelect(value)}
      transition="all 0.15s"
    >
      {/* Provider icon */}
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

      {/* Provider name */}
      <Text
        flex={1}
        fontSize="13px"
        fontWeight={isSelected ? '600' : '500'}
        color={itemLabelColor}
      >
        {text}
      </Text>

      {/* Selected checkmark */}
      {isSelected && (
        <Box
          as="svg"
          width="20px"
          height="20px"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--chakra-colors-blue-500)"
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
      )}
    </Flex>
  );
}

// ── Main Modal Component ───────────────────────────────────────────────────────

export interface SelectIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableIntegrations: AvailableIntegration[];
  isLoading: boolean;
  error: string | null;
  selectedValue: number | null;
  isConfirming: boolean;
  onSelect: (value: number) => void;
  onConfirm: () => void;
}

export default function SelectIntegrationModal({
  isOpen,
  onClose,
  availableIntegrations,
  isLoading,
  error,
  selectedValue,
  isConfirming,
  onSelect,
  onConfirm,
}: SelectIntegrationModalProps) {
  const modalBg = useColorModeValue('white', 'navy.800');
  const modalHeaderColor = useColorModeValue('gray.800', 'white');
  const subTextColor = useColorModeValue('gray.500', 'gray.400');
  const itemBorder = useColorModeValue('gray.200', 'whiteAlpha.200');
  const itemHoverBg = useColorModeValue('gray.50', 'whiteAlpha.50');
  const itemSelectedBg = useColorModeValue('blue.50', 'whiteAlpha.100');
  const itemSelectedBorder = useColorModeValue('blue.400', 'blue.300');
  const itemLabelColor = useColorModeValue('gray.700', 'gray.200');

  // Merge API integrations with the hardcoded Quickbooks option
  const allIntegrations: AvailableIntegration[] = [
    ...availableIntegrations,
    QUICKBOOKS_OPTION,
  ];

  const rowProps = {
    itemBorder,
    itemSelectedBorder,
    itemSelectedBg,
    itemHoverBg,
    itemLabelColor,
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="sm">
      <ModalOverlay bg="blackAlpha.400" backdropFilter="blur(2px)" />
      <ModalContent bg={modalBg} borderRadius="14px" overflow="hidden" mx={4}>
        {/* ── Header ── */}
        <ModalHeader
          px={5}
          pt={5}
          pb={3}
          display="flex"
          alignItems="center"
          justifyContent="space-between"
        >
          <Text fontSize="md" fontWeight="700" color={modalHeaderColor}>
            Select Integration
          </Text>
          <IconButton
            aria-label="Close modal"
            icon={<CloseIcon boxSize="10px" />}
            size="xs"
            variant="ghost"
            borderRadius="full"
            color={subTextColor}
            onClick={onClose}
          />
        </ModalHeader>

        {/* ── Body ── */}
        <ModalBody px={5} pb={4}>
          {isLoading ? (
            <Center py={8}>
              <Spinner size="md" color="blue.500" />
            </Center>
          ) : error ? (
            <Text fontSize="13px" color="red.400" textAlign="center" py={6}>
              {error}
            </Text>
          ) : allIntegrations.length === 0 ? (
            <Text
              fontSize="13px"
              color={subTextColor}
              textAlign="center"
              py={6}
            >
              No integrations available.
            </Text>
          ) : (
            <Flex direction="column" gap={3}>
              {allIntegrations.map((integ) => (
                <IntegrationRow
                  key={integ.value}
                  value={integ.value}
                  text={integ.text}
                  isSelected={selectedValue === integ.value}
                  onSelect={onSelect}
                  {...rowProps}
                />
              ))}
            </Flex>
          )}
        </ModalBody>

        {/* ── Footer ── */}
        <ModalFooter px={5} pt={2} pb={5} gap={3}>
          <Button
            flex={1}
            size="sm"
            variant="outline"
            borderRadius="8px"
            fontSize="13px"
            fontWeight="500"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            flex={1}
            size="sm"
            colorScheme="blue"
            borderRadius="8px"
            fontSize="13px"
            fontWeight="600"
            isDisabled={selectedValue === null}
            isLoading={isConfirming}
            onClick={onConfirm}
          >
            Confirm
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
