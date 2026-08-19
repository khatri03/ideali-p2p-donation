import {
  Box,
  Divider,
  Flex,
  Switch,
  Text,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import HttpClient from 'app/service/httpClient/HttpClient';

interface Preferences {
  emailNotifications: boolean;
  twoFactorAuth: boolean;
}

function PreferencesCard() {
  const [prefs, setPrefs] = useState<Preferences>({
    emailNotifications: true,
    twoFactorAuth: false,
  });
  const [saving, setSaving] = useState<keyof Preferences | null>(null);
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'navy.800');
  const textColor = useColorModeValue('#1B2559', 'white');
  const subColor = useColorModeValue('#A3AED0', '#A3AED0');
  const dividerColor = useColorModeValue('gray.100', 'whiteAlpha.100');

  useEffect(() => {
    HttpClient.get<{ data: Preferences; success: boolean }>('/api/member/me/preferences')
      .then((res) => { if (res.data.success) setPrefs(res.data.data); })
      .catch(() => {});
  }, []);

  const handleToggle = async (key: keyof Preferences) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    setSaving(key);
    try {
      await HttpClient.put('/api/member/me/preferences', updated);
    } catch {
      setPrefs(prefs);
      toast({ title: 'Failed to save preference.', status: 'error', duration: 3000 });
    } finally {
      setSaving(null);
    }
  };

  const row = (label: string, key: keyof Preferences) => (
    <Flex align="center" justify="space-between" py="16px">
      <Text color={textColor} fontSize="sm" fontWeight="500">{label}</Text>
      <Switch
        colorScheme="brand"
        isChecked={prefs[key]}
        isDisabled={saving === key}
        onChange={() => handleToggle(key)}
        size="md"
      />
    </Flex>
  );

  return (
    <Box
      bg={cardBg}
      borderRadius="20px"
      p="24px 28px"
      boxShadow="14px 17px 40px 4px rgba(112, 144, 176, 0.08)"
      border="1px solid"
      borderColor={useColorModeValue('gray.100', 'whiteAlpha.100')}
    >
      <Text color={textColor} fontWeight="700" fontSize="lg" mb="4px">
        Preferences
      </Text>
      <Divider borderColor={dividerColor} mt="12px" />
      {row('Email me when organizers I support launch new campaigns', 'emailNotifications')}
      <Divider borderColor={dividerColor} />
      {row('Two-factor authentication', 'twoFactorAuth')}
    </Box>
  );
}

export default PreferencesCard;
