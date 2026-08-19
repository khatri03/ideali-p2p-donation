import { Box, Button, Flex, FormControl, FormLabel, Grid, Input, Text, useColorModeValue, useToast } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import HttpClient from 'app/service/httpClient/HttpClient';

interface ProfileFormData {
  firstName: string;
  lastName: string;
  primaryEmail: string;
  cellPhone: string;
}

const EMPTY: ProfileFormData = { firstName: '', lastName: '', primaryEmail: '', cellPhone: '' };

function DonorProfileForm() {
  const [formData, setFormData] = useState<ProfileFormData>(EMPTY);
  const [original, setOriginal] = useState<ProfileFormData>(EMPTY);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const textColor = useColorModeValue('#1B2559', 'white');
  const labelColor = useColorModeValue('#A3AED0', '#A3AED0');
  const cardBg = useColorModeValue('white', 'navy.800');
  const readOnlyBg = useColorModeValue('gray.50', 'navy.700');

  useEffect(() => {
    HttpClient.get<{ data: ProfileFormData; success: boolean }>('/api/member/me/profile').then((res) => {
      if (res.data.success) { setFormData(res.data.data); setOriginal(res.data.data); }
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await HttpClient.put<{ success: boolean; message: string | null }>('/api/member/me/profile', formData);
      if (res.data.success) {
        setOriginal(formData);
        setEditing(false);
        toast({ title: 'Profile updated.', status: 'success', duration: 3000 });
      } else {
        toast({ title: res.data.message ?? 'Update failed.', status: 'error', duration: 3000 });
      }
    } catch {
      toast({ title: 'An error occurred.', status: 'error', duration: 3000 });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box bg={cardBg} borderRadius="20px" p="24px">
      <Flex justify="space-between" align="center" mb="20px">
        <Text color={textColor} fontWeight="700" fontSize="lg">Profile Information</Text>
        {!editing ? (
          <Button size="sm" colorScheme="brand" variant="outline" onClick={() => setEditing(true)}>Edit</Button>
        ) : (
          <Flex gap="8px">
            <Button size="sm" variant="ghost" onClick={() => { setFormData(original); setEditing(false); }}>Cancel</Button>
            <Button size="sm" colorScheme="brand" isLoading={saving} onClick={handleSave}>Save</Button>
          </Flex>
        )}
      </Flex>
      <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap="16px">
        {([['firstName', 'First Name'], ['lastName', 'Last Name'], ['primaryEmail', 'Email'], ['cellPhone', 'Phone']] as [keyof ProfileFormData, string][]).map(([field, label]) => (
          <FormControl key={field}>
            <FormLabel color={labelColor} fontSize="sm">{label}</FormLabel>
            <Input value={formData[field]} isReadOnly={!editing} onChange={(e) => setFormData((p) => ({ ...p, [field]: e.target.value }))} borderRadius="10px" bg={!editing ? readOnlyBg : undefined} />
          </FormControl>
        ))}
      </Grid>
    </Box>
  );
}

export default DonorProfileForm;
