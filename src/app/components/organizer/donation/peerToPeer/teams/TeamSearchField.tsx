import {
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Spinner,
} from '@chakra-ui/react';
import { MdSearch } from 'react-icons/md';
import { SEARCH_LABEL, SEARCH_PLACEHOLDER } from './teamCopy';

interface TeamSearchFieldProps {
  value: string;
  isSearching: boolean;
  onChange: (value: string) => void;
}

/** Searching is answered by the server, so the field reports keystrokes and shows that it is working. */
export const TeamSearchField = ({ value, isSearching, onChange }: TeamSearchFieldProps) => (
  <FormControl maxW={{ md: '420px' }}>
    <FormLabel htmlFor="team-search" srOnly>
      {SEARCH_LABEL}
    </FormLabel>
    <InputGroup>
      <InputLeftElement h="44px" pointerEvents="none">
        <MdSearch aria-hidden="true" />
      </InputLeftElement>
      <Input
        id="team-search"
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={SEARCH_PLACEHOLDER}
        aria-label={SEARCH_LABEL}
        bg="white"
        _dark={{ bg: 'navy.700' }}
        minH="44px"
        borderRadius="12px"
      />
      {isSearching && (
        <InputRightElement h="44px">
          <Spinner size="sm" color="brand.500" aria-label={SEARCH_LABEL} />
        </InputRightElement>
      )}
    </InputGroup>
  </FormControl>
);

export default TeamSearchField;
