import React from 'react';
import {
  FormControl,
  FormLabel,
  Input,
  Select,
  Text,
  SimpleGrid,
  Switch,
  HStack,
  useColorModeValue,
} from '@chakra-ui/react';
import { timeZoneResponseDto } from '../../../interface/CommonInter/timeZoneResponseDto';
import TimeZoneService from '../../../service/helpers/TimezoneService';

interface OrganizerInfoFieldsProps {
  organizerName: string;
  timeZoneId: number;
  timeZoneOptionData: timeZoneResponseDto | null;
  organizerNameError?: string;
  onChange: (field: string, value: string | number) => void;
  onBlur: (field: string) => void;
  isEditing: boolean;
  status: boolean;
  isTogglingStatus?: boolean;
  onStatusChange: (active: boolean) => void;
}

export default function OrganizerInfoFields({
  organizerName,
  timeZoneId,
  timeZoneOptionData,
  organizerNameError,
  onChange,
  onBlur,
  isEditing,
  status,
  isTogglingStatus,
  onStatusChange,
}: OrganizerInfoFieldsProps) {
  const inputBg = useColorModeValue('gray.50', 'navy.900');
  const inputBorder = useColorModeValue('gray.200', 'whiteAlpha.100');
  const labelColor = useColorModeValue('gray.700', 'gray.300');
  const textColor = useColorModeValue('gray.700', 'white');
  const hoverBorderColor = useColorModeValue('blue.400', 'blue.300');
  const focusBorderColor = useColorModeValue('blue.500', 'blue.400');

  return (
    <SimpleGrid columns={{ sm: 1, md: 4 }} spacing={6}>
      {/* Organizer Name */}
      <FormControl>
        <FormLabel fontWeight="600" fontSize="sm" color={labelColor}>
          Organizer Name <Text as="span" color="red.500">*</Text>
        </FormLabel>
        {isEditing ? (
          <>
            <Input
              placeholder="Company XYZ"
              maxLength={100}
              value={organizerName}
              onChange={(e) => onChange('organizerName', e.target.value)}
              onBlur={() => onBlur('organizerName')}
              bg={inputBg}
              border="1px solid"
              borderColor={inputBorder}
              _hover={{ borderColor: hoverBorderColor }}
              _focus={{
                borderColor: focusBorderColor,
                boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)',
              }}
            />
            {organizerNameError && (
              <Text fontSize="sm" fontWeight="500" color="red.500" mt={1}>
                {organizerNameError}
              </Text>
            )}
          </>
        ) : (
          <Text color={textColor} fontWeight="medium">{organizerName || '-'}</Text>
        )}
      </FormControl>

      {/* Time Zone */}
      <FormControl>
        <FormLabel fontWeight="600" fontSize="sm" color={labelColor}>
          Time Zone <Text as="span" color="red.500">*</Text>
        </FormLabel>
        {isEditing ? (
          <Select
            value={timeZoneId}
            onChange={(e) => onChange('timeZoneId', Number(e.target.value))}
            bg={inputBg}
            border="1px solid"
            borderColor={inputBorder}
            _hover={{ borderColor: hoverBorderColor }}
            _focus={{
              borderColor: focusBorderColor,
              boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)',
            }}
          >
            <option value="">--Please choose a timezone--</option>
            {timeZoneOptionData?.data?.map((tz) => {
              const timezoneName = tz.displayName.split(') ')[1] || tz.displayName;
              return (
                <option
                  key={tz.id}
                  value={tz.id}
                  label={`${timezoneName} ${tz.displayName.split(')')[0]})`}
                >
                  {tz.displayName}
                </option>
              );
            })}
          </Select>
        ) : (
          <Text color={textColor} fontWeight="medium">
            {TimeZoneService.getTimeZoneDisplay(timeZoneId, timeZoneOptionData)}
          </Text>
        )}
      </FormControl>

      {/* Status */}
      <FormControl>
        <FormLabel fontWeight="600" fontSize="sm" color={labelColor}>
          Status
        </FormLabel>
        <HStack spacing={3} mt={2}>
          <Switch
            id="organizer-status"
            isChecked={status}
            onChange={(e) => onStatusChange(e.target.checked)}
            colorScheme="green"
            size="md"
            isDisabled={!isEditing || isTogglingStatus}
          />
          <Text fontSize="sm" color={textColor} fontWeight="medium">
            {isTogglingStatus ? 'Updating...' : status ? 'Active' : 'Inactive'}
          </Text>
        </HStack>
      </FormControl>
    </SimpleGrid>
  );
}