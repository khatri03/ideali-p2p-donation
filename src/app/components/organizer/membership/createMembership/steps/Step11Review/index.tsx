import React, { useState } from 'react';
import {
  Box, Badge, Button, Flex, Icon, Spinner, Switch, Text,
} from '@chakra-ui/react';
import Loader from 'app/components/common/Loader';
import { MdArrowBack, MdAutoAwesome, MdExitToApp } from 'react-icons/md';
import { useStep11 } from './useStep11';
import PublishConfirmModal from './PublishConfirmModal';

const TENURE_LABEL: Record<number, string> = {
  1: 'Monthly renewal',
  2: 'Annual renewal',
  3: 'Lifetime — no renewal',
  4: 'Custom renewal period',
};

function YesNo({ value }: { value: boolean }) {
  return (
    <Badge
      borderRadius="full"
      px={3}
      py={1}
      fontSize="xs"
      fontWeight="medium"
      display="inline-flex"
      alignItems="center"
      gap={1}
      bg={value ? 'green.50' : 'gray.100'}
      color={value ? 'green.600' : 'gray.500'}
      border="1px solid"
      borderColor={value ? 'green.200' : 'gray.200'}
    >
      {value ? '✓  Yes' : '✗  No'}
    </Badge>
  );
}

function Row({
  label,
  children,
  index,
  isLast,
}: {
  label: string;
  children: React.ReactNode;
  index: number;
  isLast?: boolean;
}) {
  return (
    <Box
      px={{ base: 3, sm: 5 }}
      py={3}
      bg={index % 2 === 0 ? 'white' : 'gray.50'}
      borderBottom={isLast ? 'none' : '1px solid'}
      borderColor="gray.100"
    >
      <Flex
        flexDirection={{ base: 'column', sm: 'row' }}
        align={{ base: 'flex-start', sm: 'center' }}
        gap={{ base: 1, sm: 4 }}
      >
        <Text
          fontSize={{ base: '10px', sm: 'sm' }}
          color={{ base: 'gray.400', sm: 'gray.500' }}
          w={{ base: 'full', sm: '140px', md: '160px' }}
          flexShrink={0}
          fontWeight="medium"
          textTransform={{ base: 'uppercase', sm: 'none' }}
          letterSpacing={{ base: 'wide', sm: 'normal' }}
        >
          {label}
        </Text>
        <Box flex={1} minW={0}>{children}</Box>
      </Flex>
    </Box>
  );
}

interface Step11Props {
  membershipId: string | null;
  onPublished: () => void;
  onPrev?: () => void;
  onSaveAndExit?: () => void;
}

export default function Step11Review({ membershipId, onPublished, onPrev, onSaveAndExit }: Step11Props) {
  const {
    reviewData, isLoading, isPublishing, isAlreadyPublished,
    availableForSignUp, setAvailableForSignUp, isTogglingSignUp,
    publish, saveAndExit,
  } = useStep11({ membershipId, onPublished });

  const [isModalOpen, setIsModalOpen] = useState(false);

  const registrationWindow = !!(
    reviewData?.registrationStartDateUtc || reviewData?.registrationEndDateUtc
  );

  return (
    <Box
      bg="white"
      borderRadius="2xl"
      border="1px solid"
      borderColor="gray.200"
      boxShadow="0 4px 24px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04)"
      overflow="hidden"
    >
      {/* Page header */}
      <Box px={{ base: 3, md: 6 }} pt={6} pb={5}>
        <Text fontSize="10px" fontWeight="bold" color="blue.500"
          textTransform="uppercase" letterSpacing="widest" mb={2}>
          Review Membership
        </Text>
        <Text fontSize="xl" fontWeight="bold" color="gray.900" mb={1}>
          Review Membership Setup
        </Text>
        <Text fontSize="sm" color="gray.400">
          Review the membership setup, confirm the live state, and save the final configuration.
        </Text>
      </Box>

      {/* Table section */}
      <Box px={{ base: 3, md: 6 }} pb={6}>
        {isLoading ? (
          <Loader message="Loading Review" subtitle="Fetching membership setup details..." />
        ) : reviewData ? (
          <Box
            border="1px solid"
            borderColor="gray.200"
            borderRadius="xl"
            overflow="hidden"
          >
            {/* Table header */}
            <Box
              bg="gray.50"
              px={{ base: 3, sm: 5 }}
              py={2.5}
              borderBottom="1px solid"
              borderColor="gray.200"
            >
              <Text fontSize="10px" fontWeight="bold" color="gray.400"
                textTransform="uppercase" letterSpacing="widest">
                Membership Summary
              </Text>
            </Box>

            {/* Are we live? */}
            <Box px={{ base: 3, sm: 5 }} py={3} bg="white" borderBottom="1px solid" borderColor="gray.100">
              <Flex flexDirection={{ base: 'column', sm: 'row' }} align={{ base: 'flex-start', sm: 'center' }} gap={{ base: 2, sm: 4 }}>
                <Text
                  fontSize={{ base: '10px', sm: 'sm' }} color={{ base: 'gray.400', sm: 'gray.500' }}
                  w={{ base: 'full', sm: '140px', md: '160px' }} flexShrink={0} fontWeight="medium"
                  textTransform={{ base: 'uppercase', sm: 'none' }} letterSpacing={{ base: 'wide', sm: 'normal' }}
                >
                  Are we live?
                </Text>
                <Flex flex={1} align="center" justify="space-between" minW={0}>
                  <Box>
                    <Badge
                      borderRadius="full" px={3} py={1} fontSize="xs" fontWeight="medium"
                      bg={isAlreadyPublished ? 'green.50' : 'gray.100'}
                      color={isAlreadyPublished ? 'green.600' : 'gray.500'}
                      border="1px solid" borderColor={isAlreadyPublished ? 'green.200' : 'gray.200'}
                      mb={0.5}
                    >
                      {isAlreadyPublished ? 'Published' : 'Draft'}
                    </Badge>
                    <Text fontSize="xs" color="gray.400" display="block" mt={0.5}>
                      {availableForSignUp ? 'Open for sign-up' : 'Sign-up disabled'}
                    </Text>
                  </Box>
                  <Switch
                    isChecked={availableForSignUp}
                    onChange={(e) => setAvailableForSignUp(e.target.checked)}
                    colorScheme="blue" size="lg" flexShrink={0}
                  />
                </Flex>
              </Flex>
            </Box>

            {/* Membership Title */}
            <Row label="Membership Title" index={1}>
              <Text fontSize="sm" fontWeight="semibold" color="gray.800" noOfLines={2}>
                {reviewData.name}
              </Text>
            </Row>

            {/* Color */}
            <Row label="Color" index={2}>
              <Box
                w="22px"
                h="22px"
                borderRadius="full"
                bg={reviewData.color}
                border="2px solid"
                borderColor="whiteAlpha.600"
                boxShadow="0 0 0 1px rgba(0,0,0,0.12)"
              />
            </Row>

            {/* Payment Account */}
            {reviewData.paymentAccount && (
              <Row label="Payment Account" index={3}>
                <Flex align="center" gap={2} flexWrap="wrap">
                  <Text fontSize="sm" color="gray.800">{reviewData.paymentAccount.name}</Text>
                  <Badge
                    bg="green.50" color="green.700"
                    border="1px solid" borderColor="green.200"
                    borderRadius="full" fontSize="xs" px={2} py={0.5}
                  >
                    {reviewData.paymentAccount.merchant}
                  </Badge>
                  <Badge
                    bg="gray.100" color="gray.600"
                    border="1px solid" borderColor="gray.200"
                    borderRadius="full" fontSize="xs" px={2} py={0.5}
                  >
                    {reviewData.paymentAccount.currency}
                  </Badge>
                </Flex>
              </Row>
            )}

            {/* Pricing */}
            <Row label="Pricing" index={4}>
              {reviewData.isFree ? (
                <Badge bg="green.50" color="green.600" border="1px solid" borderColor="green.200"
                  borderRadius="full" px={3} py={1} fontSize="xs">
                  Free
                </Badge>
              ) : (
                <Flex align="center" gap={2} flexWrap="wrap">
                  <Text fontSize="sm" fontWeight="semibold" color="gray.800">
                    ${reviewData.membershipCharges.toFixed(2)}
                  </Text>
                  {reviewData.tenure && (
                    <Badge
                      bg="gray.100" color="gray.600"
                      border="1px solid" borderColor="gray.200"
                      borderRadius="lg" px={2} py={1} fontSize="xs"
                      whiteSpace="normal"
                    >
                      {TENURE_LABEL[reviewData.tenure]}
                    </Badge>
                  )}
                </Flex>
              )}
            </Row>

            {/* Discount Coupons */}
            <Row label="Discount Coupons" index={5}>
              <YesNo value={reviewData.discountsEnabled} />
            </Row>

            {/* Questions */}
            <Row label="Questions" index={6}>
              <YesNo value={reviewData.hasQuestions} />
            </Row>

            {/* Requires Approval */}
            <Row label="Requires Approval" index={7}>
              <YesNo value={reviewData.requiresApproval} />
            </Row>

            {/* Registration Window */}
            <Row label="Registration Window" index={8} isLast>
              <YesNo value={registrationWindow} />
            </Row>
          </Box>
        ) : (
          <Box py={10} textAlign="center">
            <Text fontSize="sm" color="gray.400">Unable to load review data.</Text>
          </Box>
        )}
      </Box>

      <PublishConfirmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isPublishing={isPublishing}
        onConfirm={async () => {
          await publish(availableForSignUp);
          setIsModalOpen(false);
        }}
      />

      {/* Footer */}
      <Box bg="gray.50" borderTop="1px solid" borderColor="gray.200" px={{ base: 3, md: 6 }} py={{ base: 2, md: 4 }}>
        <Flex justify="space-between" align="center">
          <Button
            variant="outline"
            size="sm"
            minW="auto"
            borderRadius="lg"
            borderColor="gray.300"
            color="gray.700"
            leftIcon={<Icon as={MdArrowBack} />}
            onClick={onPrev}
            _hover={{ bg: 'gray.100' }}
          >
            <Text display={{ base: 'none', sm: 'block' }}>Back</Text>
          </Button>

          <Flex gap={2}>
            {isAlreadyPublished && onSaveAndExit && (
              <Button
                size="sm"
                minW="auto"
                borderRadius="lg"
                px={{ base: 3, md: 4 }}
                variant="outline"
                borderColor="gray.300"
                color="gray.700"
                leftIcon={isTogglingSignUp ? <Spinner size="xs" /> : <Icon as={MdExitToApp} boxSize={3.5} />}
                isLoading={isTogglingSignUp}
                onClick={() => saveAndExit(onSaveAndExit)}
                _hover={{ bg: 'gray.100' }}
              >
                <Text display={{ base: 'none', sm: 'block' }}>Save & Exit</Text>
              </Button>
            )}
            <Button
              size="sm"
              minW="auto"
              borderRadius="lg"
              px={{ base: 3, md: 5 }}
              bg="gray.900"
              color="white"
              leftIcon={<Icon as={MdAutoAwesome} boxSize={3.5} />}
              onClick={() => setIsModalOpen(true)}
              isDisabled={isAlreadyPublished || isLoading}
              _hover={{ bg: 'gray.700' }}
              _active={{ bg: 'black' }}
            >
              <Text display={{ base: 'none', sm: 'block' }}>
                {isAlreadyPublished ? 'Already Published' : 'Save & Publish'}
              </Text>
            </Button>
          </Flex>
        </Flex>
      </Box>
    </Box>
  );
}
