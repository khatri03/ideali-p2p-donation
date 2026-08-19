import { Box, Flex, Icon, Text, useColorModeValue } from '@chakra-ui/react';
import { MdAutoAwesome } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

interface DonorBadgeProps {
  percentile: number;
  message?: string;
}

function DonorBadge({ percentile, message = 'Thanks for changing lives' }: DonorBadgeProps) {
  const navigate = useNavigate();
  const bg = useColorModeValue('brand.500', 'brand.400');

  return (
    <Box
      bg={bg}
      borderRadius="16px"
      p="16px"
      cursor="pointer"
      onClick={() => navigate('/member/my-donations')}
      _hover={{ opacity: 0.9 }}
      transition="opacity 0.2s"
    >
      <Flex align="center" gap="8px" mb="4px">
        <Icon as={MdAutoAwesome} color="white" w="16px" h="16px" />
        <Text color="white" fontWeight="700" fontSize="sm">
          You're a Top {percentile}% Donor!
        </Text>
      </Flex>
      <Text color="whiteAlpha.800" fontSize="xs">
        {message} →
      </Text>
    </Box>
  );
}

export default DonorBadge;
