import { Box, Button, Divider, Flex, Icon, Text, useColorModeValue, useToast } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { MdCreditCard, MdDelete } from 'react-icons/md';
import Loader from 'app/components/common/Loader';
import HttpClient from 'app/service/httpClient/HttpClient';

interface SavedPaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

function PaymentMethods({ onAddNew }: { onAddNew: () => void }) {
  const [methods, setMethods] = useState<SavedPaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'navy.800');
  const textColor = useColorModeValue('#1B2559', 'white');
  const subColor = useColorModeValue('#A3AED0', '#A3AED0');
  const dividerColor = useColorModeValue('gray.100', 'whiteAlpha.100');

  useEffect(() => {
    HttpClient.get<{ data: SavedPaymentMethod[]; success: boolean }>('/api/member/me/payment-methods').then((res) => {
      if (res.data.success) setMethods(res.data.data);
      setLoading(false);
    });
  }, []);

  const handleRemove = async (id: string) => {
    setRemoving(id);
    try {
      const res = await HttpClient.delete<{ success: boolean }>(`/api/member/me/payment-methods/${id}`);
      if (res.data.success) { setMethods((p) => p.filter((m) => m.id !== id)); toast({ title: 'Removed.', status: 'success', duration: 3000 }); }
    } catch { toast({ title: 'Failed to remove.', status: 'error', duration: 3000 }); }
    finally { setRemoving(null); }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await HttpClient.post(`/api/member/me/payment-methods/${id}/set-default`);
      setMethods((p) => p.map((m) => ({ ...m, isDefault: m.id === id })));
    } catch { toast({ title: 'Failed to set default.', status: 'error', duration: 3000 }); }
  };

  return (
    <Box bg={cardBg} borderRadius="20px" p="24px">
      <Flex justify="space-between" align="center" mb="20px">
        <Text color={textColor} fontWeight="700" fontSize="lg">Payment Methods</Text>
        <Button size="sm" colorScheme="brand" onClick={onAddNew}>+ Add New</Button>
      </Flex>
      {loading ? <Loader message="Loading payment methods…" subtitle="Please wait while we fetch your saved cards" />
        : methods.length === 0 ? <Text color={subColor} textAlign="center" py="24px" fontSize="sm">No payment methods saved.</Text>
        : methods.map((m, i) => (
          <Box key={m.id}>
            <Flex align="center" gap="12px" py="14px">
              <Box bg="brand.50" borderRadius="10px" w="40px" h="40px" display="flex" alignItems="center" justifyContent="center">
                <Icon as={MdCreditCard} color="brand.500" w="20px" h="20px" />
              </Box>
              <Box flex="1">
                <Text color={textColor} fontWeight="600" fontSize="sm">
                  {m.brand} •••• {m.last4}
                  {m.isDefault && <Text as="span" color="brand.500" fontSize="xs" ml="8px" fontWeight="700">Default</Text>}
                </Text>
                <Text color={subColor} fontSize="xs">Expires {m.expMonth}/{m.expYear}</Text>
              </Box>
              <Flex gap="8px">
                {!m.isDefault && <Button size="xs" variant="outline" colorScheme="brand" onClick={() => handleSetDefault(m.id)}>Set Default</Button>}
                <Button size="xs" variant="ghost" colorScheme="red" isLoading={removing === m.id} onClick={() => handleRemove(m.id)}><Icon as={MdDelete} /></Button>
              </Flex>
            </Flex>
            {i < methods.length - 1 && <Divider borderColor={dividerColor} />}
          </Box>
        ))}
    </Box>
  );
}

export default PaymentMethods;
