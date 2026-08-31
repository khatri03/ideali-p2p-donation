import { Progress } from '@chakra-ui/react';

interface GoalProgressBarProps {
  /** How far along the goal is, already clamped by the caller. */
  percentage: number;
  label: string;
  colorScheme?: string;
}

/**
 * How far a page or a team has got towards its goal.
 *
 * Width and height are stated here rather than left to the theme: the project's Progress base style
 * fixes the track at forty by twenty pixels, which draws every bar as a stub the width of a switch
 * instead of a bar spanning its panel. Correcting that base style would move every progress bar in the
 * product, so peer-to-peer states its own size in one place and the rest of the product is untouched.
 */
export const GoalProgressBar = ({ percentage, label, colorScheme = 'brand' }: GoalProgressBarProps) => (
  <Progress
    value={percentage}
    aria-label={label}
    colorScheme={colorScheme}
    w="100%"
    h="10px"
    borderRadius="full"
    bg="secondaryGray.300"
    _dark={{ bg: 'whiteAlpha.200' }}
  />
);

export default GoalProgressBar;
