import { useParams } from 'react-router-dom';
import { Box, Text, Button } from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import CampaignRecurringDonation from './campaignRecurringDonation'

export default function CampaignRecurringDonationWrapper() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();

  // If no campaignId, show error or redirect
  if (!campaignId) {
    return (
      <Box mt={20} textAlign="center">
        <Text fontSize="lg" color="red.500" mb={4}>
          Campaign ID is required
        </Text>
        <Button onClick={() => navigate('/organizer/donation/list')}>
          Go to Donations
        </Button>
      </Box>
    );
  }

  return (
    <>
      
      <CampaignRecurringDonation campaignId={campaignId} />
    </>
  );
}