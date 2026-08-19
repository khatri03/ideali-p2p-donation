import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalCloseButton,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  Input,
  Select,
  Switch,
  Text,
  useToast,
} from '@chakra-ui/react';
import membershipWizardService from '../../../services/membershipWizardService';
import { MembershipListItem } from '../../../types';

export interface UpgradePath {
  id: number;
  uniqueId?: string;
  toMembershipUniqueId: string;
  toMembershipName: string;
  chargeRule: 'full_price' | 'fixed_amount' | 'no_charge';
  fixedAmount: number;
  requiresApproval: boolean;
  isActive: boolean;
}

interface AddUpgradePathModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (path: Omit<UpgradePath, 'id'>) => void;
  initialData?: UpgradePath | null;
  currentMembershipId: string | null;
}

const inputStyle = {
  fontSize: 'sm' as const,
  bg: 'white',
  borderColor: 'gray.300',
  borderRadius: 'lg' as const,
  _focus: { borderColor: '#044bd9', boxShadow: '0 0 0 1px #044bd9' },
  _hover: { borderColor: 'gray.400' },
};

const CHARGE_RULE_LABELS: Record<UpgradePath['chargeRule'], string> = {
  full_price: 'Full price',
  fixed_amount: 'Fixed amount',
  no_charge: 'No charge',
};

export { CHARGE_RULE_LABELS };

export default function AddUpgradePathModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  currentMembershipId,
}: AddUpgradePathModalProps) {
  const toast = useToast();
  const isEditing = !!initialData;

  const [memberships, setMemberships] = useState<MembershipListItem[]>([]);
  const [toMembershipUniqueId, setToMembershipUniqueId] = useState('');
  const [chargeRule, setChargeRule] = useState<UpgradePath['chargeRule']>('full_price');
  const [fixedAmount, setFixedAmount] = useState('0.00');
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    membershipWizardService.getMembershipList()
      .then((list: any[]) => setMemberships(list.filter((m) => m.uniqueId !== currentMembershipId)))
      .catch(() => {});
  }, [currentMembershipId]);

  const reset = () => {
    setToMembershipUniqueId('');
    setChargeRule('full_price');
    setFixedAmount('0.00');
    setRequiresApproval(false);
    setIsActive(true);
  };

  useEffect(() => {
    if (!isOpen) return;
    if (initialData) {
      setToMembershipUniqueId(initialData.toMembershipUniqueId);
      setChargeRule(initialData.chargeRule);
      setFixedAmount(String(initialData.fixedAmount));
      setRequiresApproval(initialData.requiresApproval);
      setIsActive(initialData.isActive);
    } else {
      reset();
    }
  }, [isOpen, initialData]);

  const handleSave = (keepOpen: boolean) => {
    if (!toMembershipUniqueId) {
      toast({ title: 'Select a target membership', status: 'error', position: 'top-right' });
      return;
    }
    const amount = parseFloat(fixedAmount);
    if (chargeRule === 'fixed_amount' && (isNaN(amount) || amount < 0)) {
      toast({ title: 'Enter a valid fixed amount', status: 'error', position: 'top-right' });
      return;
    }
    const target = memberships.find((m) => m.uniqueId === toMembershipUniqueId);
    onSave({
      toMembershipUniqueId,
      toMembershipName: target?.name ?? '',
      chargeRule,
      fixedAmount: chargeRule === 'fixed_amount' ? amount : 0,
      requiresApproval,
      isActive,
    });
    if (keepOpen) {
      reset();
    } else {
      onClose();
      reset();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="xl">
      <ModalOverlay bg="blackAlpha.500" />
      <ModalContent borderRadius="2xl" mx={4} overflow="hidden">

        {/* Header */}
        <Box px={6} pt={5} pb={4} borderBottom="1px solid" borderColor="gray.100">
          <Text fontSize="10px" fontWeight="bold" color="teal.500" textTransform="uppercase" letterSpacing="wider" mb={1}>
            Membership Upgrade Paths
          </Text>
          <Text fontSize="lg" fontWeight="bold" color="gray.900">
            {isEditing ? 'Edit upgrade path' : 'Add or update upgrade path'}
          </Text>
          <Text fontSize="sm" color="gray.600" mt={0.5}>
            Add a new draft mapping to the list.
          </Text>
        </Box>
        <ModalCloseButton top={4} right={4} size="sm" />

        {/* Body */}
        <Box px={6} py={5} display="flex" flexDirection="column" gap={4}>

          {/* To membership */}
          <FormControl>
            <FormLabel fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>
              To membership <Text as="span" color="red.500">*</Text>
            </FormLabel>
            <Select
              value={toMembershipUniqueId}
              onChange={(e) => setToMembershipUniqueId(e.target.value)}
              placeholder="Select membership type"
              {...inputStyle}
            >
              {memberships.map((m) => (
                <option key={m.uniqueId} value={m.uniqueId}>{m.name}</option>
              ))}
            </Select>
          </FormControl>

          {/* Charge rule / Fixed upgrade amount */}
          <Grid templateColumns="1fr 1fr" gap={3}>
            <FormControl>
              <FormLabel fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>
                Charge rule <Text as="span" color="red.500">*</Text>
              </FormLabel>
              <Select
                value={chargeRule}
                onChange={(e) => setChargeRule(e.target.value as UpgradePath['chargeRule'])}
                {...inputStyle}
              >
                <option value="full_price">Full price</option>
                <option value="fixed_amount">Fixed amount</option>
                <option value="no_charge">No charge</option>
              </Select>
            </FormControl>

            <FormControl isDisabled={chargeRule !== 'fixed_amount'}>
              <FormLabel fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>
                Fixed upgrade amount
              </FormLabel>
              <Input
                type="number"
                placeholder="0.00"
                value={fixedAmount}
                onChange={(e) => setFixedAmount(e.target.value)}
                {...inputStyle}
              />
            </FormControl>
          </Grid>

          {/* Requires approval / Active toggles */}
          <Grid templateColumns="1fr 1fr" gap={3}>
            <Box border="1px solid" borderColor="gray.200" borderRadius="xl" px={4} py={3}>
              <Flex align="center" justify="space-between">
                <Text fontSize="sm" fontWeight="medium" color="gray.700">Requires approval</Text>
                <Switch
                  isChecked={requiresApproval}
                  onChange={(e) => setRequiresApproval(e.target.checked)}
                  colorScheme="blue"
                  size="md"
                />
              </Flex>
            </Box>
            <Box border="1px solid" borderColor="gray.200" borderRadius="xl" px={4} py={3}>
              <Flex align="center" justify="space-between">
                <Text fontSize="sm" fontWeight="medium" color="gray.700">Active</Text>
                <Switch
                  isChecked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  colorScheme="blue"
                  size="md"
                />
              </Flex>
            </Box>
          </Grid>

        </Box>

        {/* Footer */}
        <Flex
          px={6}
          py={4}
          borderTop="1px solid"
          borderColor="gray.100"
          justify="flex-end"
          align="center"
          gap={2}
        >
          {!isEditing && (
            <Button
              size="sm"
              variant="outline"
              borderColor="#044bd9"
              color="#044bd9"
              borderRadius="full"
              px={5}
              onClick={() => handleSave(true)}
              _hover={{ bg: 'blue.50' }}
            >
              Add & Continue
            </Button>
          )}
          <Button
            size="sm"
            bg="#044bd9"
            color="white"
            borderRadius="full"
            px={5}
            onClick={() => handleSave(false)}
            _hover={{ bg: 'blue.500' }}
            _active={{ bg: '#0235a0' }}
          >
            {isEditing ? 'Save Changes' : 'Add & Close'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            borderColor="gray.300"
            color="gray.600"
            borderRadius="full"
            px={5}
            onClick={onClose}
            _hover={{ bg: 'gray.50' }}
          >
            Close
          </Button>
        </Flex>

      </ModalContent>
    </Modal>
  );
}
