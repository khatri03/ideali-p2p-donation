import { useNavigate } from 'react-router-dom';
import { Heading, Stack, Text } from '@chakra-ui/react';
import FundraiserPageNotice from '../page/FundraiserPageNotice';
import ConsoleShell from './ConsoleShell';
import MyFundraisingList from './MyFundraisingList';
import MyFundraisingEmptyState from './MyFundraisingEmptyState';
import MyFundraisingSkeleton from './MyFundraisingSkeleton';
import MyFundraisingSummary from './MyFundraisingSummary';
import {
  ALL_FINISHED_GUIDANCE,
  ALL_FINISHED_HEADING,
  CONSOLE_HEADING,
  CONSOLE_SUBHEADING,
  LOAD_FAILED_MESSAGE,
  RETRY_LABEL,
} from './consoleCopy';
import { editMyFundraisingPath } from './consolePaths';
import { fundraiserShareUrl } from './shareUrl';
import { useMyFundraising } from './useMyFundraising';

/**
 * Screen 08. Composition only: the fetch lives in a hook, every panel below is presentational, and
 * each state a supporter can arrive in - loading, failed, nothing to show, one page, several - is a
 * designed surface rather than a blank area.
 */
export const MyFundraisingScreen = () => {
  const navigate = useNavigate();
  const { pages, isLoading, loadError, reload } = useMyFundraising();

  /**
   * A supporter's rows outlive the campaigns behind them, so somebody whose last campaign ended still
   * arrives here with pages to read. That is a designed panel of its own rather than a console that
   * silently offers nothing to do, and it is stated before the pages rather than after them: a reader
   * who scrolls to the end of a long list to be told why it is closed has already wondered.
   */
  const hasFinishedEverything = pages.length > 0 && pages.every((page) => !page.isCampaignOpen);

  return (
    <ConsoleShell>
      <Stack gap={1}>
        <Heading
          as="h1"
          fontSize={{ base: 'xl', md: '2xl', lg: '3xl' }}
          color="navy.700"
          _dark={{ color: 'white' }}
        >
          {CONSOLE_HEADING}
        </Heading>
        <Text fontSize={{ base: 'sm', md: 'md' }} color="gray.600" _dark={{ color: 'gray.300' }}>
          {CONSOLE_SUBHEADING}
        </Text>
      </Stack>

      {isLoading && <MyFundraisingSkeleton />}

      {!isLoading && loadError && (
        <FundraiserPageNotice
          heading={LOAD_FAILED_MESSAGE}
          message={loadError}
          headingLevel="h2"
          onRetry={reload}
          retryLabel={RETRY_LABEL}
        />
      )}

      {!isLoading && !loadError && pages.length === 0 && (
        <MyFundraisingEmptyState onFindCampaign={() => navigate('/member/discover')} />
      )}

      {!isLoading && !loadError && hasFinishedEverything && (
        <MyFundraisingEmptyState
          heading={ALL_FINISHED_HEADING}
          guidance={ALL_FINISHED_GUIDANCE}
          onFindCampaign={() => navigate('/member/discover')}
        />
      )}

      {!isLoading && !loadError && <MyFundraisingSummary pages={pages} />}

      {!isLoading && !loadError && pages.length > 0 && (
        <MyFundraisingList
          pages={pages}
          shareUrlFor={fundraiserShareUrl}
          onEdit={(page) => navigate(editMyFundraisingPath(page.uniqueId))}
          onOpenTeams={navigate}
        />
      )}
    </ConsoleShell>
  );
};

export default MyFundraisingScreen;
