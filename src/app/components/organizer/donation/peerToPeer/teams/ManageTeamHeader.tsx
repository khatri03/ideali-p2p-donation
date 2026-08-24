import { Button, Heading, Stack, Text } from '@chakra-ui/react';
import { BACK_TO_TEAM, LEAVE_LABEL, MANAGE_HEADING, manageSubheading } from './teamCopy';

interface ManageTeamHeaderProps {
  teamName: string;
  onBack: () => void;
  onLeave: () => void;
}

/** The title of the captain screen and the two ways off it. */
export const ManageTeamHeader = ({ teamName, onBack, onLeave }: ManageTeamHeaderProps) => (
  <Stack
    direction={{ base: 'column', md: 'row' }}
    gap={4}
    justify="space-between"
    align={{ md: 'flex-start' }}
  >
    <Stack gap={1} minW={0}>
      <Heading
        as="h1"
        fontSize={{ base: 'xl', md: '2xl', lg: '3xl' }}
        color="navy.700"
        _dark={{ color: 'white' }}
      >
        {MANAGE_HEADING}
      </Heading>
      <Text fontSize={{ base: 'sm', md: 'md' }} color="gray.600" _dark={{ color: 'gray.300' }}>
        {manageSubheading(teamName)}
      </Text>
    </Stack>

    <Stack direction={{ base: 'column', '2sm': 'row' }} gap={3} w={{ base: 'full', md: 'auto' }}>
      <Button
        onClick={onBack}
        variant="outline"
        minH="44px"
        borderRadius="12px"
        cursor="pointer"
        w={{ base: 'full', '2sm': 'auto' }}
      >
        {BACK_TO_TEAM}
      </Button>

      <Button
        onClick={onLeave}
        colorScheme="red"
        variant="outline"
        minH="44px"
        borderRadius="12px"
        cursor="pointer"
        w={{ base: 'full', '2sm': 'auto' }}
      >
        {LEAVE_LABEL}
      </Button>
    </Stack>
  </Stack>
);

export default ManageTeamHeader;
