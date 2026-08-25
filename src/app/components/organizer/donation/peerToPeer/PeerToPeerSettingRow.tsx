import { ReactNode } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';

interface PeerToPeerSettingRowProps {
  label: string;
  description: string;
  control: ReactNode;
  htmlFor?: string;
  isDisabled?: boolean;
}

/**
 * One labelled setting: explanation on the left, control on the right, stacking on small screens so
 * the control never gets squeezed.
 */
export const PeerToPeerSettingRow = ({
  label,
  description,
  control,
  htmlFor,
  isDisabled = false,
}: PeerToPeerSettingRowProps) => (
  <Flex
    direction={{ base: 'column', md: 'row' }}
    align={{ base: 'stretch', md: 'center' }}
    justify="space-between"
    gap={{ base: 2, md: 6 }}
    py={4}
    opacity={isDisabled ? 0.6 : 1}
  >
    <Box maxW={{ base: 'full', md: '60ch' }}>
      <Text
        as="label"
        htmlFor={htmlFor}
        display="block"
        fontSize={{ base: 'sm', md: 'md' }}
        fontWeight="600"
        color="secondaryGray.900"
        _dark={{ color: 'white' }}
        cursor={isDisabled ? 'not-allowed' : 'pointer'}
      >
        {label}
      </Text>
      <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.300' }} mt={1}>
        {description}
      </Text>
    </Box>
    <Box minW={{ md: '200px' }} display="flex" justifyContent={{ base: 'flex-start', md: 'flex-end' }}>
      {control}
    </Box>
  </Flex>
);

export default PeerToPeerSettingRow;
