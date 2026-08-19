import { Box, Flex, Grid, Spinner, Text, useColorModeValue } from '@chakra-ui/react';
import { OrganizerCampaign } from 'app/interface/memberInter/discoverCampaignDto';
import CampaignCard from './CampaignCard';

interface CampaignGridProps {
  campaigns: OrganizerCampaign[];
  loading: boolean;
  totalRecords: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  bannerUrls?: Record<string, string>;
}

function CampaignGrid({ campaigns, loading, totalRecords, currentPage, pageSize, onPageChange, bannerUrls = {} }: CampaignGridProps) {
  const subColor = useColorModeValue('#A3AED0', '#A3AED0');
  const totalPages = Math.ceil(totalRecords / pageSize);

  if (loading) return <Flex justify="center" py="60px"><Spinner size="xl" color="brand.500" /></Flex>;
  if (campaigns.length === 0) return <Text color={subColor} textAlign="center" py="60px" fontSize="sm">No campaigns found. Try adjusting your filters.</Text>;

  return (
    <Box>
      <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', xl: 'repeat(3, 1fr)' }} gap="20px" mb="24px">
        {campaigns.map((c) => (
          <CampaignCard
            key={c.campaignUniqueId}
            campaign={c}
            bannerUrl={c.bannerList?.[0] ? bannerUrls[c.bannerList[0]] ?? null : null}
          />
        ))}
      </Grid>
      {totalPages > 1 && (
        <Flex justify="center" gap="8px">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Box key={p} w="32px" h="32px" borderRadius="8px" display="flex" alignItems="center" justifyContent="center" cursor="pointer" bg={p === currentPage ? 'brand.500' : 'transparent'} color={p === currentPage ? 'white' : subColor} fontWeight="600" fontSize="sm" onClick={() => onPageChange(p)} _hover={{ bg: p === currentPage ? 'brand.500' : 'gray.100' }}>{p}</Box>
          ))}
        </Flex>
      )}
    </Box>
  );
}

export default CampaignGrid;
