import { ChakraProvider } from '@chakra-ui/react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import CampaignDetails from './CampaignDetails';

const LONG_STORY = '<p>Why this campaign matters.</p>'.repeat(40);

const renderDetails = (callToAction?: React.ReactNode) =>
  render(
    <ChakraProvider>
      <CampaignDetails
        fundRaisingGoal={{ amount: 5000, visibleToDonor: true, stepNo: 1 }}
        description={LONG_STORY}
        callToAction={callToAction}
        themeColor="#0f7b4a"
        cardBg="white"
        cardBorder="gray.200"
        textColor="gray.800"
        subTextColor="gray.600"
      />
    </ChakraProvider>,
  );

const isBefore = (first: Element, second: Element) =>
  Boolean(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING);

describe('CampaignDetails', () => {
  /**
   * A campaign story has no length limit, so anything placed after it is only ever reached by a reader
   * who got to the end. Whatever the campaign is also offering has to be readable before the story
   * starts, while the goal above it still gives the reader the context to judge the offer.
   */
  it('Details_CallToActionGiven_PutsItAfterTheGoalAndBeforeTheStory', () => {
    renderDetails(<p>Fundraise for this campaign</p>);

    const goal = screen.getByText('Fundraising Goal');
    const callToAction = screen.getByText('Fundraise for this campaign');
    const story = screen.getByText('About this campaign');

    expect(isBefore(goal, callToAction)).toBe(true);
    expect(isBefore(callToAction, story)).toBe(true);
  });

  /**
   * A campaign with nothing extra to offer must render exactly as it did before the slot existed: no
   * gap, no empty panel where the offer would have been.
   */
  it('Details_NoCallToAction_RendersTheGoalAndStoryUnchanged', () => {
    renderDetails();

    expect(screen.getByText('Fundraising Goal')).toBeInTheDocument();
    expect(screen.getByText('About this campaign')).toBeInTheDocument();
  });

  /**
   * A charity that chose to keep its target private must not have it revealed by the panel above the
   * story, and the story itself still has to be reachable.
   */
  it('Details_GoalHiddenFromDonors_ShowsNeitherTheAmountNorAnEmptyGoalCard', () => {
    render(
      <ChakraProvider>
        <CampaignDetails
          fundRaisingGoal={{ amount: 5000, visibleToDonor: false, stepNo: 1 }}
          description="<p>Why this campaign matters.</p>"
          themeColor="#0f7b4a"
          cardBg="white"
          cardBorder="gray.200"
          textColor="gray.800"
          subTextColor="gray.600"
        />
      </ChakraProvider>,
    );

    expect(screen.queryByText('Fundraising Goal')).not.toBeInTheDocument();
    expect(screen.queryByText('$5,000')).not.toBeInTheDocument();
    expect(screen.getByText('About this campaign')).toBeInTheDocument();
  });
});
