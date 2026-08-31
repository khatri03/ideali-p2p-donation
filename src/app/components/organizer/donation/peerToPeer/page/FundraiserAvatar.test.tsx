import { ChakraProvider } from '@chakra-ui/react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import FundraiserAvatar from './FundraiserAvatar';

const CAUSE_NAME = 'Raise fund for the shelter';

const renderAvatar = (photoUrl: string | null, displayName = CAUSE_NAME) =>
  render(
    <ChakraProvider>
      <FundraiserAvatar displayName={displayName} photoUrl={photoUrl} />
    </ChakraProvider>,
  );

describe('FundraiserAvatar', () => {
  /**
   * A page named after its cause would be reduced to two letters standing for nothing, so no page is
   * ever drawn as initials however it is named.
   */
  it('Avatar_PageNamedAfterTheCause_ShowsNoInventedInitials', () => {
    renderAvatar(null);

    expect(screen.queryByText('RF')).not.toBeInTheDocument();
    expect(screen.queryByText('Rf')).not.toBeInTheDocument();
  });

  /** A picture with no name behind it leaves a screen reader nothing to announce. */
  it('Avatar_NoPhotoUploaded_StillNamesThePageItStandsFor', () => {
    renderAvatar(null);

    expect(screen.getByRole('img', { name: CAUSE_NAME })).toBeInTheDocument();
  });

  /** The supporter's own photo is the point of uploading one, so it replaces the neutral mark. */
  it('Avatar_PhotoUploaded_ShowsItUnderThePagesName', () => {
    renderAvatar('/api/images/photo.png');

    const photo = screen.getByRole('img', { name: CAUSE_NAME });

    expect(photo).toHaveAttribute('src', '/api/images/photo.png');
  });
});
