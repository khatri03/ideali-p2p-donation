import { Box, Flex } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import Loader from 'app/components/common/Loader';
import ProfileCard from './profile/ProfileCard';
import PersonalInfoCard, { PersonalInfoData } from './profile/PersonalInfoCard';
import PreferencesCard from './PreferencesCard';
import donorProfileService from '../services/donorProfileService';

function DonorSettingsPage() {
  const [profileInfo, setProfileInfo] = useState<PersonalInfoData>({
    fullName: localStorage.getItem('userName') ?? '',
    email: localStorage.getItem('userEmail') ?? '',
    phone: '',
    country: '',
  });
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    donorProfileService.getProfile()
      .then((d) => {
        if (d) {
          const fullName = [d.firstName, d.middleName, d.lastName].filter(Boolean).join(' ');
          setProfileInfo({
            fullName: fullName || localStorage.getItem('userName') || '',
            email: d.primaryEmail || localStorage.getItem('userEmail') || '',
            phone: d.phoneNo || '',
            country: d.country || '',
          });
          setCity(d.city || '');
          setCountry(d.country || '');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <Loader message="Loading your profile…" subtitle="Please wait while we fetch your account details" fullPage />;
  }

  return (
    <Box pt={{ base: '10px', md: '50px' }}>
      {/* Top row: profile card + personal info form */}
      <Flex
        gap="20px"
        mb="20px"
        align="stretch"
        direction={{ base: 'column', lg: 'row' }}
      >
        <ProfileCard
          fullName={profileInfo.fullName}
          email={profileInfo.email}
          city={city}
          country={country}
          isTopDonor={true}
          topDonorPercentile={5}
        />
        <PersonalInfoCard
          data={profileInfo}
          onChange={setProfileInfo}
        />
      </Flex>

      {/* Preferences */}
      {/* <PreferencesCard /> */}
    </Box>
  );
}

export default DonorSettingsPage;
