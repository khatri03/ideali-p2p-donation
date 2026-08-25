import { ChangeEvent } from 'react';
import {
  Button,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Select,
  Stack,
} from '@chakra-ui/react';
import { FundraiserStatus } from 'app/interface/donationInter/fundraiserConsoleDto';
import { ModerationSort } from 'app/interface/donationInter/peerToPeerModerationDto';
import {
  ALL_STATUSES_OPTION,
  ALL_VISIBILITY_OPTION,
  CLEAR_FILTERS_LABEL,
  EXPORT_LABEL,
  HIDDEN_ONLY_OPTION,
  SEARCH_PLACEHOLDER,
  SORT_LABEL,
  SORT_LABELS,
  STATUS_FILTER_LABEL,
  STATUS_LABELS,
  VISIBILITY_FILTER_LABEL,
  VISIBLE_ONLY_OPTION,
} from './moderationCopy';
import { ModerationFilters as Filters } from './useModerationList';

interface ModerationFiltersProps {
  searchLabel: string;
  filters: Filters;
  isFiltered: boolean;
  /** Fundraiser lists filter by status; team lists filter by whether the charity hid them. */
  variant: 'fundraisers' | 'teams';
  isExportDisabled: boolean;
  onChange: (filters: Filters) => void;
  onClear: () => void;
  onExport: () => void;
}

const STATUS_OPTIONS: FundraiserStatus[] = ['PendingApproval', 'Active', 'Paused', 'Rejected'];

const SORT_OPTIONS: ModerationSort[] = [
  'Newest',
  'Oldest',
  'NameAscending',
  'RaisedDescending',
  'RaisedAscending',
];

export const ModerationFilters = ({
  searchLabel,
  filters,
  isFiltered,
  variant,
  isExportDisabled,
  onChange,
  onClear,
  onExport,
}: ModerationFiltersProps) => {
  const handleSearch = (event: ChangeEvent<HTMLInputElement>) =>
    onChange({ ...filters, search: event.target.value });

  const handleStatus = (event: ChangeEvent<HTMLSelectElement>) =>
    onChange({
      ...filters,
      status: event.target.value ? (event.target.value as FundraiserStatus) : undefined,
    });

  const handleVisibility = (event: ChangeEvent<HTMLSelectElement>) =>
    onChange({
      ...filters,
      isHidden: event.target.value === '' ? undefined : event.target.value === 'hidden',
    });

  const handleSort = (event: ChangeEvent<HTMLSelectElement>) =>
    onChange({ ...filters, sortBy: event.target.value as ModerationSort });

  const visibilityValue = filters.isHidden === undefined ? '' : filters.isHidden ? 'hidden' : 'live';

  return (
    <Stack
      direction={{ base: 'column', lg: 'row' }}
      gap={{ base: 3, md: 4 }}
      align={{ base: 'stretch', lg: 'flex-end' }}
    >
      <FormControl flex="1" minW={0}>
        <FormLabel fontSize="sm" mb={1}>
          {searchLabel}
        </FormLabel>
        <Input
          value={filters.search}
          onChange={handleSearch}
          placeholder={SEARCH_PLACEHOLDER}
          minH="44px"
          borderRadius="12px"
        />
      </FormControl>

      {variant === 'fundraisers' ? (
        <FormControl w={{ base: '100%', lg: '220px' }}>
          <FormLabel fontSize="sm" mb={1}>
            {STATUS_FILTER_LABEL}
          </FormLabel>
          <Select
            value={filters.status ?? ''}
            onChange={handleStatus}
            minH="44px"
            borderRadius="12px"
            sx={{ cursor: 'pointer' }}
          >
            <option value="">{ALL_STATUSES_OPTION}</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </Select>
        </FormControl>
      ) : (
        <FormControl w={{ base: '100%', lg: '220px' }}>
          <FormLabel fontSize="sm" mb={1}>
            {VISIBILITY_FILTER_LABEL}
          </FormLabel>
          <Select
            value={visibilityValue}
            onChange={handleVisibility}
            minH="44px"
            borderRadius="12px"
            sx={{ cursor: 'pointer' }}
          >
            <option value="">{ALL_VISIBILITY_OPTION}</option>
            <option value="live">{VISIBLE_ONLY_OPTION}</option>
            <option value="hidden">{HIDDEN_ONLY_OPTION}</option>
          </Select>
        </FormControl>
      )}

      <FormControl w={{ base: '100%', lg: '220px' }}>
        <FormLabel fontSize="sm" mb={1}>
          {SORT_LABEL}
        </FormLabel>
        <Select
          value={filters.sortBy}
          onChange={handleSort}
          minH="44px"
          borderRadius="12px"
          sx={{ cursor: 'pointer' }}
        >
          {SORT_OPTIONS.map((sort) => (
            <option key={sort} value={sort}>
              {SORT_LABELS[sort]}
            </option>
          ))}
        </Select>
      </FormControl>

      <Flex gap={2} wrap="wrap">
        <Button
          variant="outline"
          size="sm"
          minH="44px"
          isDisabled={!isFiltered}
          onClick={onClear}
          sx={{ cursor: isFiltered ? 'pointer' : 'not-allowed' }}
        >
          {CLEAR_FILTERS_LABEL}
        </Button>
        <Button
          variant="outline"
          size="sm"
          minH="44px"
          isDisabled={isExportDisabled}
          onClick={onExport}
          sx={{ cursor: isExportDisabled ? 'not-allowed' : 'pointer' }}
        >
          {EXPORT_LABEL}
        </Button>
      </Flex>
    </Stack>
  );
};

export default ModerationFilters;
