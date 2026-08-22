import { useEffect, useState } from 'react';
import { Alert, AlertIcon, Skeleton, Text } from '@chakra-ui/react';
import donationService from 'app/service/organizer/donation/donationService';

interface CampaignContextBannerProps {
  /** Null when this screen was not reached from a campaign, in which case nothing is rendered. */
  campaignUniqueId: string | null;
  /** What the person is about to do, in their own words. The campaign name follows it. */
  action?: string;
  /** What happens once they have done it. */
  afterwardsNote?: string;
}

/**
 * Tells someone signing in or signing up which campaign they were about to fundraise for.
 *
 * The name is fetched by identifier rather than read from the address bar. A name carried in a query
 * string is attacker-controlled text, and rendering it here would let a crafted link put arbitrary
 * wording next to a password field.
 */
export const CampaignContextBanner = ({
  campaignUniqueId,
  action = 'Sign in',
  afterwardsNote = 'You will come straight back here afterwards.',
}: CampaignContextBannerProps) => {
  const [campaignName, setCampaignName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(campaignUniqueId));

  useEffect(() => {
    if (!campaignUniqueId) {
      setIsLoading(false);
      return undefined;
    }

    let isActive = true;
    setIsLoading(true);

    donationService
      .getCampaignDonateDetails(campaignUniqueId)
      .then((campaign) => {
        if (isActive) {
          setCampaignName(campaign?.name ?? null);
        }
      })
      .catch(() => {
        // A campaign that cannot be read is simply not named. The sign-in form itself still works,
        // and an error banner here would be about something the person did not ask for.
        if (isActive) {
          setCampaignName(null);
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [campaignUniqueId]);

  if (!campaignUniqueId) {
    return null;
  }

  if (isLoading) {
    return <Skeleton height="44px" borderRadius="12px" mb={4} />;
  }

  if (!campaignName) {
    return null;
  }

  return (
    <Alert status="info" borderRadius="12px" mb={4}>
      <AlertIcon />
      <Text fontSize="sm">
        {action} to fundraise for <strong>{campaignName}</strong>. {afterwardsNote}
      </Text>
    </Alert>
  );
};

export default CampaignContextBanner;
