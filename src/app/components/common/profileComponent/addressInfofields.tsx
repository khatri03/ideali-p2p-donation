import React, { useEffect, useState } from 'react';
import {
  Box,
  SimpleGrid,
  FormControl,
  FormLabel,
  Input,
  Select,
  Text,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import countryStateService, { Country, State } from '../../../service/auth/countryStateService';
import CommonMethod from 'app/service/helpers/commonMethod';


interface AddressInfoFieldsProps {
  streetLine1: string;
  streetLine2: string;
  zipCode: string;
  countryId: number;
  stateId: number;
  city: string;
  streetLine1Error: string;
  zipCodeError: string;
  cityError: string;
  countryError: string;
  stateError: string;
  onChange: (field: string, value: string | number, additionalData?: { countryName?: string; stateName?: string }) => void;
  loading: boolean;
}

const AddressInfoFields: React.FC<AddressInfoFieldsProps> = ({
  streetLine1,
  streetLine2,
  zipCode,
  countryId,
  stateId,
  city,
  streetLine1Error,
  zipCodeError,
  cityError,
  countryError,
  stateError,
  onChange,
  loading,
}) => {
  const toast = useToast();
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);

  // Updated color scheme to match ProfileSettings
  const labelColor = useColorModeValue('gray.700', 'gray.300');
  const inputBg = useColorModeValue('gray.50', 'navy.900');
  const inputBorder = useColorModeValue('gray.200', 'whiteAlpha.100');

  useEffect(() => {
    fetchCountries();
  }, []);

  useEffect(() => {
    if (countryId) {
      fetchStates(countryId);
      console.log('Fetching states for countryId:', countryId);
    } else {
      setStates([]);
      onChange('stateId', 0, { stateName: '' });
    }
  }, [countryId]);

  const fetchCountries = async () => {
    try {
      setLoadingCountries(true);
      const response = await countryStateService.fetchCountries();
      if (response.success && response.data) {
        setCountries(response.data);
        console.log('✅ Fetched countries:', response.data.length, 'countries');
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
      console.log('Fetching states for countryId:', selectedCountryId);
      const response = await countryStateService.fetchStatesByCountry(selectedCountryId);
      
      console.log('States API response:', response);
      
      // Access the first element of the data array
      if (response.success && response.data && response.data.length > 0) {
        const statesData = response.data[0].states;
        setStates(statesData);
        console.log('✅ Fetched states:', statesData.length, 'states');
      } else {
        console.log('No states found for country:', selectedCountryId);
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

  // Handle country change with name extraction from the event
  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCountryId = Number(e.target.value);
    
    // Get the selected option element to extract the text (country name)
    const selectedOption = e.target.options[e.target.selectedIndex];
    const countryName = selectedOption?.text || '';
    
    // Alternative: Find from countries array
    const countryFromArray = countries.find(c => c.countryId === selectedCountryId);
    const countryNameFromArray = countryFromArray?.name || '';
    
    console.log('  - Country Name from array:', countryNameFromArray);
    
    // Use the name from array if available, otherwise use the option text
    const finalCountryName = countryNameFromArray || countryName;
    
    console.log('  - Final Country Name:', finalCountryName);
    
    // Pass country ID and name
    onChange('countryId', selectedCountryId, { 
      countryName: finalCountryName
    });
    
    // Reset state when country changes
    onChange('stateId', 0, { stateName: '' });
  };

  // Handle state change with name extraction from the event
  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedStateId = Number(e.target.value);
 
    const selectedOption = e.target.options[e.target.selectedIndex];
    const stateName = selectedOption?.text || '';

    const stateFromArray = states.find(s => s.stateId === selectedStateId);
    const stateNameFromArray = stateFromArray?.name || '';
    
    console.log('  - State Name from array:', stateNameFromArray);
    
    // Use the name from array if available, otherwise use the option text
    const finalStateName = stateNameFromArray || stateName;
    
    console.log('  - Final State Name:', finalStateName);
    
    // Pass state ID and name
    onChange('stateId', selectedStateId, { 
      stateName: finalStateName
    });
  };

  return (
    <Box>
      <SimpleGrid columns={{ sm: 1, md: 4 }} spacing={6}>
         {/* Street Line 1 */}
        <FormControl isInvalid={!!streetLine1Error} isRequired>
          <FormLabel
            fontWeight="600"
            fontSize="sm"
            color={labelColor}
          >
            Address Line 1 <Text as="span" color="red.500"></Text>
          </FormLabel>
          <Input
            placeholder="123 Main St"
            value={streetLine1}
            onChange={(e) => onChange('streetLine1', e.target.value)}
            bg={inputBg}
            border="1px solid"
            borderColor={inputBorder}
            _hover={{ borderColor: useColorModeValue('blue.400', 'blue.300') }}
            _focus={{
              borderColor: useColorModeValue('blue.500', 'blue.400'),
              boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)'
            }}
            disabled={loading}
          />
          {streetLine1Error && (
            <Text fontSize="sm" fontWeight="500" color="red.500" mt={1}>{streetLine1Error}</Text>
          )}
        </FormControl>

        {/* Street Line 2 */}
        <FormControl>
          <FormLabel
            fontWeight="600"
            fontSize="sm"
            color={labelColor}
          >
            Address Line 2 <Text as="span" color="red.500"></Text>
          </FormLabel>
          <Input
            placeholder="Apt 4B"
            value={streetLine2}
            onChange={(e) => onChange('streetLine2', e.target.value)}
            bg={inputBg}
            border="1px solid"
            borderColor={inputBorder}
            _hover={{ borderColor: useColorModeValue('blue.400', 'blue.300') }}
            _focus={{
              borderColor: useColorModeValue('blue.500', 'blue.400'),
              boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)'
            }}
            disabled={loading}
          />
        </FormControl>

        {/* City */}
        <FormControl isInvalid={!!cityError} isRequired>
          <FormLabel
            fontWeight="600"
            fontSize="sm"
            color={labelColor}
          >
            City <Text as="span" color="red.500"></Text>
          </FormLabel>
          <Input
            placeholder="New York"
            value={city}
            onChange={(e) => onChange('city', e.target.value)}
            bg={inputBg}
            border="1px solid"
            borderColor={inputBorder}
            _hover={{ borderColor: useColorModeValue('blue.400', 'blue.300') }}
            _focus={{
              borderColor: useColorModeValue('blue.500', 'blue.400'),
              boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)'
            }}
            disabled={loading}
          />
          {cityError && (
            <Text fontSize="sm" fontWeight="500" color="red.500" mt={1}>{cityError}</Text>
          )}
        </FormControl>

        {/* Country */}
        <FormControl isInvalid={!!countryError} isRequired>
          <FormLabel
            fontWeight="600"
            fontSize="sm"
            color={labelColor}
          >
            Country <Text as="span" color="red.500"></Text>
          </FormLabel>
          <Select
            placeholder="Please choose a country"
            value={countryId || ''}
            onChange={handleCountryChange}
            bg={inputBg}
            border="1px solid"
            borderColor={inputBorder}
            _hover={{ borderColor: useColorModeValue('blue.400', 'blue.300') }}
            _focus={{
              borderColor: useColorModeValue('blue.500', 'blue.400'),
              boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)'
            }}
            disabled={loading || loadingCountries}
          >
            {countries.map((country) => (
              <option key={country.countryId} value={country.countryId}>
                {country.name}
              </option>
            ))}
          </Select>
          {countryError && (
            <Text fontSize="sm" fontWeight="500" color="red.500" mt={1}>{countryError}</Text>
          )}
        </FormControl>

        {/* State */}
        <FormControl isInvalid={!!stateError} isRequired>
          <FormLabel
            fontWeight="600"
            fontSize="sm"
            color={labelColor}
          >
            State/Province <Text as="span" color="red.500"></Text>
          </FormLabel>
          <Select
            placeholder="Please choose a state"
            value={stateId || ''}
            onChange={handleStateChange}
            bg={inputBg}
            border="1px solid"
            borderColor={inputBorder}
            _hover={{ borderColor: useColorModeValue('blue.400', 'blue.300') }}
            _focus={{
              borderColor: useColorModeValue('blue.500', 'blue.400'),
              boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)'
            }}
            disabled={!countryId || loading || loadingStates}
          >
            {states.map((state) => (
              <option key={state.stateId} value={state.stateId}>
                {state.name}
              </option>
            ))}
          </Select>
          {stateError && (
            <Text fontSize="sm" fontWeight="500" color="red.500" mt={1}>{stateError}</Text>
          )}
        </FormControl>

        {/* Zip Code */}
        <FormControl isInvalid={!!zipCodeError} isRequired>
          <FormLabel
            fontWeight="600"
            fontSize="sm"
            color={labelColor}
          >
            Zip/Postal Code <Text as="span" color="red.500"></Text>
          </FormLabel>
          <Input
            placeholder="12345"
            value={zipCode}
            onChange={(e) => onChange('zipCode', e.target.value)}
            bg={inputBg}
            border="1px solid"
            borderColor={inputBorder}
            _hover={{ borderColor: useColorModeValue('blue.400', 'blue.300') }}
            _focus={{
              borderColor: useColorModeValue('blue.500', 'blue.400'),
              boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)'
            }}
            disabled={loading}
          />
          {zipCodeError && (
            <Text fontSize="sm" fontWeight="500" color="red.500" mt={1}>{zipCodeError}</Text>
          )}
        </FormControl>
      </SimpleGrid>
    </Box>
  );
};

export default AddressInfoFields;