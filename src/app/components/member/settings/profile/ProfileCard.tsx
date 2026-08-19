import {
  Avatar,
  Box,
  Flex,
  Icon,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import { MdLocationOn, MdStar } from 'react-icons/md';

interface ProfileCardProps {
  fullName: string;
  email: string;
  city?: string;
  country?: string;
  isTopDonor?: boolean;
  topDonorPercentile?: number;
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function ProfileCard({
  fullName,
  email,
  city,
  country,
  isTopDonor = false,
  topDonorPercentile = 5,
}: ProfileCardProps) {
  const cardBg = useColorModeValue('white', 'navy.800');
  const textColor = useColorModeValue('#1B2559', 'white');
  const subColor = useColorModeValue('#A3AED0', '#A3AED0');
  const location = [city, country].filter(Boolean).join(', ');

  return (
    <Box
      bg={cardBg}
      borderRadius="20px"
      p="28px"
      minW={{ base: '100%', lg: '260px' }}
      maxW={{ base: '100%', lg: '280px' }}
      h="100%"
      boxShadow="14px 17px 40px 4px rgba(112, 144, 176, 0.08)"
      border="1px solid"
      borderColor={useColorModeValue('gray.100', 'whiteAlpha.100')}
      display="flex"
      flexDirection="column"
      alignItems="center"
      textAlign="center"
    >
      <Avatar
        name={fullName}
        size="xl"
        bg="brand.500"
        color="white"
        fontWeight="700"
        fontSize="2xl"
        mb="16px"
        getInitials={getInitials}
      />

      <Text color={textColor} fontWeight="700" fontSize="lg" mb="4px">
        {fullName}
      </Text>
      <Text color={subColor} fontSize="sm" mb="10px">
        {email}
      </Text>

      {location && (
        <Flex align="center" gap="4px" mb="20px" justify="center">
          <Icon as={MdLocationOn} color={subColor} w="14px" h="14px" />
          <Text color={subColor} fontSize="sm">{location}</Text>
        </Flex>
      )}

      {/* {isTopDonor && (
        <Flex
          w="100%"
          align="center"
          justify="center"
          gap="6px"
          bg="orange.50"
          borderRadius="10px"
          py="10px"
          mt={location ? '0' : '20px'}
        >
          <Icon as={MdStar} color="orange.400" w="16px" h="16px" />
          <Text color="orange.500" fontSize="xs" fontWeight="700" textTransform="uppercase" letterSpacing="wider">
            Top {topDonorPercentile}% Donor
          </Text>
        </Flex>
      )} */}
    </Box>
  );
}

export default ProfileCard;
