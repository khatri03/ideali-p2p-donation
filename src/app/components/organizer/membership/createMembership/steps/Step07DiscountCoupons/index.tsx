import React, { useState } from 'react';
import {
  Box, Flex, Icon, IconButton, Switch, Text, useClipboard, Tooltip,
} from '@chakra-ui/react';
import { MdAdd, MdEdit, MdDelete, MdContentCopy } from 'react-icons/md';
import { useStep07Discounts, DiscountCoupon } from './useStep07Discounts';
import Loader from 'app/components/common/Loader';
import AddCouponModal from './AddCouponModal';
import StepNavButtons from '../../shared/StepNavButtons';
import { hasPermission } from 'app/service/organizer/rolesPermissions/permissionsService';

interface Step07Props {
  membershipId: string | null;
  isEditMode?: boolean;
  onComplete: () => void;
  onPrev?: () => void;
  onSkip?: () => void;
  onSaveAndExit?: () => void;
  isSavingAndExiting?: boolean;
}

function CouponRow({
  coupon,
  index,
  onToggleActive,
  onEdit,
  onRemove,
  isDisabled,
}: {
  coupon: DiscountCoupon;
  index: number;
  onToggleActive: () => void;
  onEdit: () => void;
  onRemove: () => void;
  isDisabled?: boolean;
}) {
  const { onCopy, hasCopied } = useClipboard(coupon.code);
  const isFixed = coupon.discountType === 'fixed';
  const valueLabel = isFixed
    ? `$${coupon.discountValue.toFixed(2)}`
    : `${coupon.discountValue.toFixed(2)}%`;

  const isActive = coupon.isActive === true;

  return (
    <Flex
      align="center"
      px={4}
      py={3}
      bg={index % 2 === 0 ? 'white' : 'gray.50'}
      borderBottom="1px solid"
      borderColor="gray.100"
      gap={3}
      opacity={isActive ? 1 : 0.55}
    >
      {/* Code */}
      <Flex align="center" gap={2} flex="2" minW={0}>
        <Text fontSize="sm" fontWeight="semibold" color="gray.800" noOfLines={1}>
          {coupon.code}
        </Text>
        <Tooltip label={hasCopied ? 'Copied!' : 'Copy code'} placement="top" hasArrow>
          <IconButton
            aria-label="Copy code"
            icon={<Icon as={MdContentCopy} boxSize={3} />}
            size="xs"
            variant="ghost"
            color={hasCopied ? 'green.500' : 'gray.400'}
            borderRadius="md"
            onClick={onCopy}
            _hover={{ bg: 'gray.100', color: 'gray.600' }}
          />
        </Tooltip>
      </Flex>

      {/* Type badge — hidden on mobile */}
      <Flex flex="1" justify="center" display={{ base: 'none', sm: 'flex' }}>
        <Flex
          w="28px"
          h="28px"
          borderRadius="full"
          bg="gray.100"
          border="1px solid"
          borderColor="gray.200"
          align="center"
          justify="center"
        >
          <Text fontSize="xs" fontWeight="bold" color="gray.600">
            {isFixed ? '$' : '%'}
          </Text>
        </Flex>
      </Flex>

      {/* Value */}
      <Text flex="1" fontSize="sm" color="gray.700" fontWeight="medium">
        {valueLabel}
      </Text>

      {/* Active toggle */}
      <Flex flex="1" justify="center">
        <Switch
          isChecked={isActive}
          onChange={onToggleActive}
          isDisabled={isDisabled}
          colorScheme="teal"
          size="md"
        />
      </Flex>

      {/* Actions */}
      <Flex flex="1" justify="flex-end" gap={1.5}>
        {hasPermission('discount:coupon:edit') && (
          <IconButton
            aria-label="Edit coupon"
            icon={<Icon as={MdEdit} boxSize={3.5} />}
            size="sm"
            variant="outline"
            borderRadius="full"
            borderColor="blue.300"
            color="blue.400"
            bg="blue.50"
            _hover={{ borderColor: 'blue.500', color: 'white', bg: 'blue.400' }}
            _active={{ bg: 'blue.500' }}
            transition="all 0.15s"
            onClick={onEdit}
          />
        )}
        {hasPermission('discount:coupon:delete') && (
          <IconButton
            aria-label="Delete coupon"
            icon={<Icon as={MdDelete} boxSize={3.5} />}
            size="sm"
            variant="outline"
            borderRadius="full"
            borderColor="red.300"
            color="red.400"
            bg="red.50"
            _hover={{ borderColor: 'red.500', color: 'white', bg: 'red.400' }}
            _active={{ bg: 'red.500' }}
            transition="all 0.15s"
            onClick={onRemove}
          />
        )}
      </Flex>
    </Flex>
  );
}

export default function Step07DiscountCoupons({
  membershipId,
  isEditMode,
  onComplete,
  onPrev,
  onSkip,
  onSaveAndExit,
  isSavingAndExiting,
}: Step07Props) {
  const {
    discountsEnabled, setDiscountsEnabled,
    coupons, addCoupon, removeCoupon, updateCoupon,
    isLoading, isSubmitting, submit, saveAndExit,
  } = useStep07Discounts({ membershipId, isEditMode, onComplete });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<DiscountCoupon | null>(null);

  const openAdd = () => { setEditingCoupon(null); setIsModalOpen(true); };
  const openEdit = (c: DiscountCoupon) => { setEditingCoupon(c); setIsModalOpen(true); };
  const closeModal = () => { setIsModalOpen(false); setEditingCoupon(null); };

  const handleSave = (coupon: Omit<DiscountCoupon, 'id'>) => {
    if (editingCoupon) {
      updateCoupon(editingCoupon.id, coupon);
    } else {
      addCoupon(coupon);
    }
    closeModal();
  };

  const toggleActive = (id: number) => {
    const coupon = coupons.find((c) => c.id === id);
    if (coupon) updateCoupon(id, { isActive: !coupon.isActive });
  };

  const canViewCoupons = hasPermission('discount:coupon:view');
  const canCreateCoupon = hasPermission('discount:coupon:create');

  return (
    <Box
      bg="white"
      borderRadius="2xl"
      border="1px solid"
      borderColor="gray.200"
      boxShadow="0 4px 24px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04)"
      overflow="hidden"
    >
      <Box px={{ base: 3, md: 6 }} pt={6} pb={5}>
        {isLoading && <Loader message="Loading Coupons" subtitle="Fetching saved discount coupons..." />}
        {!isLoading && <>
        {/* Header */}
        <Text fontSize="xl" fontWeight="bold" color="gray.900" mb={1}>
          Discount Coupons
        </Text>
        <Text fontSize="sm" color="gray.400" mb={6}>
          Introduce promotional coupons before members continue to the questions step.
        </Text>

        {/* Enable Discounts toggle */}
        <Box border="1px solid" borderColor="gray.200" borderRadius="xl" px={4} py={4} mb={4}>
          <Flex justify="space-between" align="center">
            <Box>
              <Text fontSize="sm" fontWeight="semibold" color="gray.800">
                Want To Enable Discounts?
              </Text>
              <Text fontSize="xs" color="gray.400" mt={0.5}>
                {coupons.length === 0
                  ? 'Add a coupon below before you can enable discounts.'
                  : 'Make membership discounts available for this plan.'}
              </Text>
            </Box>
            <Switch
              isChecked={discountsEnabled}
              onChange={(e) => setDiscountsEnabled(e.target.checked)}
              isDisabled={coupons.length === 0}
              colorScheme="blue"
              size="lg"
            />
          </Flex>
        </Box>

        {/* Available Coupons card */}
        {canViewCoupons && (
        <Box border="1px solid" borderColor="gray.200" borderRadius="xl" overflow="hidden">

          {/* Card header */}
          <Flex justify="space-between" align="center" px={4} py={3}>
            <Box>
              <Text fontSize="sm" fontWeight="semibold" color="gray.800">Available Coupons</Text>
              <Text fontSize="xs" color="gray.400" mt={0.5}>
                Create coupons here, then enable discounts above to use them.
              </Text>
            </Box>
            {canCreateCoupon && (
              <IconButton
                aria-label="Add coupon"
                icon={<Icon as={MdAdd} boxSize={4} />}
                size="sm"
                variant="outline"
                borderRadius="full"
                borderColor="gray.300"
                color="gray.600"
                onClick={openAdd}
                _hover={{ borderColor: '#044bd9', color: '#044bd9', bg: 'blue.50' }}
              />
            )}
          </Flex>

          {coupons.length === 0 ? (
            <Flex justify="center" align="center" py={8} borderTop="1px solid" borderColor="gray.100">
              <Text fontSize="sm" color="gray.400">
                No discount coupons have been created yet.
              </Text>
            </Flex>
          ) : (
            <>
              {/* Table header */}
              <Flex
                px={4}
                py={2}
                bg="gray.50"
                borderTop="1px solid"
                borderBottom="1px solid"
                borderColor="gray.100"
                gap={3}
              >
                <Text flex="2" fontSize="10px" fontWeight="bold" color="gray.400" textTransform="uppercase" letterSpacing="wide">Code</Text>
                <Text flex="1" fontSize="10px" fontWeight="bold" color="gray.400" textTransform="uppercase" letterSpacing="wide" textAlign="center" display={{ base: 'none', sm: 'block' }}>Type</Text>
                <Text flex="1" fontSize="10px" fontWeight="bold" color="gray.400" textTransform="uppercase" letterSpacing="wide">Value</Text>
                <Text flex="1" fontSize="10px" fontWeight="bold" color="gray.400" textTransform="uppercase" letterSpacing="wide" textAlign="center">Active</Text>
                <Text flex="1" fontSize="10px" fontWeight="bold" color="gray.400" textTransform="uppercase" letterSpacing="wide" textAlign="right">Actions</Text>
              </Flex>

              <Box maxH="260px" overflowY="auto" sx={{ '::-webkit-scrollbar': { width: '4px' }, '::-webkit-scrollbar-thumb': { bg: 'gray.300', borderRadius: 'full' } }}>
              {coupons.map((coupon, i) => (
                <CouponRow
                  key={coupon.id}
                  coupon={coupon}
                  index={i}
                  onToggleActive={() => toggleActive(coupon.id)}
                  onEdit={() => openEdit(coupon)}
                  onRemove={() => removeCoupon(coupon.id)}
                  isDisabled={!discountsEnabled}
                />
              ))}
              </Box>
            </>
          )}
        </Box>
        )}
        </>}
      </Box>

      <StepNavButtons
        onNext={submit}
        onPrev={onPrev}
        onSkip={onSkip}
        showSkip
        onSaveAndExit={onSaveAndExit ? () => saveAndExit(onSaveAndExit) : undefined}
        isSavingAndExiting={isSavingAndExiting}
        isSubmitting={isSubmitting}
      />

      <AddCouponModal
        isOpen={isModalOpen}
        onClose={closeModal}
        initialData={editingCoupon}
        onSave={handleSave}
      />
    </Box>
  );
}
