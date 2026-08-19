import { Box, Center, VStack, Text, Image } from '@chakra-ui/react';
import { LoaderProps } from 'app/interface/donationInter/DonationComponentInterface/donationListComponentsDto';

export default function Loader({
  message = 'Loading...',
  subtitle,
  fullPage = false,
}: LoaderProps) {
  const content = (
    <VStack spacing={2}>
      <Box
        position="relative"
        w="80px"
        h="80px"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        {/* Centered favicon with smooth rotation */}
        <Image
          src="/favicon.svg"
          alt="Loading"
          w="60px"
          h="60px"
          animation="smoothRotate 1.5s linear infinite"
          sx={{
            transformOrigin: 'center',
            '@keyframes smoothRotate': {
              '0%': { transform: 'rotate(0deg)' },
              '100%': { transform: 'rotate(360deg)' },
            },
          }}
        />
      </Box>

      <VStack spacing={2}>
        <Text
          color="#044bd9"
          fontSize="lg"
          fontWeight="bold"
          animation="fadeInOut 2s ease-in-out infinite"
          sx={{
            '@keyframes fadeInOut': {
              '0%, 100%': { opacity: 0.5 },
              '50%': { opacity: 1 },
            },
          }}
        >
          {message}
        </Text>
        {subtitle && (
          <Text color="gray.500" fontSize="sm">
            {subtitle}
          </Text>
        )}
      </VStack>
    </VStack>
  );

  if (fullPage) {
    return (
      <Center minH="100vh" w="100%">
        {content}
      </Center>
    );
  }

  return (
    <Box textAlign="center" py={20}>
      {content}
    </Box>
  );
}
