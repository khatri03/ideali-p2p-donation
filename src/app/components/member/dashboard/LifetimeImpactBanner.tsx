import { Box, Button, Flex, Image, Text } from '@chakra-ui/react';
import fundraisingIcon from 'assets/img/dashboards/fundraising.svg';
import { useNavigate } from 'react-router-dom';

interface LifetimeImpactBannerProps {
  donorName: string;
  totalDonated: number;
  campaignsCount: number;
  organizersCount: number;
}

function LifetimeImpactBanner({
  totalDonated,
  campaignsCount,
  organizersCount,
}: LifetimeImpactBannerProps) {
  const navigate = useNavigate();
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(totalDonated);

  return (
    <Box
      bgGradient="linear(135deg, #4318FF 0%, #7551FF 40%, #9f7aea 70%, #e879f9 100%)"
      borderRadius="20px"
      p={{ base: '28px 24px', md: '36px 40px' }}
      position="relative"
      overflow="hidden"
      mb="24px"
      minH="180px"
      zIndex={0}
    >
      {/* large blurred circle — left decoration */}
      <Box
        position="absolute"
        left="-60px"
        top="-60px"
        w="220px"
        h="220px"
        borderRadius="full"
        bg="whiteAlpha.50"
        pointerEvents="none"
      />

      {/* icon circle — right side */}
      <Flex
        position="absolute"
        right={{ base: '20px', md: '40px' }}
        top="50%"
        transform="translateY(-50%)"
        w={{ base: '100px', md: '140px' }}
        h={{ base: '100px', md: '140px' }}
        //borderRadius="full"
        bg="whiteAlpha.150"
        align="center"
        justify="center"
      // boxShadow="inset 0 0 0 1px rgba(255,255,255,0.15)"
      >
        <Image
          src={fundraisingIcon}
          w={{ base: '100px', md: '140px' }}
          h={{ base: '100px', md: '140px' }}
          opacity={0.85}
        />
      </Flex>

      {/* content */}
      <Box position="relative" zIndex={1} maxW={{ base: '75%', md: '65%' }}>
        <Text
          color="whiteAlpha.700"
          fontSize="xs"
          fontWeight="700"
          textTransform="uppercase"
          letterSpacing="0.12em"
          mb="10px"
        >
          Your Lifetime Impact
        </Text>

        <Text
          color="white"
          fontSize={{ base: '4xl', md: '54px' }}
          fontWeight="800"
          lineHeight="1"
          mb="10px"
        >
          {formatted}
        </Text>

        <Text color="whiteAlpha.800" fontSize="sm" mb="24px" fontWeight="400">
          donated across{' '}
          <Text as="span" fontWeight="700" color="white">
            {campaignsCount}
          </Text>{' '}
          campaigns ·{' '}
          <Text as="span" fontWeight="700" color="white">
            {organizersCount}
          </Text>{' '}
          organizers
        </Text>

        <Button
          bg="white"
          color="brand.500"
          fontWeight="700"
          fontSize="sm"
          borderRadius="12px"
          px="24px"
          h="42px"
          _hover={{ bg: 'whiteAlpha.900', transform: 'translateY(-1px)' }}
          transition="all 0.2s"
          onClick={() => navigate('/member/discover')}
        >
          Discover Campaigns
        </Button>
      </Box>
    </Box>
  );
}

export default LifetimeImpactBanner;
