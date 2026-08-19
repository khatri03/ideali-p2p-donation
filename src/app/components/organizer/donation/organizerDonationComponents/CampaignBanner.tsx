import React from 'react';
import { Box, Image, Skeleton, Heading, Text } from '@chakra-ui/react';

interface CampaignBannerProps {
  bannerImageUrl: string;
  isBannerLoading: boolean;
  campaignName?: string;
  themeColor: string;
}

const CampaignBanner: React.FC<CampaignBannerProps> = ({
  bannerImageUrl,
  isBannerLoading,
  campaignName,
  themeColor,
}) => {
  return (
    <Box
      position="relative"
      w="100%"
      h={{ base: '250px', md: '350px', lg: '400px' }}
      overflow="hidden"
      borderRadius="2xl"
      boxShadow="2xl"
    >
      {isBannerLoading ? (
        <Skeleton height="100%" width="100%" />
      ) : (
        <>
          <Image
            src={bannerImageUrl}
            alt={campaignName || 'Campaign Banner'}
            w="100%"
            h="100%"
            objectFit="cover"
            fallbackSrc="/donation.jpg"
          />
          {campaignName && (
            <Box
              position="absolute"
              bottom="0"
              left="0"
              right="0"
              bg={`linear-gradient(to top, ${themeColor}ee, transparent)`}
              p={{ base: 4, md: 6 }}
            >
              <Heading
                size={{ base: 'md', md: 'lg' }}
                color="white"
                textShadow="2px 2px 4px rgba(0,0,0,0.6)"
              >
                {campaignName}
              </Heading>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default CampaignBanner;
