import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Grid,
  Input,
  Text,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import { useState } from 'react';
import donorProfileService from 'app/components/member/services/donorProfileService';

export interface PersonalInfoData {
  fullName: string;
  email: string;
  phone: string;
  country: string;
}

interface PersonalInfoCardProps {
  data: PersonalInfoData;
  onChange: (updated: PersonalInfoData) => void;
}

function PersonalInfoCard({ data, onChange }: PersonalInfoCardProps) {
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'navy.800');
  const textColor = useColorModeValue('#1B2559', 'white');
  const labelColor = useColorModeValue('#A3AED0', '#A3AED0');
  const inputBg = useColorModeValue('gray.50', 'navy.700');
  const readOnlyBg = useColorModeValue('gray.100', 'navy.600');

  const handleSave = async () => {
    setSaving(true);
    try {
      const nameParts = data.fullName.trim().split(/\s+/);
      const firstName = nameParts[0] ?? '';
      const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
      const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : '';
      const res = await donorProfileService.updateProfile({
        firstName,
        middleName: middleName || undefined,
        lastName,
        primaryEmail: data.email,
        phoneNo: data.phone,
        country: data.country,
      });
      if (res.success) {
        toast({ title: 'Profile updated.', status: 'success', duration: 3000 });
      } else {
        toast({ title: res.message ?? 'Update failed.', status: 'error', duration: 3000 });
      }
    } catch {
      toast({ title: 'An error occurred.', status: 'error', duration: 3000 });
    } finally {
      setSaving(false);
    }
  };

  const field = (
    label: string,
    key: keyof PersonalInfoData,
    type = 'text',
    readOnly = false,
  ) => (
    <FormControl>
      <FormLabel
        color={labelColor}
        fontSize="xs"
        fontWeight="700"
        textTransform="uppercase"
        letterSpacing="wider"
        mb="6px"
      >
        {label}
      </FormLabel>
      <Input
        type={type}
        value={data[key]}
        bg={readOnly ? readOnlyBg : inputBg}
        border="none"
        borderRadius="12px"
        fontSize="sm"
        fontWeight="500"
        color={readOnly ? labelColor : textColor}
        isReadOnly={readOnly}
        cursor={readOnly ? 'not-allowed' : 'text'}
        _focus={readOnly ? {} : { bg: inputBg, boxShadow: '0 0 0 2px #4318FF' }}
        onChange={readOnly ? undefined : (e) => onChange({ ...data, [key]: e.target.value })}
      />
    </FormControl>
  );

  return (
    <Box
      flex="1"
      bg={cardBg}
      borderRadius="20px"
      p="28px"
      boxShadow="14px 17px 40px 4px rgba(112, 144, 176, 0.08)"
      border="1px solid"
      borderColor={useColorModeValue('gray.100', 'whiteAlpha.100')}
    >
      <Text color={textColor} fontWeight="700" fontSize="lg" mb="24px">
        Personal Information
      </Text>

      <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap="20px" mb="28px">
        {field('Full Name', 'fullName')}
        {field('Email', 'email', 'email', true)}
        {field('Phone', 'phone', 'tel')}
      </Grid>

      <Button
        colorScheme="brand"
        borderRadius="12px"
        px="28px"
        h="44px"
        fontSize="sm"
        fontWeight="600"
        isLoading={saving}
        onClick={handleSave}
      >
        Save Changes
      </Button>
    </Box>
  );
}

export default PersonalInfoCard;
