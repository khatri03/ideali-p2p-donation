import { ChakraProvider } from '@chakra-ui/react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import FundraiserTeamLink from './FundraiserTeamLink';

const renderLink = () =>
  render(
    <ChakraProvider>
      <MemoryRouter>
        <FundraiserTeamLink
          campaignSlug="winter-appeal"
          team={{ slug: 'night-runners', name: 'Night Runners' }}
        />
      </MemoryRouter>
    </ChakraProvider>,
  );

describe('FundraiserTeamLink', () => {
  it('PublicPage_FundraiserInATeam_LinksToThatTeamsPage', () => {
    renderLink();

    expect(screen.getByRole('link', { name: 'Part of Night Runners' })).toHaveAttribute(
      'href',
      '/campaigns/winter-appeal/teams/night-runners',
    );
  });

  it('PublicPage_TeamLink_IsATouchTargetWithAPointerCursor', () => {
    renderLink();

    expect(screen.getByRole('link', { name: 'Part of Night Runners' })).toHaveStyle({
      minHeight: '44px',
      cursor: 'pointer',
    });
  });
});
