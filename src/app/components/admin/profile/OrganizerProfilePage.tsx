import { useParams } from 'react-router-dom';
import ProfileSettings from './profileSettings';

export default function OrganizerProfilePage() {
  const { organizerUniqueId } = useParams<{ organizerUniqueId: string }>();

  return (
    <ProfileSettings organizerUniqueId={organizerUniqueId} />
  );
}
