import React from 'react';
import {
  Box,
  Flex,
  FormLabel,
  Input,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  Text,
  VStack,
  Tooltip,
} from '@chakra-ui/react';
import Loader from 'app/components/common/Loader';
import { useStep03 } from './useStep03';
import { MembershipPreviewData } from '../../../types';
import StepNavButtons from '../../shared/StepNavButtons';

interface Step03Props {
  membershipId: string | null;
  isEditMode?: boolean;
  onComplete: () => void;
  onPrev?: () => void;
  onSkip?: () => void;
  onSaveAndExit?: () => void;
  isSavingAndExiting?: boolean;
  onPreviewUpdate?: (data: Partial<MembershipPreviewData>) => void;
}

const AVAILABLE_COLORS = [
  '#041470',
  '#4B7BEC',
  '#1A535C',
  '#4ECDC4',
  '#45B649',
  '#F7A000',
  '#E8431A',
  '#D63031',
];

export default function Step03Color({
  membershipId,
  isEditMode,
  onComplete,
  onPrev,
  onSkip,
  onSaveAndExit,
  isSavingAndExiting,
  onPreviewUpdate,
}: Step03Props) {
  const { themeColor, setThemeColor, isSubmitting, isLoading, submit, saveAndExit } = useStep03({
    membershipId,
    isEditMode,
    onComplete,
    onPreviewUpdate,
  });

  const isCustomColor = !AVAILABLE_COLORS.includes(themeColor);

  return (
    <Box
      bg="white"
      borderRadius="2xl"
      border="1px solid"
      borderColor="gray.200"
      boxShadow="0 4px 24px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04)"
      overflow="hidden"
    >
      {/* Body */}
      <Box px={6} pt={6} pb={6}>
        {isLoading ? (
          <Loader message="Loading Color" subtitle="Fetching saved color settings..." />
        ) : (<>
        <Text fontSize="xl" fontWeight="bold" color="gray.900" mb={1}>
          Color
        </Text>
        <Text fontSize="sm" color="gray.400" mb={6}>
          Choose a theme color for your membership type. This color will appear on
          the membership card and registration page.
        </Text>

        <FormLabel fontSize="sm" fontWeight="medium" color="gray.700" mb={3}>
          Select Color
        </FormLabel>

        <Flex gap={3} flexWrap="wrap" align="center">
          {AVAILABLE_COLORS.map((color) => {
            const isSelected = themeColor === color;
            return (
              <Tooltip key={color} label={color} fontSize="xs">
                <Box
                  w="44px"
                  h="44px"
                  bg={color}
                  borderRadius="lg"
                  cursor="pointer"
                  borderWidth="3px"
                  borderColor={isSelected ? 'gray.900' : 'transparent'}
                  boxShadow={isSelected ? '0 0 0 2px white inset' : 'sm'}
                  transition="all 0.15s"
                  _hover={{ transform: 'scale(1.1)', boxShadow: 'md' }}
                  onClick={() => setThemeColor(color)}
                />
              </Tooltip>
            );
          })}

          {/* Custom color picker */}
          <Popover placement="bottom-start">
            <PopoverTrigger>
              <Box
                w="44px"
                h="44px"
                borderWidth="2px"
                borderStyle="dashed"
                borderColor={isCustomColor ? 'gray.900' : 'gray.300'}
                borderRadius="lg"
                cursor="pointer"
                display="flex"
                alignItems="center"
                justifyContent="center"
                bg={isCustomColor ? themeColor : 'white'}
                transition="all 0.15s"
                _hover={{ transform: 'scale(1.1)', borderColor: 'gray.500' }}
              >
                {!isCustomColor && (
                  <Text fontSize="xl" color="gray.400" lineHeight="1">
                    +
                  </Text>
                )}
              </Box>
            </PopoverTrigger>
            <PopoverContent w="200px">
              <PopoverBody>
                <VStack spacing={3}>
                  <Text fontSize="sm" fontWeight="semibold" color="gray.700">
                    Custom Color
                  </Text>
                  <Input
                    type="color"
                    value={themeColor}
                    onChange={(e) => setThemeColor(e.target.value)}
                    w="100%"
                    h="40px"
                    p="0"
                    border="none"
                    cursor="pointer"
                  />
                </VStack>
              </PopoverBody>
            </PopoverContent>
          </Popover>
        </Flex>

        {/* Selected color preview */}
        <Flex align="center" gap={3} mt={5}>
          <Box
            w="28px"
            h="28px"
            borderRadius="md"
            bg={themeColor}
            border="1px solid"
            borderColor="gray.200"
            flexShrink={0}
          />
          <Text fontSize="sm" color="gray.600">
            Selected:{' '}
            <Text as="span" fontWeight="semibold" color="gray.800">
              {themeColor.toUpperCase()}
            </Text>
          </Text>
        </Flex>
        </>)}
      </Box>

      {/* Footer */}
      <StepNavButtons
        onNext={submit}
        onPrev={onPrev}
        onSkip={onSkip}
        showSkip
        onSaveAndExit={onSaveAndExit ? () => saveAndExit(onSaveAndExit) : undefined}
        isSavingAndExiting={isSavingAndExiting}
        isSubmitting={isSubmitting}
      />
    </Box>
  );
}
