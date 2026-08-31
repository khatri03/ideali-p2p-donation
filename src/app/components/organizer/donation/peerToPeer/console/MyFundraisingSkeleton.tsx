import { Skeleton, Stack } from '@chakra-ui/react';
import Card from 'themeComponents/card/Card';

/**
 * Mirrors a shut section rather than an open one, because that is what the list settles into: a row
 * carrying the campaign, the page beneath it, the money and the state. Drawing an expanded card here
 * would make the screen collapse under the reader the moment the data arrived.
 */
export const MyFundraisingSkeleton = () => (
  <Stack gap={{ base: 4, md: 6 }}>
    {[0, 1, 2].map((section) => (
      <Card key={section} p={{ base: 4, md: 6 }}>
        <Stack direction={{ base: 'column', md: 'row' }} gap={4} align={{ md: 'center' }}>
          <Stack flex="1" gap={2} minW={0}>
            <Skeleton height="20px" width="55%" />
            <Skeleton height="14px" width="40%" />
          </Stack>
          <Stack direction="row" gap={3} align="center">
            <Skeleton height="18px" width="96px" />
            <Skeleton height="24px" width="72px" borderRadius="full" />
          </Stack>
        </Stack>
      </Card>
    ))}
  </Stack>
);

export default MyFundraisingSkeleton;
