import React, { useEffect, useState } from 'react';
import {
  Box,
  VStack,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Select,
  Text,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import countryStateService, {
  Country,
  State,
} from '../../service/auth/countryStateService';
import CommonMethod from 'app/service/helpers/commonMethod';

interface AddressInfoFieldsProps {
  streetLine1: string;
  streetLine2: string;
  zipCode: string;
  countryId: number;
  stateId: number;
  city: string;
  streetLine1Error: string;
  streetLine2Error: string;
  zipCodeError: string;
  onChange: (field: string, value: string | number) => void;
  loading: boolean;
  countryIdError?: string;
  stateIdError?: string;
  cityError?: string;
}

const addressInfofields: React.FC<AddressInfoFieldsProps> = ({
  streetLine1,
  streetLine2,
  zipCode,
  countryId,
  stateId,
  city,
  streetLine1Error,
  streetLine2Error,
  zipCodeError,
  countryIdError,
  stateIdError,
  cityError,
  onChange,
  loading,
}) => {
  const toast = useToast();
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);

  const textColor = useColorModeValue('#1B2559', '#FFFFFF');
  const brandStars = useColorModeValue('#4318FF', '#044bd9');
  const borderColor = useColorModeValue('#E0E5F2', '#2D3748');

  useEffect(() => {
    fetchCountries();
  }, []);

  useEffect(() => {
    if (countryId) {
      fetchStates(countryId);
      console.log('Fetching states for countryId:', countryId);
    } else {
      setStates([]);
      onChange('stateId', 0);
    }
  }, [countryId]);

  const fetchCountries = async () => {
    try {
      setLoadingCountries(true);
      const response = await countryStateService.fetchCountries();
      if (response.success && response.data) {
        setCountries(response.data);
        console.log('Fetched countries:', response.data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: CommonMethod.ErrorMessage(error),
        status: 'error',
        position: 'top-right',
      });
    } finally {
      setLoadingCountries(false);
    }
  };

  const fetchStates = async (selectedCountryId: number) => {
    try {
      setLoadingStates(true);
      console.log('Selected countryId for fetching states:', selectedCountryId);
      const response =
        await countryStateService.fetchStatesByCountry(selectedCountryId);

      console.log('Full response:', response);

      // FIX: Access the first element of the data array
      if (response.success && response.data && response.data.length > 0) {
        const statesData = response.data[0].states;
        setStates(statesData);
        console.log('States set to:', statesData);
      } else {
        console.log('No states found');
        setStates([]);
      }
    } catch (error) {
      console.error('Error fetching states:', error);
      toast({
        title: 'Error',
        description: CommonMethod.ErrorMessage(error),
        status: 'error',
        position: 'top-right',
      });
      setStates([]);
    } finally {
      setLoadingStates(false);
    }
  };

  const handleCountryChange = (value: number) => {
    onChange('countryId', value);
    onChange('stateId', 0);
  };

  return (
    <Box>
      <Text
        fontSize="17px"
        fontWeight="700"
        color={useColorModeValue('#2563EA', '#7551FF')}
        mb={3}
      >
        Address Info
      </Text>

      <VStack spacing={4}>
        {/* Street Line 1 and Street Line 2 */}
        <Flex gap={4} w="100%" direction={{ base: 'column', md: 'row' }}>
          <FormControl flex={1} isInvalid={!!streetLine1Error}>
            <FormLabel
              fontSize="sm"
              fontWeight="500"
              color={textColor}
              mb="8px"
            >
              Address Line 1
              <Text as="span" color={brandStars}>
                *
              </Text>
            </FormLabel>
            <Input
              placeholder="123 Main St"
              value={streetLine1}
              onChange={(e) => onChange('streetLine1', e.target.value)}
              fontSize="sm"
              fontWeight="500"
              h="44px"
              borderRadius="16px"
              border="1px solid"
              borderColor={borderColor}
              bg={useColorModeValue('#FFFFFF', '#1B254B')}
              disabled={loading}
            />
            {streetLine1Error && (
              <Text fontSize="sm" color="red.500" mt={1}>
                {streetLine1Error}
              </Text>
            )}
          </FormControl>

          <FormControl flex={1} isInvalid={!!streetLine2Error}>
            <FormLabel
              fontSize="sm"
              fontWeight="500"
              color={textColor}
              mb="8px"
            >
              Address Line 2 <Text as="span" color={brandStars}></Text>
            </FormLabel>
            <Input
              placeholder="Apt 4B"
              value={streetLine2}
              onChange={(e) => onChange('streetLine2', e.target.value)}
              fontSize="sm"
              fontWeight="500"
              h="44px"
              borderRadius="16px"
              border="1px solid"
              borderColor={borderColor}
              bg={useColorModeValue('#FFFFFF', '#1B254B')}
              disabled={loading}
            />
            {streetLine2Error && (
              <Text fontSize="sm" color="red.500" mt={1}>
                {streetLine2Error}
              </Text>
            )}
          </FormControl>
        </Flex>

        <Flex gap={4} w="100%" direction={{ base: 'column', md: 'row' }}>
          <FormControl flex={1}>
            <FormLabel
              fontSize="sm"
              fontWeight="500"
              color={textColor}
              mb="8px"
            >
              City
            </FormLabel>
            <Input
              placeholder="New York"
              maxLength={20}
              value={city}
              onChange={(e) => onChange('city', e.target.value)}
              fontSize="sm"
              fontWeight="500"
              h="44px"
              borderRadius="16px"
              border="1px solid"
              borderColor={borderColor}
              bg={useColorModeValue('#FFFFFF', '#1B254B')}
              disabled={loading}
            />
            {cityError && (
              <Text fontSize="sm" color="red.500" mt={1}>
                {cityError}
              </Text>
            )}
          </FormControl>
          <FormControl flex={1}>
            <FormLabel
              fontSize="sm"
              fontWeight="500"
              color={textColor}
              mb="8px"
            >
              Country<Text as="span" color={brandStars}></Text>
            </FormLabel>
            <Select
              placeholder="Please choose a country"
              value={countryId || ''}
              onChange={(e) => handleCountryChange(Number(e.target.value))}
              fontSize="sm"
              fontWeight="500"
              h="44px"
              borderRadius="16px"
              border="1px solid"
              borderColor={borderColor}
              bg={useColorModeValue('#FFFFFF', '#1B254B')}
              disabled={loading || loadingCountries}
            >
              {countries.map((country) => (
                <option key={country.countryId} value={country.countryId}>
                  {country.name}
                </option>
              ))}
            </Select>
            {countryIdError && (
              <Text fontSize="sm" color="red.500" mt={1}>
                {countryIdError}
              </Text>
            )}
          </FormControl>
        </Flex>

        <Flex gap={4} w="100%" direction={{ base: 'column', md: 'row' }}>
          <FormControl flex={1}>
            <FormLabel
              fontSize="sm"
              fontWeight="500"
              color={textColor}
              mb="8px"
            >
              State/Province
            </FormLabel>
            <Select
              placeholder="Please choose a state"
              value={stateId || ''}
              onChange={(e) => onChange('stateId', Number(e.target.value))}
              fontSize="sm"
              fontWeight="500"
              h="44px"
              borderRadius="16px"
              border="1px solid"
              borderColor={borderColor}
              bg={useColorModeValue('#FFFFFF', '#1B254B')}
              disabled={!countryId || loading || loadingStates}
            >
              {states.map((state) => (
                <option key={state.stateId} value={state.stateId}>
                  {state.name}
                </option>
              ))}
            </Select>
            {stateIdError && (
              <Text fontSize="sm" color="red.500" mt={1}>
                {stateIdError}
              </Text>
            )}
          </FormControl>

          <FormControl flex={1} isInvalid={!!zipCodeError}>
            <FormLabel
              fontSize="sm"
              fontWeight="500"
              color={textColor}
              mb="8px"
            >
              Zip/Postal Code
              <Text as="span" color={brandStars}>
                *
              </Text>
            </FormLabel>
            <Input
              placeholder="12345"
              value={zipCode}
              maxLength={10}
              onChange={(e) => {
                // Allow alphanumeric, spaces, and hyphens only
                const sanitized = e.target.value.replace(
                  /[^a-zA-Z0-9\s\-]/g,
                  '',
                );
                onChange('zipCode', sanitized);
              }}
              fontSize="sm"
              fontWeight="500"
              h="44px"
              borderRadius="16px"
              border="1px solid"
              borderColor={borderColor}
              bg={useColorModeValue('#FFFFFF', '#1B254B')}
              disabled={loading}
            />
            {zipCodeError && (
              <Text fontSize="sm" color="red.500" mt={1}>
                {zipCodeError}
              </Text>
            )}
          </FormControl>
        </Flex>
      </VStack>
    </Box>
  );
};

export default addressInfofields;
