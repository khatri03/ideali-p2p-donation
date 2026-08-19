//Filter Menu
import React from 'react';
import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  MenuGroup,
  Button,
} from '@chakra-ui/react';
import { FiFilter } from 'react-icons/fi';
import { ChevronDownIcon } from '@chakra-ui/icons';
import {
  InvoiceStatus,
  STATUS_LABELS,
  getStatusOptions,
} from './invoiceStatusUtils';

interface FilterMenuProps {
  qbStatusFilter: string;
  setQbStatusFilter: (value: string) => void;
  selectedStatus: string;
  setSelectedStatus: (value: string) => void;
}

const QB_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Synced', value: 'synced' },
  { label: 'Not Synced', value: 'not_synced' },
];

const PAYMENT_STATUS_OPTIONS = getStatusOptions().filter((o) => o.value !== '');

export function FilterMenu({
  qbStatusFilter,
  setQbStatusFilter,
  selectedStatus,
  setSelectedStatus,
}: FilterMenuProps) {
  const isFiltered = qbStatusFilter !== '' || selectedStatus !== '';

  const activeLabel = (() => {
    if (qbStatusFilter) {
      return (
        QB_OPTIONS.find((o) => o.value === qbStatusFilter)?.label ?? 'Filter'
      );
    }
    if (selectedStatus) {
      return STATUS_LABELS[selectedStatus as InvoiceStatus] ?? 'Filter';
    }
    return 'Filter';
  })();

  return (
    <Menu closeOnSelect={true}>
      <MenuButton
        as={Button}
        size="sm"
        h="38px"
        px={3}
        leftIcon={<FiFilter />}
        rightIcon={<ChevronDownIcon />}
        borderRadius="md"
        bg={isFiltered ? 'blue.600' : 'white'}
        color={isFiltered ? 'white' : 'gray.700'}
        border="1px solid"
        borderColor={isFiltered ? 'blue.600' : 'gray.200'}
        minW="fit-content" // ← was fixed "120px", now grows with text
        maxW="220px" // ← prevents extreme overflow
        whiteSpace="nowrap" // ← keeps label on one line
        overflow="hidden"
        textOverflow="ellipsis"
        fontSize="sm"
        fontWeight="500"
        _hover={{ bg: isFiltered ? 'blue.700' : 'gray.50' }}
        _active={{ bg: isFiltered ? 'blue.800' : 'gray.100' }}
      >
        {isFiltered ? activeLabel : 'Filter'}
      </MenuButton>

      <MenuList minW="200px" py={1} fontSize="sm" shadow="md">
        {/* QB Sync Options */}
        {QB_OPTIONS.map((option) => (
          <MenuItem
            key={option.value}
            py={2}
            px={4}
            onClick={() => {
              setQbStatusFilter(option.value);
              setSelectedStatus('');
            }}
            fontWeight={
              qbStatusFilter === option.value && selectedStatus === ''
                ? '600'
                : '400'
            }
            color={
              qbStatusFilter === option.value && selectedStatus === ''
                ? 'blue.600'
                : 'gray.700'
            }
            bg={
              qbStatusFilter === option.value && selectedStatus === ''
                ? 'blue.50'
                : 'transparent'
            }
            _hover={{ bg: 'gray.50' }}
          >
            {option.label}
          </MenuItem>
        ))}

        <MenuDivider my={1} />

        {/* Payment Status Section */}
        <MenuGroup
          title="PAYMENT STATUS"
          ml={4}
          mt={1}
          mb={0}
          fontSize="10px"
          fontWeight="600"
          color="gray.400"
          letterSpacing="wider"
          textTransform="uppercase"
        >
          {PAYMENT_STATUS_OPTIONS.map((option) => (
            <MenuItem
              key={option.value}
              py={2}
              px={4}
              onClick={() => {
                setSelectedStatus(option.value);
                setQbStatusFilter('');
              }}
              fontWeight={selectedStatus === option.value ? '600' : '400'}
              color={selectedStatus === option.value ? 'blue.600' : 'gray.700'}
              bg={selectedStatus === option.value ? 'blue.50' : 'transparent'}
              _hover={{ bg: 'gray.50' }}
            >
              {option.label}
            </MenuItem>
          ))}
        </MenuGroup>
      </MenuList>
    </Menu>
  );
}
