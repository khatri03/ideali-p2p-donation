import { useState } from 'react';
import { Accordion, Button, Stack, usePrefersReducedMotion } from '@chakra-ui/react';
import { MyFundraisingPage } from 'app/interface/donationInter/fundraiserConsoleDto';
import MyFundraisingCard from './MyFundraisingCard';
import { COLLAPSE_ALL, EXPAND_ALL } from './consoleCopy';

interface MyFundraisingListProps {
  pages: MyFundraisingPage[];
  shareUrlFor: (page: MyFundraisingPage) => string;
  onEdit: (page: MyFundraisingPage) => void;
  onOpenTeams: (path: string) => void;
}

/**
 * A supporter fundraising for one campaign has nothing to scan and nothing to collapse, so their
 * section is already open and no controls appear: an accordion of one is a click charged for nothing.
 */
const defaultOpenSections = (pageCount: number) => (pageCount === 1 ? [0] : []);

/**
 * The campaigns a supporter is fundraising for, each one a section they can open.
 *
 * Which sections are open is held here rather than left to the accordion, because the two controls
 * above the list have to be able to set every section at once, and a list that reopens itself the
 * moment its data refreshes would undo whatever the reader had just done.
 *
 * A reader who has asked their system for less motion gets the section opening outright instead of
 * sliding, which is also what makes the panel's contents readable the instant it opens.
 */
export const MyFundraisingList = ({
  pages,
  shareUrlFor,
  onEdit,
  onOpenTeams,
}: MyFundraisingListProps) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [chosenSections, setChosenSections] = useState<number[] | null>(null);
  const openSections = chosenSections ?? defaultOpenSections(pages.length);
  const hasSeveralPages = pages.length > 1;
  const isEveryOneOpen = openSections.length === pages.length;

  return (
    <Stack gap={{ base: 3, md: 4 }}>
      {hasSeveralPages && (
        <Stack direction="row" gap={2} justify="flex-end" flexWrap="wrap">
          <Button
            onClick={() => setChosenSections(pages.map((page, index) => index))}
            variant="ghost"
            colorScheme="brand"
            size="sm"
            minH="44px"
            px={4}
            borderRadius="12px"
            isDisabled={isEveryOneOpen}
            cursor={isEveryOneOpen ? 'not-allowed' : 'pointer'}
          >
            {EXPAND_ALL}
          </Button>

          <Button
            onClick={() => setChosenSections([])}
            variant="ghost"
            colorScheme="brand"
            size="sm"
            minH="44px"
            px={4}
            borderRadius="12px"
            isDisabled={openSections.length === 0}
            cursor={openSections.length === 0 ? 'not-allowed' : 'pointer'}
          >
            {COLLAPSE_ALL}
          </Button>
        </Stack>
      )}

      <Accordion
        allowMultiple
        reduceMotion={prefersReducedMotion}
        index={openSections}
        onChange={(next) => setChosenSections(Array.isArray(next) ? next : [next])}
      >
        <Stack gap={{ base: 3, md: 4 }}>
          {pages.map((page) => (
            <MyFundraisingCard
              key={page.uniqueId}
              page={page}
              shareUrl={shareUrlFor(page)}
              onEdit={() => onEdit(page)}
              onOpenTeams={onOpenTeams}
            />
          ))}
        </Stack>
      </Accordion>
    </Stack>
  );
};

export default MyFundraisingList;
