import { Button, VisuallyHidden } from '@chakra-ui/react';
import { OPENS_IN_A_NEW_TAB, VIEW_PUBLIC_PAGE } from './consoleCopy';

interface ViewPublicPageLinkProps {
  shareUrl: string;
}

/**
 * A real link rather than a button: the public page opens in its own tab, so whatever the fundraiser
 * was part-way through editing or sharing is still here when they come back. A page whose campaign has
 * no public address offers nothing to press rather than a link that goes nowhere.
 */
export const ViewPublicPageLink = ({ shareUrl }: ViewPublicPageLinkProps) => (
  <Button
    as="a"
    href={shareUrl || undefined}
    target="_blank"
    rel="noopener noreferrer"
    variant="outline"
    colorScheme="brand"
    isDisabled={!shareUrl}
    aria-disabled={!shareUrl}
    minH="44px"
    borderRadius="12px"
    cursor={shareUrl ? 'pointer' : 'not-allowed'}
    w={{ base: 'full', md: 'auto' }}
  >
    {VIEW_PUBLIC_PAGE}
    <VisuallyHidden>{OPENS_IN_A_NEW_TAB}</VisuallyHidden>
  </Button>
);

export default ViewPublicPageLink;
