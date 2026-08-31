import { Stack, Text } from '@chakra-ui/react';
import GoalProgressBar from '../page/GoalProgressBar';
import { MyFundraisingPage } from 'app/interface/donationInter/fundraiserConsoleDto';
import { goalPercentage } from '../page/money';
import { donorSummary, percentOfGoal } from '../page/pageCopy';

interface MyFundraisingProgressProps {
  page: MyFundraisingPage;
}

/**
 * How the page is going, said once.
 *
 * The money and the goal are not repeated here: the section header states them whether it is open or
 * shut, and a figure printed twice within one card reads as two different figures until the reader
 * checks. What is left is what the header has no room for - the bar, what it measures, and how many
 * people are behind it.
 */
export const MyFundraisingProgress = ({ page }: MyFundraisingProgressProps) => {
  const percentage = goalPercentage(page.raisedAmount, page.goal);

  return (
    <Stack gap={2}>
      {percentage !== null && (
        <GoalProgressBar percentage={percentage} label={percentOfGoal(percentage)} />
      )}

      <Stack direction="row" gap={2} flexWrap="wrap" align="center">
        {percentage !== null && (
          <>
            <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
              {percentOfGoal(percentage)}
            </Text>
            <Text fontSize="sm" color="gray.400" aria-hidden="true">
              &bull;
            </Text>
          </>
        )}
        <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
          {donorSummary(page.donorCount)}
        </Text>
      </Stack>
    </Stack>
  );
};

export default MyFundraisingProgress;
