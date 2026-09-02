import { useParams } from 'react-router-dom';
import PublicPageShell from '../page/PublicPageShell';
import LeaderboardBody from './LeaderboardBody';

/**
 * Screen 06. The public address of the standings, opened by anyone the link is shared with. Nothing
 * but the public frame and the board itself, so the charity's own view of the same campaign shows
 * identical standings inside its own frame.
 */
export const LeaderboardPage = () => {
  const { campaignSlug } = useParams<{ campaignSlug: string }>();

  return (
    <PublicPageShell>
      <LeaderboardBody campaignSlug={campaignSlug} />
    </PublicPageShell>
  );
};

export default LeaderboardPage;
