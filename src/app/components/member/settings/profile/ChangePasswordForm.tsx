import { Box, Button, Flex, FormControl, FormErrorMessage, FormLabel, Input, Text, useColorModeValue, useToast } from '@chakra-ui/react';
import { useState } from 'react';
import HttpClient from 'app/service/httpClient/HttpClient';

interface PasswordForm { currentPassword: string; newPassword: string; confirmPassword: string; }
const EMPTY: PasswordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };

function ChangePasswordForm() {
  const [form, setForm] = useState<PasswordForm>(EMPTY);
  const [touched, setTouched] = useState<Partial<Record<keyof PasswordForm, boolean>>>({});
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const textColor = useColorModeValue('#1B2559', 'white');
  const labelColor = useColorModeValue('#A3AED0', '#A3AED0');
  const cardBg = useColorModeValue('white', 'navy.800');

  const errors: Partial<Record<keyof PasswordForm, string>> = {};
  if (touched.currentPassword && !form.currentPassword) errors.currentPassword = 'Required';
  if (touched.newPassword && form.newPassword.length < 8) errors.newPassword = 'Min 8 characters';
  if (touched.confirmPassword && form.confirmPassword !== form.newPassword) errors.confirmPassword = 'Passwords do not match';

  const handleSubmit = async () => {
    setTouched({ currentPassword: true, newPassword: true, confirmPassword: true });
    if (errors.currentPassword || errors.newPassword || errors.confirmPassword) return;
    setSaving(true);
    try {
      const res = await HttpClient.post<{ success: boolean; message: string | null }>('/api/member/me/change-password', { currentPassword: form.currentPassword, newPassword: form.newPassword });
      if (res.data.success) {
        setForm(EMPTY); setTouched({});
        toast({ title: 'Password changed successfully.', status: 'success', duration: 3000 });
      } else {
        toast({ title: res.data.message ?? 'Failed to change password.', status: 'error', duration: 3000 });
      }
    } catch {
      toast({ title: 'An error occurred.', status: 'error', duration: 3000 });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box bg={cardBg} borderRadius="20px" p="24px">
      <Text color={textColor} fontWeight="700" fontSize="lg" mb="20px">Change Password</Text>
      <Flex direction="column" gap="14px" maxW="400px">
        {([['currentPassword', 'Current Password'], ['newPassword', 'New Password'], ['confirmPassword', 'Confirm New Password']] as [keyof PasswordForm, string][]).map(([field, label]) => (
          <FormControl key={field} isInvalid={!!errors[field]}>
            <FormLabel color={labelColor} fontSize="sm">{label}</FormLabel>
            <Input type="password" value={form[field]} onChange={(e) => setForm((p) => ({ ...p, [field]: e.target.value }))} onBlur={() => setTouched((p) => ({ ...p, [field]: true }))} borderRadius="10px" />
            {errors[field] && <FormErrorMessage>{errors[field]}</FormErrorMessage>}
          </FormControl>
        ))}
        <Button colorScheme="brand" size="sm" alignSelf="flex-start" isLoading={saving} onClick={handleSubmit}>Update Password</Button>
      </Flex>
    </Box>
  );
}

export default ChangePasswordForm;
