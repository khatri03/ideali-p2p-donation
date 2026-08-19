import { Button, Flex, Icon, Input, InputGroup, InputLeftElement, Select, useColorModeValue } from '@chakra-ui/react';
import { MdSearch } from 'react-icons/md';
import { CampaignCategory, DiscoverFilters } from 'app/interface/memberInter/discoverCampaignDto';

const CATEGORIES: CampaignCategory[] = ['All', 'Environment', 'Animals', 'Education', 'Health', 'Community', 'Religion', 'Humanitarian'];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'mostRaised', label: 'Most Raised' },
  { value: 'endingSoon', label: 'Ending Soon' },
  { value: 'mostDonors', label: 'Most Donors' },
];

interface CampaignFiltersProps {
  filters: DiscoverFilters;
  onChange: (updated: Partial<DiscoverFilters>) => void;
}

function CampaignFilters({ filters, onChange }: CampaignFiltersProps) {
  const subColor = useColorModeValue('#A3AED0', '#A3AED0');
  const activeBg = useColorModeValue('brand.500', 'brand.400');
  const inactiveBg = useColorModeValue('white', 'navy.800');
  const inactiveColor = useColorModeValue('#1B2559', 'white');

  return (
    <Flex gap="12px" wrap="wrap" mb="20px" align="center">
      <InputGroup maxW="260px" size="sm">
        <InputLeftElement pointerEvents="none"><Icon as={MdSearch} color={subColor} /></InputLeftElement>
        <Input placeholder="Search campaigns..." borderRadius="10px" value={filters.search} onChange={(e) => onChange({ search: e.target.value })} />
      </InputGroup>
      <Flex gap="8px" wrap="wrap">
        {CATEGORIES.map((cat) => (
          <Button key={cat} size="sm" borderRadius="10px" bg={filters.category === cat ? activeBg : inactiveBg} color={filters.category === cat ? 'white' : inactiveColor} fontWeight="600" boxShadow={filters.category === cat ? 'none' : 'sm'} _hover={{ opacity: 0.85 }} onClick={() => onChange({ category: cat })}>
            {cat}
          </Button>
        ))}
      </Flex>
      <Select size="sm" maxW="160px" borderRadius="10px" value={filters.sortBy} onChange={(e) => onChange({ sortBy: e.target.value as DiscoverFilters['sortBy'] })}>
        {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </Select>
    </Flex>
  );
}

export default CampaignFilters;
