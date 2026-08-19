import React, { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Flex,
  Icon,
  useDisclosure,
  useToast,
  SimpleGrid,
  Spinner,
  Text,
} from '@chakra-ui/react';
import {
  MdArrowBack,
  MdCheckCircleOutline,
  MdEmail,
  MdLocationOn,
  MdPhone,
  MdCancel,
  MdVerified,
} from 'react-icons/md';
import { useNavigate, useSearchParams } from 'react-router-dom';
import memberProfileService, {
  MemberCustomFormItem,
  MemberCustomFormDetailResponse,
  MemberProfileResponse,
} from '../../services/memberProfileService';
import MemberProfileHeader from '../../memberProfile/MemberProfileHeader';
import MemberProfileStats from '../../memberProfile/MemberProfileStats';
import MemberProfileTabs, {
  MemberProfileTabItem,
} from '../../memberProfile/MemberProfileTabs';
import ProfileDetailSection from '../../memberProfile/ProfileDetailSection';
import MembershipHistorySection from '../../memberProfile/MembershipHistorySection';
import CustomQuestionsSection from '../../memberProfile/CustomQuestionsSection';
import MemberCustomFormView from '../../memberProfile/MemberCustomFormView';
import {
  ApproveMemberModal,
  RejectMemberModal,
} from '../../memberProfile/MemberProfileApprovalModals';
import { hasPermission } from 'app/service/organizer/rolesPermissions/permissionsService';

function formatDateTime(value: string | null | undefined) {
  if (!value) return 'Not provided';
  const d = new Date(value);
  return (
    d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }) +
    ', ' +
    d
      .toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
      .toLowerCase()
  );
}

function formatText(value: string | null | undefined) {
  return value && value.trim() ? value : 'Not provided';
}

function formatExpiryDisplay(
  startUtc: string | null | undefined,
  expiryUtc: string | null | undefined,
) {
  const startMs = startUtc ? new Date(startUtc).getTime() : NaN;
  const expiryMs = new Date(expiryUtc ?? '').getTime();

  if (!Number.isNaN(startMs) && !Number.isNaN(expiryMs)) {
    const diffDays = Math.floor((expiryMs - startMs) / (1000 * 60 * 60 * 24));
    if (diffDays >= 100) return 'Lifetime';
  }

  return formatDateTime(expiryUtc);
}

function formatFullName(contact: MemberProfileResponse['contact']) {
  return [
    contact.prefix,
    contact.firstName,
    contact.middleName,
    contact.lastName,
  ]
    .filter((part): part is string => !!part && part.trim().length > 0)
    .join(' ')
    .trim();
}

function resolveImageUrl(photoUrl: string | null | undefined) {
  if (!photoUrl) return '';
  if (/^https?:\/\//i.test(photoUrl)) return photoUrl;
  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? '';
  return `${baseUrl}${photoUrl}`;
}

function toQuestionValue(
  item: MemberProfileResponse['customQuestionResponses'][number],
) {
  if (
    item.value !== null &&
    item.value !== undefined &&
    String(item.value).trim() !== ''
  ) {
    return String(item.value);
  }
  if (item.optionLabel) return item.optionLabel;
  if (item.fileOriginalFileName) return item.fileOriginalFileName;
  return 'Not provided';
}

function resolveInvoiceUniqueId(profile: MemberProfileResponse | null) {
  const invoiceUniqueId =
    profile?.invoice?.invoiceUniqueId ??
    profile?.invoiceUniqueId ??
    profile?.membershipHistory?.find((item) => item.invoiceUniqueId)
      ?.invoiceUniqueId ??
    null;

  return invoiceUniqueId && invoiceUniqueId.trim() ? invoiceUniqueId : null;
}

export default function MemberProfilePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const uniqueId =
    searchParams.get('uniqueId') ??
    searchParams.get('memberUniqueId') ??
    searchParams.get('memberId') ??
    '';

  const [profile, setProfile] = useState<MemberProfileResponse | null>(null);
  const [customForms, setCustomForms] = useState<MemberCustomFormItem[]>([]);
  const [customFormDetails, setCustomFormDetails] = useState<
    Record<string, MemberCustomFormDetailResponse>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTabKey, setActiveTabKey] = useState('member-detail');
  const [activeFormLoading, setActiveFormLoading] = useState(false);
  const [activeFormError, setActiveFormError] = useState<string | null>(null);
  const [isActionSubmitting, setIsActionSubmitting] = useState(false);
  const approveModal = useDisclosure();
  const rejectModal = useDisclosure();

  useEffect(() => {
    if (!uniqueId) {
      setError('Member unique ID is missing from the URL.');
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    Promise.all([
      memberProfileService.getMemberProfile(uniqueId),
      memberProfileService.getMemberCustomForms(uniqueId),
    ])
      .then(([profileResponse, formsResponse]) => {
        if (!isMounted) return;
        setProfile(profileResponse.data?.data ?? null);
        setCustomForms(
          (formsResponse.data?.data ?? [])
            .slice()
            .sort((a, b) => a.displayOrder - b.displayOrder),
        );
      })
      .catch(() => {
        if (!isMounted) return;
        setProfile(null);
        setCustomForms([]);
        setError('Failed to load member profile.');
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [uniqueId]);

  const fullName = useMemo(() => {
    if (!profile) return 'Member profile';
    return formatFullName(profile.contact) || 'Member profile';
  }, [profile]);

  const avatarUrl = resolveImageUrl(profile?.profile?.photoUrl);

  const contactItems = useMemo(
    () => [
      { label: 'Name', value: fullName, icon: MdVerified },
      {
        label: 'Email',
        value: formatText(profile?.contact.email),
        icon: MdEmail,
      },
      {
        label: 'Phone',
        value: formatText(profile?.contact.cellPhone),
        icon: MdPhone,
      },
    ],
    [fullName, profile],
  );

  const addressItems = useMemo(
    () => [
      {
        label: 'Address Line 1',
        value: formatText(profile?.address.streetLine1),
        icon: MdLocationOn,
      },
      {
        label: 'Address Line 2',
        value: formatText(profile?.address.streetLine2),
        icon: MdLocationOn,
      },
      {
        label: 'Type',
        value: formatText(profile?.address.type),
        icon: MdLocationOn,
      },
      {
        label: 'City',
        value: formatText(profile?.address.city),
        icon: MdLocationOn,
      },
      {
        label: 'State',
        value: formatText(profile?.address.state),
        icon: MdLocationOn,
      },
      {
        label: 'Country',
        value: formatText(profile?.address.country),
        icon: MdLocationOn,
      },
      {
        label: 'Zip/Postal Code',
        value: formatText(profile?.address.zipCode),
        icon: MdLocationOn,
      },
    ],
    [profile],
  );

  const historyRows = useMemo(
    () =>
      (profile?.membershipHistory ?? []).map((item) => ({
        membershipType: item.membershipName,
        expiry: formatDateTime(item.membershipExpiryUtc),
        invoiceNo: item.invoiceNo,
      })),
    [profile],
  );

  const customQuestions = useMemo(
    () =>
      (profile?.customQuestionResponses ?? []).map((item) => ({
        label: item.questionLabel,
        value: toQuestionValue(item),
      })),
    [profile],
  );

  const tabs = useMemo<MemberProfileTabItem[]>(
    () => [
      { key: 'member-detail', label: 'Member Detail' },
      ...customForms.map((form) => ({
        key: form.formUniqueId,
        label: form.formName,
      })),
    ],
    [customForms],
  );

  useEffect(() => {
    if (!tabs.length) return;
    if (!tabs.some((tab) => tab.key === activeTabKey)) {
      setActiveTabKey('member-detail');
    }
  }, [tabs, activeTabKey]);

  useEffect(() => {
    if (!profile || activeTabKey === 'member-detail') {
      setActiveFormLoading(false);
      setActiveFormError(null);
      return;
    }

    if (customFormDetails[activeTabKey]) {
      setActiveFormLoading(false);
      setActiveFormError(null);
      return;
    }

    let isMounted = true;
    setActiveFormLoading(true);
    setActiveFormError(null);

    memberProfileService
      .getMemberCustomFormDetail(uniqueId, activeTabKey)
      .then((response) => {
        if (!isMounted) return;
        const detail = response.data?.data ?? null;
        if (!detail) {
          setActiveFormError('No custom form data found.');
          return;
        }
        setCustomFormDetails((prev) => ({
          ...prev,
          [detail.formUniqueId]: detail,
        }));
      })
      .catch(() => {
        if (!isMounted) return;
        setActiveFormError('Failed to load custom form.');
      })
      .finally(() => {
        if (!isMounted) return;
        setActiveFormLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeTabKey, customFormDetails, profile, uniqueId]);

  const subtitle = profile
    ? 'Review the member profile, membership status, and submitted registration responses in one place.'
    : 'Review the member profile, membership status, and submitted registration responses in one place.';

  const isPendingApproval = useMemo(() => {
    const status = profile?.membership.membershipStatus ?? '';
    return status.replace(/\s+/g, '').toLowerCase() === 'pendingapproval';
  }, [profile]);

  const canApprove = hasPermission('membership:member:approved');
  const canReject = hasPermission('membership:member:rejected');

  const handleApproveMember = async () => {
    if (!profile || isActionSubmitting) return;
    setIsActionSubmitting(true);
    try {
      await memberProfileService.approveMember(profile.uniqueId);
      toast({
        title: 'Member approved',
        status: 'success',
        position: 'top-right',
      });
      setTimeout(() => window.location.reload(), 350);
    } catch {
      toast({
        title: 'Failed to approve member',
        status: 'error',
        position: 'top-right',
      });
    } finally {
      setIsActionSubmitting(false);
    }
  };

  const handleRejectMember = async (reason: string) => {
    if (!profile || isActionSubmitting) return;

    const invoiceUniqueId = resolveInvoiceUniqueId(profile);
    if (!invoiceUniqueId) {
      toast({
        title: 'Invoice ID not found',
        description: 'Unable to refund this member because the invoice ID is missing.',
        status: 'error',
        position: 'top-right',
      });
      return;
    }

    setIsActionSubmitting(true);
    try {
      await memberProfileService.rejectMember(profile.uniqueId, reason);
      try {
        await memberProfileService.refundMemberPayment({
          invoiceUniqueId,
          reason,
        });
      } catch {
        toast({
          title: 'Member rejected, refund failed',
          description:
            'The member was rejected, but the refund request did not complete.',
          status: 'error',
          position: 'top-right',
        });
        return;
      }

      rejectModal.onClose();
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              membership: {
                ...prev.membership,
                membershipStatus: 'Rejected',
              },
            }
          : prev,
      );
      toast({
        title: 'Member rejected and refund processed',
        description: 'The member was rejected and the payment was refunded successfully.',
        status: 'success',
        position: 'top-right',
      });
    } catch {
      toast({
        title: 'Failed to reject member',
        status: 'error',
        position: 'top-right',
      });
    } finally {
      setIsActionSubmitting(false);
    }
  };

  const activeForm =
    customForms.find((form) => form.formUniqueId === activeTabKey) ?? null;
  const activeFormDetail = customFormDetails[activeTabKey] ?? null;

  if (isLoading) {
    return (
      <Box minH="100vh" bg="gray.50" pt={4} pb={8}>
        <Box mx={{ base: 2, md: 4 }}>
          <Button
            size="sm"
            variant="outline"
            borderRadius="full"
            leftIcon={<Icon as={MdArrowBack} />}
            onClick={() => navigate('/organizer/membership/members')}
            mt={{ base: 6, md: 10 }}
            mb={3}
          >
            Back to members
          </Button>

          <Box
            bg="white"
            border="1px solid"
            borderColor="gray.200"
            borderRadius="2xl"
            p={6}
            boxShadow="sm"
          >
            <Flex align="center" gap={3}>
              <Spinner color="#044bd9" />
              <Text fontSize="sm" color="gray.600">
                Loading member profile...
              </Text>
            </Flex>
          </Box>
        </Box>
      </Box>
    );
  }

  if (error || !profile) {
    return (
      <Box minH="100vh" bg="gray.50" pt={4} pb={8}>
        <Box mx={{ base: 2, md: 4 }}>
          <Button
            size="sm"
            variant="outline"
            borderRadius="full"
            leftIcon={<Icon as={MdArrowBack} />}
            onClick={() => navigate('/organizer/membership/members')}
            mt={{ base: 6, md: 10 }}
            mb={3}
          >
            Back to members
          </Button>

          <Box
            bg="white"
            border="1px solid"
            borderColor="red.200"
            borderRadius="2xl"
            p={6}
            boxShadow="sm"
          >
            <Text fontSize="sm" fontWeight="700" color="red.500" mb={1}>
              Member profile unavailable
            </Text>
            <Text fontSize="sm" color="gray.600">
              {error ?? 'No member profile data found.'}
            </Text>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="gray.50" pt={4} pb={8}>
      <Box mx={{ base: 2, md: 4 }}>
        <Button
          size="sm"
          variant="outline"
          borderRadius="full"
          leftIcon={<Icon as={MdArrowBack} />}
          onClick={() => navigate('/organizer/membership/members')}
          mt={{ base: 6, md: 10 }}
          mb={3}
        >
          Back to members
        </Button>

        <MemberProfileHeader
          name={fullName}
          avatarUrl={avatarUrl}
          subtitle={subtitle}
          memberId={profile.uniqueId}
          actions={
            isPendingApproval ? (
              <Flex gap={3} wrap="wrap" justify="flex-end">
                {canApprove && (
                  <Button
                    size="sm"
                    borderRadius="full"
                    bg="green.500"
                    color="white"
                    leftIcon={<Icon as={MdCheckCircleOutline} />}
                    _hover={{ bg: 'green.600' }}
                    _active={{ bg: 'green.700' }}
                    onClick={approveModal.onOpen}
                  >
                    Approve
                  </Button>
                )}
                {canReject && (
                  <Button
                    size="sm"
                    borderRadius="full"
                    variant="outline"
                    color="red.500"
                    borderColor="red.200"
                    leftIcon={<Icon as={MdCancel} />}
                    _hover={{ bg: 'red.50' }}
                    onClick={rejectModal.onOpen}
                  >
                    Reject
                  </Button>
                )}
              </Flex>
            ) : null
          }
        />

        <MemberProfileStats
          activeMembership={profile.membership.activeMembershipName}
          status={profile.membership.membershipStatus}
          memberSince={formatDateTime(profile.membership.membershipStartUtc)}
          expireAt={formatExpiryDisplay(
            profile.membership.membershipStartUtc,
            profile.membership.membershipExpiryUtc,
          )}
        />

        <MemberProfileTabs
          tabs={tabs}
          activeTabKey={activeTabKey}
          onTabChange={setActiveTabKey}
        />

        {activeTabKey === 'member-detail' ? (
          <>
            <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={4} mt={4}>
              <ProfileDetailSection
                title="Profile and contact"
                description="Core member contact details collected during registration."
                items={contactItems}
                addressItems={addressItems}
              />
              <MembershipHistorySection rows={historyRows} />
            </SimpleGrid>

            <Box mt={4}>
              <CustomQuestionsSection questions={customQuestions} />
            </Box>

            <Box
              mt={4}
              bg="white"
              border="1px solid"
              borderColor="gray.200"
              borderRadius="xl"
              p={4}
              boxShadow="sm"
            >
              <Text fontSize="sm" fontWeight="700" color="gray.800" mb={1}>
                Membership notes
              </Text>
              <Badge
                bg="gray.100"
                color="gray.700"
                borderRadius="md"
                px={2.5}
                py={1}
                fontSize="xs"
              >
                {formatText(profile.membership.notes)}
              </Badge>
            </Box>
          </>
        ) : activeFormLoading ? (
          <Box
            mt={4}
            bg="white"
            border="1px solid"
            borderColor="gray.200"
            borderRadius="xl"
            p={5}
            boxShadow="sm"
          >
            <Flex align="center" gap={3}>
              <Spinner color="#044bd9" size="sm" />
              <Text fontSize="sm" color="gray.600">
                Loading custom form...
              </Text>
            </Flex>
          </Box>
        ) : activeFormError ? (
          <Box
            mt={4}
            bg="white"
            border="1px solid"
            borderColor="red.200"
            borderRadius="xl"
            p={5}
            boxShadow="sm"
          >
            <Text fontSize="sm" fontWeight="700" color="red.500" mb={1}>
              Custom form unavailable
            </Text>
            <Text fontSize="sm" color="gray.600">
              {activeFormError}
            </Text>
          </Box>
        ) : activeFormDetail ? (
          <MemberCustomFormView form={activeFormDetail} />
        ) : (
          <Box
            mt={4}
            bg="white"
            border="1px solid"
            borderColor="gray.200"
            borderRadius="xl"
            p={5}
            boxShadow="sm"
          >
            <Text fontSize="sm" fontWeight="700" color="gray.800" mb={1}>
              {activeForm?.formHeaderText ?? 'Form details'}
            </Text>
            <Text fontSize="xs" color="gray.500">
              {activeForm?.formDescription ?? 'No form description provided.'}
            </Text>
          </Box>
        )}

        <ApproveMemberModal
          isOpen={approveModal.isOpen}
          memberName={fullName}
          onClose={approveModal.onClose}
          onConfirm={handleApproveMember}
          isSubmitting={isActionSubmitting}
        />
        <RejectMemberModal
          isOpen={rejectModal.isOpen}
          memberName={fullName}
          onClose={rejectModal.onClose}
          onConfirm={handleRejectMember}
          isSubmitting={isActionSubmitting}
        />
      </Box>
    </Box>
  );
}
