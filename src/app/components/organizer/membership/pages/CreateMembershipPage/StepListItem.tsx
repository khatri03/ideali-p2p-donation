import React from 'react';
import { Box, Flex, Icon, Text } from '@chakra-ui/react';
import { MdCheck } from 'react-icons/md';
import { WizardStep } from '../../types';

interface Props {
  step: WizardStep;
  isCompleted: boolean;
  isActive: boolean;
  accessible: boolean;
  /** true = sidebar (label hidden, reveals on hover); false = drawer (label always visible) */
  collapsed?: boolean;
  onStepClick: () => void;
}

export default function StepListItem({
  step, isCompleted, isActive, accessible, collapsed = false, onStepClick,
}: Props) {
  return (
    <Box
      px={2} py={3} borderRadius="lg"
      cursor={accessible ? 'pointer' : 'not-allowed'}
      opacity={accessible ? 1 : 0.5}
      bg={isCompleted ? 'green.50' : isActive ? 'blue.50' : 'transparent'}
      borderWidth="1px"
      borderColor={isCompleted ? 'green.300' : isActive ? 'blue.300' : 'transparent'}
      _hover={accessible ? {
        bg: isCompleted ? 'green.100' : isActive ? 'blue.50' : 'gray.50',
        borderColor: isCompleted ? 'green.400' : isActive ? 'blue.300' : 'gray.200',
      } : {}}
      transition="all 0.2s"
      onClick={() => accessible && onStepClick()}
    >
      <Flex align="center" gap={collapsed ? 0 : 3}>
        {/* Step number circle */}
        <Box position="relative" flexShrink={0}>
          <Flex
            align="center" justify="center"
            w="32px" h="32px" borderRadius="full"
            borderWidth={isCompleted ? '2px' : '0'}
            borderColor={isCompleted ? '#27C281' : 'transparent'}
            bg={isCompleted ? 'green.50' : isActive ? 'blue.500' : 'gray.200'}
            color={isCompleted ? '#27C281' : isActive ? 'white' : 'gray.500'}
            fontSize="sm" fontWeight="bold" transition="all 0.2s"
          >
            {step.number}
          </Flex>
          {isCompleted && (
            <Flex
              position="absolute" top="-3px" right="-3px"
              bg="#27C281" borderRadius="full" w="16px" h="16px"
              align="center" justify="center" border="1.5px solid white" boxShadow="sm"
            >
              <Icon as={MdCheck} color="white" boxSize="10px" fontWeight="bold" />
            </Flex>
          )}
        </Box>

        {/* Label — always visible in drawer, hidden/revealed in sidebar */}
        <Text
          className={collapsed ? 'step-label' : undefined}
          fontSize="sm"
          fontWeight={isActive ? 'semibold' : 'medium'}
          color={isCompleted ? 'green.700' : isActive ? 'blue.700' : 'gray.700'}
          noOfLines={2}
          {...(collapsed ? {
            opacity: 0,
            width: 0,
            overflow: 'hidden',
            transition: 'all 0.3s ease',
            whiteSpace: 'nowrap',
          } : {})}
        >
          {step.label}
        </Text>
      </Flex>
    </Box>
  );
}
