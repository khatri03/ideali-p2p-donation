import { Heading, SimpleGrid, Stack, Text } from '@chakra-ui/react';
import Card from 'themeComponents/card/Card';
import { MyFundraisingPage } from 'app/interface/donationInter/fundraiserConsoleDto';
import { formatMoney } from '../page/money';
import { totalsFor } from './consoleTotals';
import {
  SUMMARY_DONORS,
  SUMMARY_HEADING,
  SUMMARY_MIXED_CURRENCY,
  SUMMARY_PAGES,
  SUMMARY_RAISED,
} from './consoleCopy';

interface MyFundraisingSummaryProps {
  pages: MyFundraisingPage[];
}

interface SummaryFigureProps {
  label: string;
  value: string;
}

const SummaryFigure = ({ label, value }: SummaryFigureProps) => (
  <Stack gap={0}>
    <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.300' }}>
      {label}
    </Text>
    <Text
      fontSize={{ base: 'xl', md: '2xl' }}
      fontWeight="bold"
      color="navy.700"
      _dark={{ color: 'white' }}
    >
      {value}
    </Text>
  </Stack>
);

/**
 * The answer to the first question a supporter with several pages has: how much have I raised in all.
 * A supporter with one page is not shown it, because their single card already says exactly that and a
 * headline repeating it is noise.
 */
export const MyFundraisingSummary = ({ pages }: MyFundraisingSummaryProps) => {
  if (pages.length < 2) {
    return null;
  }

  const totals = totalsFor(pages);

  return (
    <Card as="section" aria-label={SUMMARY_HEADING} p={{ base: 4, md: 6 }}>
      <Heading as="h2" fontSize={{ base: 'md', md: 'lg' }} mb={4} color="navy.700" _dark={{ color: 'white' }}>
        {SUMMARY_HEADING}
      </Heading>

      <SimpleGrid columns={{ base: 1, '2sm': totals.raised ? 3 : 2 }} gap={{ base: 3, md: 6 }}>
        {totals.raised && (
          <SummaryFigure
            label={SUMMARY_RAISED}
            value={formatMoney(totals.raised.amount, totals.raised.currencySymbol)}
          />
        )}
        <SummaryFigure label={SUMMARY_PAGES} value={String(totals.pageCount)} />
        <SummaryFigure label={SUMMARY_DONORS} value={String(totals.donorCount)} />
      </SimpleGrid>

      {!totals.raised && (
        <Text mt={4} fontSize="sm" color="gray.600" _dark={{ color: 'gray.300' }}>
          {SUMMARY_MIXED_CURRENCY}
        </Text>
      )}
    </Card>
  );
};

export default MyFundraisingSummary;
