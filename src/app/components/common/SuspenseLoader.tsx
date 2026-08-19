import { Box, Center } from '@chakra-ui/react';
import { keyframes } from '@emotion/react';

const pulse = keyframes`
  0%, 100% {
    opacity: 0.4;
    transform: scale(0.95);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
`;

const slideUp = keyframes`
  0% {
    transform: translateY(100%);
    opacity: 0;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
`;

export default function SuspenseLoader() {
  return (
    <Center minH="200px">
      <Box
        display="flex"
        gap="8px"
        alignItems="center"
      >
        {[0, 1, 2].map((i) => (
          <Box
            key={i}
            width="12px"
            height="12px"
            borderRadius="full"
            bg="blue.500"
            animation={`${pulse} 1.4s ease-in-out ${i * 0.2}s infinite`}
          />
        ))}
      </Box>
    </Center>
  );
}
