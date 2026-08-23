import { useRef, useState } from 'react';
import { Avatar, Button, FormControl, FormLabel, Stack, Text } from '@chakra-ui/react';
import { fundraiserPhotoUrl } from 'app/service/organizer/donation/fundraiserConsoleService';
import { initialsOf } from '../page/pageCopy';
import {
  PHOTO_CHOOSE,
  PHOTO_HELP,
  PHOTO_LABEL,
  PHOTO_REJECTED,
  PHOTO_REMOVE,
  PHOTO_REPLACE,
} from './consoleCopy';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024;

interface FundraiserPhotoFieldProps {
  displayName: string;
  photoUniqueId: string | null;
  isBusy: boolean;
  onSelect: (photo: File) => void;
  onRemove: () => void;
}

/**
 * Choosing and clearing the page photo. The checks here spare the supporter a round trip on an obvious
 * mistake; the server applies the same rules again and is the one that decides.
 */
export const FundraiserPhotoField = ({
  displayName,
  photoUniqueId,
  isBusy,
  onSelect,
  onRemove,
}: FundraiserPhotoFieldProps) => {
  const fileInput = useRef<HTMLInputElement>(null);
  const [rejection, setRejection] = useState<string | null>(null);

  const handleFileChosen = (event: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = event.target.files?.[0];
    event.target.value = '';

    if (!chosen) {
      return;
    }

    if (!ACCEPTED_TYPES.includes(chosen.type) || chosen.size === 0 || chosen.size > MAX_BYTES) {
      setRejection(PHOTO_REJECTED);
      return;
    }

    setRejection(null);
    onSelect(chosen);
  };

  return (
    <FormControl>
      <FormLabel>{PHOTO_LABEL}</FormLabel>

      <Stack direction={{ base: 'column', '2sm': 'row' }} gap={4} align={{ '2sm': 'center' }}>
        <Avatar
          name={displayName}
          src={photoUniqueId ? fundraiserPhotoUrl(photoUniqueId) : undefined}
          getInitials={() => initialsOf(displayName)}
          size="xl"
          bg="brand.500"
          color="white"
        />

        <Stack gap={2} flex="1" minW={0}>
          <Stack direction={{ base: 'column', md: 'row' }} gap={3}>
            <Button
              onClick={() => fileInput.current?.click()}
              variant="outline"
              colorScheme="brand"
              isDisabled={isBusy}
              isLoading={isBusy}
              minH="44px"
              borderRadius="12px"
              cursor="pointer"
              w={{ base: 'full', md: 'auto' }}
            >
              {photoUniqueId ? PHOTO_REPLACE : PHOTO_CHOOSE}
            </Button>

            {photoUniqueId && (
              <Button
                onClick={onRemove}
                variant="ghost"
                colorScheme="red"
                isDisabled={isBusy}
                minH="44px"
                borderRadius="12px"
                cursor="pointer"
                w={{ base: 'full', md: 'auto' }}
              >
                {PHOTO_REMOVE}
              </Button>
            )}
          </Stack>

          <Text fontSize="sm" color="gray.500" _dark={{ color: 'gray.400' }}>
            {PHOTO_HELP}
          </Text>

          {rejection && (
            <Text fontSize="sm" color="red.500" role="alert">
              {rejection}
            </Text>
          )}
        </Stack>
      </Stack>

      <input
        ref={fileInput}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        onChange={handleFileChosen}
        hidden
        aria-hidden="true"
        tabIndex={-1}
      />
    </FormControl>
  );
};

export default FundraiserPhotoField;
