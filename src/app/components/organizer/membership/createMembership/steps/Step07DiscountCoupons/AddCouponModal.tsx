import React, { useState } from 'react';
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
  Icon,
  Input,
  Select,
  Switch,
  Text,
  useToast,
} from '@chakra-ui/react';
import { MdRefresh } from 'react-icons/md';
import { DiscountCoupon } from './useStep07Discounts';

interface AddCouponModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (coupon: Omit<DiscountCoupon, 'id'>) => void;
  initialData?: DiscountCoupon | null;
}

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const generateCode = () =>
  Array.from({ length: 12 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('');

const inputStyle = {
  fontSize: 'sm' as const,
  bg: 'white',
  borderColor: 'gray.300',
  borderRadius: 'lg' as const,
  _focus: { borderColor: '#044bd9', boxShadow: '0 0 0 1px #044bd9' },
  _hover: { borderColor: 'gray.400' },
};

export default function AddCouponModal({ isOpen, onClose, onSave, initialData }: AddCouponModalProps) {
  const toast = useToast();
  const isEditing = !!initialData;

  const [code, setCode] = useState(generateCode());
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed');
  const [maxDiscount, setMaxDiscount] = useState('');
  const [value, setValue] = useState('');
  const [totalCoupons, setTotalCoupons] = useState('100');
  const [availableToUse, setAvailableToUse] = useState(true);

  // Sync fields when modal opens or initialData changes
  React.useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setCode(initialData.code);
        setDiscountType(initialData.discountType);
        setValue(String(initialData.discountValue));
        setMaxDiscount(String(initialData.maxDiscountAmount ?? ''));
        setTotalCoupons(String(initialData.usageLimit ?? 100));
        setAvailableToUse(initialData.isActive ?? true);
      } else {
        setCode(generateCode());
        setDiscountType('fixed');
        setMaxDiscount('');
        setValue('');
        setTotalCoupons('100');
        setAvailableToUse(true);
      }
    }
  }, [isOpen, initialData]);

  const reset = () => {
    setCode(generateCode());
    setDiscountType('fixed');
    setMaxDiscount('');
    setValue('');
    setTotalCoupons('100');
    setAvailableToUse(true);
  };

  const handleAdd = (keepOpen: boolean) => {
    if (!code.trim()) {
      toast({ title: 'Code is required', status: 'error', position: 'top-right' });
      return;
    }
    const discountValue = parseFloat(value);
    if (isNaN(discountValue) || discountValue <= 0) {
      toast({ title: 'Enter a valid discount value', status: 'error', position: 'top-right' });
      return;
    }
    if (discountType === 'percentage' && discountValue > 100) {
      toast({ title: 'Percentage discount value cannot exceed 100', status: 'error', position: 'top-right' });
      return;
    }

    onSave({
      code: code.trim(),
      discountType,
      discountValue,
      maxDiscountAmount: discountType === 'percentage' ? (parseFloat(maxDiscount) || 0) : 0,
      expiryDate: null,
      usageLimit: parseInt(totalCoupons) || null,
      isActive: availableToUse,
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
        <Box px={6} pt={5} pb={4}>
          <Text fontSize="lg" fontWeight="bold" color="gray.900">
            {isEditing ? 'Edit Coupon' : 'Add Discount Coupon'}
          </Text>
          <Text fontSize="xs" color="gray.400" mt={0.5}>
            Create a coupon code for this membership type. Mandatory fields are marked with{' '}
            <Text as="span" color="red.500">*</Text>
          </Text>
        </Box>
        <ModalCloseButton top={4} right={4} size="sm" />

        {/* Body */}
        <Box px={6} pb={5} display="flex" flexDirection="column" gap={4}>

          {/* Code */}
          <FormControl>
            <Flex justify="space-between" align="center" mb={1}>
              <FormLabel fontSize="sm" fontWeight="medium" color="gray.700" mb={0}>
                Code <Text as="span" color="red.500">*</Text>
              </FormLabel>
              <Button
                size="xs"
                variant="ghost"
                color="blue.500"
                leftIcon={<Icon as={MdRefresh} boxSize={3} />}
                onClick={() => setCode(generateCode())}
                fontWeight="normal"
                fontSize="xs"
                px={2}
                _hover={{ bg: 'blue.50' }}
              >
                Generate Random Code
              </Button>
            </Flex>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              {...inputStyle}
            />
          </FormControl>

          {/* Type / Max Discount / Value */}
          <Grid templateColumns="1.2fr 1fr 1fr" gap={3}>
            <FormControl>
              <FormLabel fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>
                Type <Text as="span" color="red.500">*</Text>
              </FormLabel>
              <Select
                value={discountType}
                onChange={(e) => {
                  setDiscountType(e.target.value as 'fixed' | 'percentage');
                  setValue('0');
                }}
                {...inputStyle}
              >
                <option value="fixed">$ — Amount</option>
                <option value="percentage">% — Percentage</option>
              </Select>
              <Text fontSize="10px" color="gray.400" mt={1}>
                {discountType === 'fixed' ? 'Discount by amount' : 'Discount by percentage'}
              </Text>
            </FormControl>

            <FormControl isDisabled={discountType !== 'percentage'}>
              <FormLabel fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>
                Max Discount
              </FormLabel>
              <Input
                type="number"
                placeholder="25"
                value={maxDiscount}
                onChange={(e) => {
                  if (e.target.value.replace('.', '').replace('-', '').length <= 6)
                    setMaxDiscount(e.target.value);
                }}
                {...inputStyle}
              />
              <Text fontSize="10px" color="gray.400" mt={1} lineHeight="1.3">
                Available only for percentage discounts.
              </Text>
            </FormControl>

            <FormControl>
              <FormLabel fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>
                Value <Text as="span" color="red.500">*</Text>
              </FormLabel>
              <Input
                type="number"
                placeholder="0"
                value={value}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (discountType === 'percentage') {
                    const num = parseFloat(raw);
                    if (!isNaN(num) && num > 100) return;
                  } else {
                    if (raw.replace('.', '').replace('-', '').length > 6) return;
                  }
                  setValue(raw);
                }}
                max={discountType === 'percentage' ? 100 : undefined}
                min={0}
                {...inputStyle}
              />
              {discountType === 'percentage' && (
                <Text fontSize="10px" color="gray.400" mt={1}>
                  Percentage discount cannot exceed 100%.
                </Text>
              )}
            </FormControl>
          </Grid>

          {/* Total Coupons / Is Active */}
          <Grid templateColumns="1fr 1fr" gap={3} alignItems="start">
            <FormControl>
              <FormLabel fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>
                Total Coupons <Text as="span" color="red.500">*</Text>
              </FormLabel>
              <Input
                type="number"
                value={totalCoupons}
                onChange={(e) => {
                  if (e.target.value.replace('-', '').length <= 6)
                    setTotalCoupons(e.target.value);
                }}
                min={1}
                {...inputStyle}
              />
            </FormControl>

            <Box>
              <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={2}>
                Is Active
              </Text>
              <Flex align="center" justify="space-between">
                <Text fontSize="sm" color="gray.600">Available to use?</Text>
                <Switch
                  isChecked={availableToUse}
                  onChange={(e) => setAvailableToUse(e.target.checked)}
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
          justify="space-between"
          align="center"
        >
          <Button
            size="sm"
            variant="ghost"
            color="gray.600"
            borderRadius="lg"
            onClick={onClose}
            _hover={{ bg: 'gray.100' }}
          >
            Close
          </Button>
          <Button
            size="sm"
            bg="#044bd9"
            color="white"
            borderRadius="lg"
            px={5}
            onClick={() => handleAdd(false)}
            _hover={{ bg: 'blue.500' }}
            _active={{ bg: '#0235a0' }}
          >
            {isEditing ? 'Save Changes' : 'Add & Close'}
          </Button>
        </Flex>

      </ModalContent>
    </Modal>
  );
}
