import React, { useEffect, useState } from 'react';
import {
  Box,
  Flex,
  Text,
  Icon,
  HStack,
  Progress,
  Collapse,
  IconButton,
} from '@chakra-ui/react';
import { useColorModeValue } from '@chakra-ui/react';
import { MdExpandMore, MdExpandLess } from 'react-icons/md';
import { MdRocketLaunch } from 'react-icons/md';
import { Link } from 'react-router-dom';

// ─── Inline SVG icons ─────────────────────────────────────────────────────────

const TickSVG: React.FC = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g clipPath="url(#clip0_tick)">
      <path
        d="M13.2749 7.27494C13.4116 7.13349 13.4872 6.94404 13.4854 6.74739C13.4837 6.55074 13.4049 6.36263 13.2658 6.22358C13.1267 6.08452 12.9386 6.00564 12.742 6.00393C12.5453 6.00223 12.3559 6.07782 12.2144 6.21444L8.23944 10.1894L5.76444 7.71444C5.62299 7.57782 5.43354 7.50223 5.23689 7.50393C5.04024 7.50564 4.85213 7.58452 4.71308 7.72358C4.57402 7.86263 4.49515 8.05074 4.49344 8.24739C4.49173 8.44404 4.56732 8.63349 4.70394 8.77494L7.70394 11.7749C7.84459 11.9155 8.03532 11.9945 8.23419 11.9945C8.43307 11.9945 8.6238 11.9155 8.76444 11.7749L13.2644 7.27494H13.2749Z"
        fill="white"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M18 9C18 13.965 13.965 18 9 18C4.035 18 0 13.965 0 9C0 4.035 4.035 0 9 0C13.965 0 18 4.035 18 9ZM16.5 9C16.5 13.14 13.14 16.5 9 16.5C4.86 16.5 1.5 13.14 1.5 9C1.5 4.86 4.86 1.5 9 1.5C13.14 1.5 16.5 4.86 16.5 9Z"
        fill="white"
      />
    </g>
    <defs>
      <clipPath id="clip0_tick">
        <rect width="18" height="18" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

const MegaphoneSVG: React.FC<{ stroke: string }> = ({ stroke }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M2.25 8.25L15.75 4.5V13.5L2.25 10.5V8.25Z"
      stroke={stroke}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8.70001 12.6004C8.62122 12.886 8.48694 13.1533 8.30484 13.3871C8.12274 13.6208 7.89639 13.8164 7.6387 13.9626C7.38102 14.1089 7.09706 14.2029 6.80302 14.2394C6.50898 14.2759 6.21064 14.2542 5.92501 14.1754C5.63938 14.0966 5.37208 13.9623 5.13835 13.7802C4.90462 13.5981 4.70904 13.3718 4.56279 13.1141C4.41654 12.8564 4.32247 12.5724 4.28596 12.2784C4.24945 11.9844 4.27122 11.686 4.35001 11.4004"
      stroke={stroke}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const EyeSVG: React.FC<{ stroke: string }> = ({ stroke }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M1.54651 9.26054C1.48401 9.09215 1.48401 8.90692 1.54651 8.73854C2.15529 7.26243 3.18865 6.00032 4.51559 5.11221C5.84253 4.22411 7.4033 3.75 9.00001 3.75C10.5967 3.75 12.1575 4.22411 13.4844 5.11221C14.8114 6.00032 15.8447 7.26243 16.4535 8.73854C16.516 8.90692 16.516 9.09215 16.4535 9.26054C15.8447 10.7366 14.8114 11.9988 13.4844 12.8869C12.1575 13.775 10.5967 14.2491 9.00001 14.2491C7.4033 14.2491 5.84253 13.775 4.51559 12.8869C3.18865 11.9988 2.15529 10.7366 1.54651 9.26054Z"
      stroke={stroke}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9 11.25C10.2426 11.25 11.25 10.2426 11.25 9C11.25 7.75736 10.2426 6.75 9 6.75C7.75736 6.75 6.75 7.75736 6.75 9C6.75 10.2426 7.75736 11.25 9 11.25Z"
      stroke={stroke}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const DollarSVG: React.FC<{ stroke: string }> = ({ stroke }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M9 3V15M11.5 4.5H7.25C6.65326 4.5 6.08097 4.73705 5.65901 5.15901C5.23705 5.58097 5 6.15326 5 6.75C5 7.34674 5.23705 7.91903 5.65901 8.34099C6.08097 8.76295 6.65326 9 7.25 9H10.75C11.3467 9 11.919 9.23705 12.341 9.65901C12.7629 10.081 13 10.6533 13 11.25C13 11.8467 12.7629 12.419 12.341 12.841C11.919 13.2629 11.3467 13.5 10.75 13.5H5"
      stroke={stroke}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// ─── Types ────────────────────────────────────────────────────────────────────

interface GettingStartedStep {
  stepNumber: number;
  title: string;
  description: string;
  SvgIcon: React.FC<{ stroke: string }>;
  link: string;
  linkLabel?: string;
}

interface StepCardProps {
  step: GettingStartedStep;
  isCompleted: boolean;
  isActive: boolean;
  showRightDivider: boolean;
}

// ─── Step definitions ─────────────────────────────────────────────────────────

const STEPS: GettingStartedStep[] = [
  {
    stepNumber: 1,
    title: 'Add Payment Account',
    description: 'Connect your bank or payment processor.',
    SvgIcon: MegaphoneSVG,
    link: '/organizer/setting/payment-account',
    linkLabel: 'Start now',
  },
  {
    stepNumber: 2,
    title: 'Create a Campaign',
    description: 'Set up your campaign with goals & media.',
    SvgIcon: MegaphoneSVG,
    link: '/organizer/donation/manage-donation-module',
    linkLabel: 'Start now',
  },
  {
    stepNumber: 3,
    title: 'Publish Campaign',
    description: 'Publish your Donation Campaign ',
    SvgIcon: EyeSVG,
    link: '/organizer/donation/manage-donation-module',
    linkLabel: 'Review now',
  },
];

// ─── StepCard (reusable) ──────────────────────────────────────────────────────

const StepCard: React.FC<StepCardProps> = ({
  step,
  isCompleted,
  isActive,
  showRightDivider,
}) => {
  const textColor = useColorModeValue('#1B2559', '#FFFFFF');
  const dividerColor = useColorModeValue('gray.200', 'gray.600');
  const separatorColor = useColorModeValue('gray.200', 'gray.600');

  const iconBg = isCompleted ? '#20C55D' : isActive ? '#044bd9' : '#e2e8f0';
  const iconStroke = isCompleted || isActive ? 'white' : '#9CA3AF';
  const titleColor = isCompleted ? '#20C55D' : isActive ? textColor : 'gray.400';
  const descColor = isActive || isCompleted ? 'gray.500' : 'gray.400';
  const stepLabelColor = isActive ? '#044bd9' : isCompleted ? 'gray.500' : 'gray.300';

  return (
    <Flex align="stretch" flex="1" minW={0}>
      <Box
        flex="1"
        px={{ base: 4, md: 5 }}
        py={{ base: 3, md: 4 }}
        display="flex"
        flexDirection="column"
        bg={isCompleted ? '#F0FDF4' : isActive ? '#ECF2FD' : 'transparent'}
        /* Bottom border replaces the right divider when cards are stacked on mobile */
        borderBottom={{ base: showRightDivider ? '1px solid' : 'none', md: 'none' }}
        borderBottomColor={{ base: dividerColor, md: 'transparent' }}
        sx={
          isActive && !isCompleted
            ? {
                '@keyframes activePulse': {
                  '0%, 100%': { backgroundColor: '#ECF2FD' },
                  '50%': { backgroundColor: '#D6E4FB' },
                },
                animation: 'activePulse 2.5s ease-in-out infinite',
              }
            : undefined
        }
      >
        {/* Icon box */}
        <Box
          w="44px"
          h="44px"
          borderRadius="xl"
          bg={iconBg}
          display="flex"
          alignItems="center"
          justifyContent="center"
          mb={3}
        >
          {isCompleted ? <TickSVG /> : <step.SvgIcon stroke={iconStroke} />}
        </Box>

        {/* Step label row */}
        <HStack spacing={2} mb={2}>
          <Text
            fontSize="10px"
            fontWeight="bold"
            color={stepLabelColor}
            textTransform="uppercase"
            letterSpacing="wider"
          >
            Step {step.stepNumber}
          </Text>
          {(isActive || isCompleted) && (
            <Box w="1px" h="12px" bg="gray.300" flexShrink={0} />
          )}
          {isActive && !isCompleted && (
            <Box px={2} py={0.5} borderRadius="full" border="1px solid" borderColor="#A3BBF0" bg="#EBF0FC">
              <Text fontSize="10px" fontWeight="medium" color="#044bd9">Up Next</Text>
            </Box>
          )}
          {isCompleted && (
            <Box px={2} py={0.5} borderRadius="full" border="1px solid" borderColor="#A8EFC4" bg="#F0FDF4">
              <Text fontSize="10px" fontWeight="medium" color="#20C55D">Done</Text>
            </Box>
          )}
        </HStack>

        {/* Title */}
        <Text fontSize="sm" fontWeight="bold" color={titleColor} mb={1}>
          {step.title}
        </Text>

        {/* Description */}
        <Text fontSize="xs" color={descColor} flex="1">
          {step.description}
        </Text>

        {/* Start now link */}
        <Box visibility={isActive && !isCompleted ? 'visible' : 'hidden'}>
          <Box h="1px" bg={separatorColor} mt={3} mb={3} />
          <Link to={step.link}>
            <Text fontSize="xs" fontWeight="semibold" color="#044bd9">
              {step.linkLabel || 'Start now'} →
            </Text>
          </Link>
        </Box>
      </Box>

      {/* Right divider — only on desktop (md+), hidden on mobile where bottom border is used instead) */}
      {showRightDivider && (
        <Box display={{ base: 'none', md: 'block' }} w="1px" bg={dividerColor} alignSelf="stretch" />
      )}
    </Flex>
  );
};

// ─── GettingStartedGuide ──────────────────────────────────────────────────────

export interface GettingStartedGuideProps {
  /** 1-based step numbers that are already completed */
  completedSteps: number[];
  onDismiss: () => void;
}

const GettingStartedGuide: React.FC<GettingStartedGuideProps> = ({
  completedSteps,
  onDismiss,
}) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('#1B2559', '#FFFFFF');

  const completedCount = completedSteps.length;
  const progressPercent = Math.round((completedCount / STEPS.length) * 100);
  const activeStepNumber =
    STEPS.find((s) => !completedSteps.includes(s.stepNumber))?.stepNumber ??
    null;
  const allCompleted = progressPercent === 100;
  const [isExpanded, setIsExpanded] = useState(!allCompleted);
  useEffect(() => {
    if (allCompleted) {
      setIsExpanded(false);
    }
  }, [allCompleted]);

  return (
    <Box
      bg={cardBg}
      border="1px"
      borderColor={borderColor}
      borderRadius="2xl"
      overflow="hidden"
      boxShadow="0 4px 24px rgba(60, 80, 180, 0.08), 0 1.5px 6px rgba(0,0,0,0.06)"
      mb={6}
    >
      {/* Header */}
      <Flex
        align="center"
        px={{ base: 3, md: 5 }}
        py={{ base: 2, md: 3 }}
        gap={{ base: 2, md: 3 }}
        bgGradient="linear(to-r, #ECF2FD, #ffffff)"
      >
        {/* Icon + title */}
        <Flex align="center" gap={{ base: 2, md: 3 }} flex="1" minW={0}>
          <Box
            w="32px"
            h="32px"
            bg="#044bd9"
            borderRadius="md"
            display="flex"
            alignItems="center"
            justifyContent="center"
            flexShrink={0}
          >
            <Icon as={MdRocketLaunch} color="white" boxSize={4} />
          </Box>
          <Box minW={0}>
            <Text fontSize="sm" fontWeight="bold" color={textColor} noOfLines={1}>
              Getting Started Guide
            </Text>
            <Text fontSize="xs" color="gray.500">
              {completedCount} of {STEPS.length} completed
            </Text>
          </Box>
        </Flex>

        {/* Progress + expand */}
        <HStack spacing={{ base: 2, md: 3 }} flexShrink={0}>
          <Text fontSize="xs" color="gray.500" display={{ base: 'none', sm: 'block' }}>
            {progressPercent}%
          </Text>
          <Box w={{ base: '60px', sm: '90px', md: '120px' }}>
            <Progress
              value={progressPercent}
              size="sm"
              borderRadius="full"
              bg="gray.200"
              sx={{ '& > div': { background: '#044bd9' } }}
            />
          </Box>
          <IconButton
            aria-label={isExpanded ? 'Collapse steps' : 'Expand steps'}
            icon={<Icon as={isExpanded ? MdExpandLess : MdExpandMore} boxSize={5} />}
            size="xs"
            variant="ghost"
            colorScheme="gray"
            onClick={() => setIsExpanded((v) => !v)}
          />
        </HStack>
      </Flex>

      {/* Steps */}
      <Collapse in={isExpanded} animateOpacity>
        <Box h="1px" bg={borderColor} />
        <Flex flexDirection={{ base: 'column', md: 'row' }}>
          {STEPS.map((step, idx) => (
            <StepCard
              key={step.stepNumber}
              step={step}
              isCompleted={completedSteps.includes(step.stepNumber)}
              isActive={step.stepNumber === activeStepNumber}
              showRightDivider={idx < STEPS.length - 1}
            />
          ))}
        </Flex>
      </Collapse>
    </Box>
  );
};

export default GettingStartedGuide;
