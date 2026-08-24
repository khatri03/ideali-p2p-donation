import { Link } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { FundraiserTeam } from 'app/interface/donationInter/fundraiserPageDto';
import { teamPagePath } from '../teams/teamPaths';
import { teamLine } from './pageCopy';

interface FundraiserTeamLinkProps {
  campaignSlug: string;
  team: FundraiserTeam;
}

/**
 * The wider effort behind one person, offered to a donor who has just read their story. A real router
 * link rather than a button, so it can be opened in a new tab the way any other address can.
 */
export const FundraiserTeamLink = ({ campaignSlug, team }: FundraiserTeamLinkProps) => (
  <Link
    as={RouterLink}
    to={teamPagePath(campaignSlug, team.slug)}
    display="inline-flex"
    alignItems="center"
    alignSelf="flex-start"
    minH="44px"
    fontSize={{ base: 'sm', md: 'md' }}
    fontWeight="medium"
    color="brand.500"
    cursor="pointer"
    _hover={{ textDecoration: 'underline' }}
  >
    {teamLine(team.name)}
  </Link>
);

export default FundraiserTeamLink;
