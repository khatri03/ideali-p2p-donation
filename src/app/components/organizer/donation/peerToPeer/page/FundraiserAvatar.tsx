import type { IconType } from 'react-icons';
import { Flex, Icon, Image } from '@chakra-ui/react';
import { MdVolunteerActivism } from 'react-icons/md';

interface FundraiserAvatarProps {
  /** Used as the alternative text. Never drawn as initials - see the note below. */
  displayName: string;
  /** The uploaded photo. Null while the supporter has not chosen one. */
  photoUrl: string | null;
  size?: string;
  /**
   * The mark drawn when there is no photo. A team passes its own, because a group and a person are not
   * the same thing to look at, and a team carries no photo of its own at all.
   */
  icon?: IconType;
}

/**
 * The picture beside a fundraising page.
 *
 * Initials are deliberately not the fallback. A supporter names their page after the cause at least as
 * often as after themselves, so "Raise fund for the shelter" would be drawn as "RF" - two letters that
 * stand for nothing and read as a mistake next to a page whose owner did use their own name. A neutral
 * mark says the same thing without inventing an identity.
 */
export const FundraiserAvatar = ({
  displayName,
  photoUrl,
  size = '64px',
  icon = MdVolunteerActivism,
}: FundraiserAvatarProps) =>
  photoUrl ? (
    <Image
      src={photoUrl}
      alt={displayName}
      boxSize={size}
      minW={size}
      borderRadius="full"
      objectFit="cover"
    />
  ) : (
    <Flex
      boxSize={size}
      minW={size}
      borderRadius="full"
      bg="brand.500"
      color="white"
      align="center"
      justify="center"
      role="img"
      aria-label={displayName}
    >
      <Icon as={icon} boxSize="55%" />
    </Flex>
  );

export default FundraiserAvatar;
