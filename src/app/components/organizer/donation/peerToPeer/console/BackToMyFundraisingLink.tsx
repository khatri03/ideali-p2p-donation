import { Link as RouterLink } from 'react-router-dom';
import { Button } from '@chakra-ui/react';
import { MdArrowBack } from 'react-icons/md';
import { BACK_TO_CONSOLE } from './consoleCopy';
import { myFundraisingPath } from './consolePaths';

/**
 * The way back to the console from the public screens the console sends a fundraiser out to.
 *
 * A real link rather than a button so it can be opened in a new tab or middle-clicked like any other
 * navigation, and rendered only for somebody who holds a page on the campaign: every one of these
 * screens is also a public address, and a reader with no console would be offered a route to a screen
 * that has nothing on it for them.
 */
export const BackToMyFundraisingLink = () => (
  <Button
    as={RouterLink}
    to={myFundraisingPath}
    variant="ghost"
    colorScheme="brand"
    size="sm"
    leftIcon={<MdArrowBack />}
    minH="44px"
    borderRadius="12px"
    cursor="pointer"
    alignSelf="flex-start"
  >
    {BACK_TO_CONSOLE}
  </Button>
);

export default BackToMyFundraisingLink;
