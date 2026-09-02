import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Box,
  Heading,
  SimpleGrid,
  Card,
  CardBody,
  Badge,
  Flex,
  Text,
  Button,
  Image,
  HStack,
  Skeleton,
  Icon,
  VStack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Portal,
  IconButton,
  useDisclosure,
} from '@chakra-ui/react';
import { MdCampaign } from 'react-icons/md';
import { BsThreeDotsVertical } from 'react-icons/bs';
import { useNavigate } from 'react-router-dom';
import { useColorModeValue } from '@chakra-ui/react';
import { useToast } from '@chakra-ui/react';
import donationService, { DonationCampaign } from 'app/service/organizer/donation/donationService';
import clockIcon from '../../../../assets/img/dashboards/clock.svg';
import ViewIcon from '../../../../assets/img/dashboards/organizer/viewIcon.svg';
import updateIcon  from '../../../../assets/img/dashboards/organizer/update.svg';
import peopleIcon from '../../../../assets/img/dashboards/member.svg';
import { ShareModal } from '../donation/organizerDonationComponents/ShareModal';
import ConfirmationModal from '../../common/ConfirmationModal';
import CustomButton from 'app/components/common/CustomButton';
import Loader from 'app/components/common/Loader';
import { hasPermission, hasAnyPermission } from 'app/service/organizer/rolesPermissions/permissionsService';
import { PeerToPeerMenuItem } from '../donation/peerToPeer/PeerToPeerMenuItem';
import { PendingApprovalBadge } from 'app/components/organizer/donation/peerToPeer/moderation/PendingApprovalBadge';
import { PeerToPeerPill } from 'app/components/organizer/donation/peerToPeer/PeerToPeerPill';

const recentCampaigns: React.FC = () => {
  // Campaign permissions
  const canCreate        = hasPermission('Donation.Campaign.Create');
  const canEdit          = hasPermission('Donation.Campaign.Edit');
  const canDelete        = hasPermission('Donation.Campaign.Delete');
  const canArchive       = hasPermission('Donation.Campaign.Archive');
  const canViewDetail    = hasPermission('Donation.Campaign.ViewDetail');
  const canShare         = hasAnyPermission('Donation.Campaign.ViewQrCode', 'Donation.Campaign.ViewEmbeddedCode');
  const canViewDonors    = hasPermission('Donation.Donors.View');
  const canViewInvoice   = hasPermission('Donation.Invoice.View');
  const canViewRecurring = hasPermission('Donation.Recurring.View');

  const [campaigns, setCampaigns] = useState<DonationCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const bannerUrlsRef = useRef<{ [key: string]: string }>({});
  const [, forceUpdate] = useState({});
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [loadingBanners, setLoadingBanners] = useState<Set<string>>(new Set());

  const navigate = useNavigate();
  const toast = useToast();

  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);

  // ── Three-dot menu state ──
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [selectedCampaignName, setSelectedCampaignName] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);
  const { isOpen: isNewShareModalOpen, onOpen: onNewShareModalOpen, onClose: onNewShareModalClose } = useDisclosure();
  const { isOpen: isDeleteModalOpen, onOpen: onDeleteModalOpen, onClose: onDeleteModalClose } = useDisclosure();

  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('#1B2559', '#FFFFFF');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // ── Edit Campaign ──
  const handleEditCampaign = async (campaignId: string) => {
    setEditingCampaignId(campaignId);
    try {
      const completedSteps = await donationService.getCompletedSteps(campaignId);
      const nextStep = completedSteps.length > 0 ? Math.max(...completedSteps) + 1 : 1;
      navigate(`/create-donation-campaign/${campaignId}?step=${nextStep}`);
    } catch (error) {
      console.error('Error fetching completed steps:', error);
      toast({
        title: 'Error',
        description: 'Failed to load campaign progress. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setEditingCampaignId(null);
    }
  };

  // ── Menu Handlers ──
  const handleClick = (campaignId: string) => {
    navigate(`/organizer/donation/invoice-list/${campaignId}`);
  };

  const handleDonorList = (campaignId: string) => {
    navigate(`/organizer/donation/donor-list/${campaignId}`);
  };

  const handleShare = (campaignId: string, campaignName: string) => {
    setSelectedCampaignId(campaignId);
    setSelectedCampaignName(campaignName);
    onNewShareModalOpen();
  };

  const handleArchive = async (campaignUniqueId: string) => {
    const confirmArchive = window.confirm('Are you sure you want to archive the campaign?');
    if (!confirmArchive) return;
    try {
      await donationService.archiveCampaign(campaignUniqueId);
      toast({
        title: 'Campaign archived',
        description: 'Campaign archived successfully.',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error('Error archiving campaign:', error);
      toast({
        title: 'Error',
        description: 'Failed to archive campaign',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleRecurring = (campaignId: string) => {
    navigate(`/organizer/donation/recurring-donations/${campaignId}`);
  };

  const handlePeerToPeer = (campaignId: string) => {
    navigate(`/organizer/donation/campaign/${campaignId}/peer-to-peer`);
  };

  const handleDeleteClick = (campaignId: string) => {
    setSelectedCampaignId(campaignId);
    onDeleteModalOpen();
  };

  const handleConfirmDelete = async () => {
    if (!selectedCampaignId) return;
    setIsDeleting(true);
    try {
      await donationService.deleteCampaign(selectedCampaignId);
      toast({
        title: 'Campaign Deleted',
        description: 'Campaign deleted successfully.',
        status: 'success',
        duration: 1000,
        isClosable: true,
      });
      onDeleteModalClose();
      setTimeout(() => window.location.reload(), 1000);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || error?.message || 'Failed to delete campaign';
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 2000,
        isClosable: true,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const canViewCampaigns = hasPermission('Donation.Campaign.View');

  // ── Fetch Campaigns ──
  useEffect(() => {
    if (!canViewCampaigns) return;
    const fetchCampaigns = async () => {
      try {
        setIsLoading(true);
        const response = await donationService.getDonationCampaignList({
          pageNo: 1,
          pageSize: 4,
        });
        setCampaigns(response.data.pageData || []);
      } catch (error: any) {
        console.error('Error fetching recent campaigns:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch recent campaigns',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchCampaigns();
  }, []);

  // ── Banner Loading ──
  const loadBannerImage = useCallback(
    async (campaign: DonationCampaign) => {
      if (!campaign.bannerList || campaign.bannerList.length === 0) return;
      const campaignId = campaign.uniqueId;
      const bannerId = campaign.bannerList[0];
      if (bannerUrlsRef.current[bannerId] || loadingBanners.has(campaignId)) return;
      setLoadingBanners(prev => new Set(prev).add(campaignId));
      try {
        const blobUrl = await donationService.getBannerImageBlob(bannerId);
        bannerUrlsRef.current[bannerId] = blobUrl;
        forceUpdate({});
      } catch (error) {
        console.error(`Failed to load banner for ${campaign.name}:`, error);
        setImageErrors(prev => new Set(prev).add(campaignId));
      } finally {
        setLoadingBanners(prev => {
          const newSet = new Set(prev);
          newSet.delete(campaignId);
          return newSet;
        });
      }
    },
    [loadingBanners]
  );

  useEffect(() => {
    if (campaigns.length > 0 && !isLoading) {
      campaigns.forEach(campaign => loadBannerImage(campaign));
    }
  }, [campaigns, isLoading, loadBannerImage]);

  useEffect(() => {
    return () => {
      Object.values(bannerUrlsRef.current).forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  // ── Helpers ──
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Draft':
        return { colorScheme: undefined as any, bg: 'white', color: 'gray.500', border: '1px solid', borderColor: 'gray.300' };
      case 'Started':
      case 'Published':
        return { colorScheme: 'green' as any, bg: undefined, color: undefined, border: undefined, borderColor: undefined };
      case 'Ended':
        return { colorScheme: 'red' as any, bg: undefined, color: undefined, border: undefined, borderColor: undefined };
      default:
        return { colorScheme: 'blue' as any, bg: undefined, color: undefined, border: undefined, borderColor: undefined };
    }
  };

  // const formatAmount = (val: number | null) => {
  //   if (!val) return '$0';
  //   if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
  //   if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
  //   if (val < 0) return '$0';
  //   return `$${val}`;
  // };

  const getDaysLeft = (endDate: string) =>
    Math.max(0, Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000));

 const gridColumns = { base: 1, md: 1, lg: 2, xl: 2, '2xl': 4 };
const gridSpacing = 4;

  if (!canViewCampaigns) return null;

  // ── Loading Skeleton ──
  if (isLoading) {
    return (
      <Box mb={4} w="100%">
        <Flex justify="space-between" align="center" mb={4}>
          <Heading size="md" color={textColor}>Recent Campaigns</Heading>
        </Flex>
        <SimpleGrid columns={gridColumns} spacing={gridSpacing}>
          {[1, 2, 3, 4].map(i => (
            <Card key={i} borderRadius="2xl" overflow="hidden" border="1px" borderColor={borderColor}>
              <Skeleton height="160px" />
              <CardBody p={4}>
                <Skeleton height="14px" mb={3} />
                <Skeleton height="8px" mb={3} />
                <Skeleton height="6px" mb={4} />
                <HStack>
                  <Skeleton height="36px" flex={1} borderRadius="lg" />
                  <Skeleton height="36px" flex={1} borderRadius="lg" />
                </HStack>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      </Box>
    );
  }

  if (campaigns.length === 0) return null;

  return (
    <Box w="100%">

      {/* ── Header ── */}
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="md" color={textColor}>
          Recent Campaigns
        </Heading>
        <HStack spacing={2}>
          <CustomButton
            variant="outline"
            size="sm"
            flexShrink={0}
            onClick={() => navigate('/organizer/donation/manage-donation-module')}
          >
            View Campaigns
          </CustomButton>
          {canCreate && (
            <CustomButton
              variant="primary"
              size="sm"
              flexShrink={0}
              onClick={() => navigate('/create-donation-campaign')}
            >
              + New Campaign
            </CustomButton>
          )}
        </HStack>
      </Flex>

      {/* ── Grid ── */}
      <SimpleGrid columns={gridColumns} spacing={gridSpacing}>
        {campaigns.map((campaign) => {
          const raised      = campaign.goal?.goalAchieved ?? 0;
          const goal        = campaign.goal?.goal ?? 0;
         const left = Math.max(0, goal - raised);
          const daysLeft    = getDaysLeft(campaign.endDate);
          const statusStyle = getStatusStyle(campaign.status);

          const bannerId        = campaign.bannerList?.[0];
          const isBannerLoading = loadingBanners.has(campaign.uniqueId);
          const bannerBlobUrl   = bannerId ? bannerUrlsRef.current[bannerId] : null;
          const hasImageError   = imageErrors.has(campaign.uniqueId);

          return (
            <Card
              key={campaign.uniqueId}
              bg={cardBg}
              border="1px"
              borderRadius="2xl"
              overflow="hidden"
              w="100%"
              minW={0}
              isolation="isolate"
              display="flex"
              flexDirection="column"
              transition="all 0.3s"
                 boxShadow="0 1px 3px 0 rgba(29, 33, 43, 0.06)"
borderColor="purple.200"
transform="translateY(-2px)"
            >
              {/* ── Banner ── */}
              <Box
                position="relative"
                w="100%"
                h="160px"
                flexShrink={0}
                overflow="hidden"
                bg="gray.100"
              >
                {isBannerLoading ? (
                  <Skeleton position="absolute" top={0} left={0} w="100%" h="100%" />
                ) : bannerId && bannerBlobUrl && !hasImageError ? (
                  <Image
                    position="absolute"
                    top={0} left={0}
                    src={bannerBlobUrl}
                    alt={campaign.name}
                    w="100%" h="100%"
                    objectFit="cover"
                    onError={() => setImageErrors(prev => new Set(prev).add(campaign.uniqueId))}
                  />
                ) : (
                  <Image
                    position="absolute"
                    top={0} left={0}
                    src="/donation.jpg"
                    alt="Default campaign banner"
                    w="100%" h="100%"
                    objectFit="cover"
                    fallback={
                      <Flex
                        position="absolute"
                        top={0} left={0}
                        w="100%" h="100%"
                        align="center"
                        justify="center"
                        bg="purple.50"
                      >
                        <Icon as={MdCampaign} boxSize={10} color="purple.300" />
                      </Flex>
                    }
                  />
                )}

                {/* Dark gradient overlay */}
                <Box
                  position="absolute"
                  top={0} left={0} right={0}
                  h="60px"
                  bgGradient="linear(to-b, blackAlpha.600, transparent)"
                  pointerEvents="none"
                />

                {/* Badges overlay on image */}
                <Flex
                  position="absolute"
                  top={0} left={0} right={0}
                  px={2.5}
                  pt={2.5}
                  justify="space-between"
                  align="center"
                  gap={1}
                >
                  <HStack spacing={1.5} flexShrink={1} minW={0} overflow="hidden">
                    <Badge
                      fontSize="10px"
                      bg="blackAlpha.700"
                      color="white"
                      borderRadius="full"
                      px={2}
                      py={0.5}
                      fontWeight="bold"
                      textTransform="uppercase"
                      whiteSpace="nowrap"
                      letterSpacing="0.03em"
                    >
                      <HStack spacing={1} display="inline-flex" alignItems="center" paddingTop={1}>
                        <Image src={clockIcon} alt="clock" boxSize="10px" />
                        <Text as="span">{daysLeft} DAYS LEFT</Text>
                      </HStack>
                    </Badge>
                    <Badge
                      fontSize="10px"
                      bg="blackAlpha.700"
                      color="white"
                      borderRadius="full"
                      px={2}
                      py={0.5}
                      fontWeight="medium"
                      textTransform="none"
                      whiteSpace="nowrap"
                    >
                      <HStack spacing={1} display="inline-flex" alignItems="center" paddingTop={1}>
                        <Image src={peopleIcon} alt="people" boxSize="10px" />
                        <Text as="span">{campaign.invoiceCount ?? 0}</Text>
                      </HStack>
                    </Badge>
                  </HStack>
                  <Box />
                </Flex>
              </Box>

              {/* ── Card Body ── */}
              <CardBody p={3} display="flex" flexDirection="column" flex={1}>

                {/* Status badge, beside anything the campaign is waiting on us to do. The row keeps
                    its height whether or not there is something waiting, so cards stay level. */}
                <HStack mb={2} minH="44px" spacing={2} align="center" justify="flex-start" wrap="nowrap" minW={0}>
                <Badge
                  alignSelf="center"
                  fontSize="11px"
                  colorScheme={statusStyle.colorScheme}
                  bg={statusStyle.bg}
                  color={statusStyle.color}
                  border={statusStyle.border}
                  borderColor={statusStyle.borderColor}
                  borderRadius="full"
                  px={3}
                  py={0.5}
                  fontWeight="medium"
                  textTransform="capitalize"
                >
                  {campaign.status}
                </Badge>
                  <PeerToPeerPill
                    campaignUniqueId={campaign.uniqueId}
                    isPeerToPeerEnabled={campaign.isPeerToPeerEnabled === true}
                  />
                  <PendingApprovalBadge
                    campaignUniqueId={campaign.uniqueId}
                    pendingCount={campaign.pendingFundraiserApprovalCount ?? 0}
                  />
                </HStack>

            {/* Campaign name + three-dot (shown here when no action buttons) */}
<Flex justify="space-between" align="flex-start">
  <Text
    fontWeight="bold"
    fontSize="sm"
    color={textColor}
    noOfLines={2}
    lineHeight="1.4"
    minH="2em"
    flex={1}
    mr={(!canViewDetail && !canEdit) ? 2 : 0}
  >
    {campaign.name}
  </Text>

  {!canViewDetail && !canEdit && (
    <Menu>
      <MenuButton
        as={IconButton}
        icon={<BsThreeDotsVertical />}
        variant="outline"
        borderColor="gray.300"
        color="gray.500"
        size="sm"
        minW="36px"
        borderRadius="lg"
        flexShrink={0}
        aria-label="More options"
        _hover={{ bg: 'gray.50' }}
      />
      <Portal>
        <MenuList zIndex={500} bg="white" boxShadow="xl" minW="160px" fontSize="sm">
          {canViewInvoice && (
            <MenuItem onClick={() => handleClick(campaign.uniqueId)}>
              Payment List
            </MenuItem>
          )}
          {canShare && (
            <MenuItem
              onClick={() => handleShare(campaign.uniqueId, campaign.name)}
              isDisabled={campaign.status === 'Draft'}
              cursor={campaign.status === 'Draft' ? 'not-allowed' : 'pointer'}
              _disabled={{ color: 'gray.500', opacity: 1, cursor: 'not-allowed' }}
            >
              Share
            </MenuItem>
          )}
          {canViewDonors && (
            <MenuItem
              onClick={() => handleDonorList(campaign.uniqueId)}
              isDisabled={campaign.status === 'Draft'}
            >
              Donor List
            </MenuItem>
          )}
          {canArchive && (
            <MenuItem
              onClick={() => handleArchive(campaign.uniqueId)}
              isDisabled={campaign.status !== 'Draft' && campaign.status !== 'Ended'}
            >
              Archive
            </MenuItem>
          )}
          {canViewRecurring && (
            <MenuItem
              onClick={() => handleRecurring(campaign.uniqueId)}
              isDisabled={campaign.status === 'Draft'}
            >
              Recurring Donations
            </MenuItem>
          )}
          <PeerToPeerMenuItem
            status={campaign.status}
            onOpen={() => handlePeerToPeer(campaign.uniqueId)}
          />
          {canDelete && (
            <MenuItem
              onClick={() => handleDeleteClick(campaign.uniqueId)}
              color="red.500"
            >
              Delete
            </MenuItem>
          )}
        </MenuList>
      </Portal>
    </Menu>
  )}
</Flex>

{/* ── Action Buttons row (only when at least one button visible) ── */}
{(canViewDetail || canEdit) && (
  <HStack spacing={2}>
    {canViewDetail && (
      <CustomButton
        variant="outline"
        size="sm"
        flex={1}
        minW="70px"
        px={4}
        leftIcon={<Image src={ViewIcon} alt="view" boxSize="14px" />}
        isDisabled={campaign.status === 'Draft' || campaign.status === 'Ended'}
        onClick={() => window.open(`/donate/${campaign.uniqueId}`, '_blank')}
      >
        View
      </CustomButton>
    )}
    {canEdit && (
      <CustomButton
        variant="primary"
        size="sm"
        flex={1}
        minW="80px"
        px={4}
        leftIcon={<Image src={updateIcon} alt="edit" boxSize="14px" />}
        isLoading={editingCampaignId === campaign.uniqueId}
        loadingText="Loading..."
        onClick={() => handleEditCampaign(campaign.uniqueId)}
      >
        Update
      </CustomButton>
    )}

    {/* Three-dot stays in button row when buttons exist */}
    <Menu>
      <MenuButton
        as={IconButton}
        icon={<BsThreeDotsVertical />}
        variant="outline"
        borderColor="gray.300"
        color="gray.500"
        size="sm"
        minW="36px"
        borderRadius="lg"
        flexShrink={0}
        aria-label="More options"
        _hover={{ bg: 'gray.50' }}
      />
      <Portal>
        <MenuList zIndex={500} bg="white" boxShadow="xl" minW="160px" fontSize="sm">
          {canViewInvoice && (
            <MenuItem onClick={() => handleClick(campaign.uniqueId)}>
              Payment List
            </MenuItem>
          )}
          {canShare && (
            <MenuItem
              onClick={() => handleShare(campaign.uniqueId, campaign.name)}
              isDisabled={campaign.status === 'Draft'}
              cursor={campaign.status === 'Draft' ? 'not-allowed' : 'pointer'}
              _disabled={{ color: 'gray.500', opacity: 1, cursor: 'not-allowed' }}
            >
              Share
            </MenuItem>
          )}
          {canViewDonors && (
            <MenuItem
              onClick={() => handleDonorList(campaign.uniqueId)}
              isDisabled={campaign.status === 'Draft'}
            >
              Donor List
            </MenuItem>
          )}
          {canArchive && (
            <MenuItem
              onClick={() => handleArchive(campaign.uniqueId)}
              isDisabled={campaign.status !== 'Draft' && campaign.status !== 'Ended'}
            >
              Archive
            </MenuItem>
          )}
          {canViewRecurring && (
            <MenuItem
              onClick={() => handleRecurring(campaign.uniqueId)}
              isDisabled={campaign.status === 'Draft'}
            >
              Recurring Donations
            </MenuItem>
          )}
          <PeerToPeerMenuItem
            status={campaign.status}
            onOpen={() => handlePeerToPeer(campaign.uniqueId)}
          />
          {canDelete && (
            <MenuItem
              onClick={() => handleDeleteClick(campaign.uniqueId)}
              color="red.500"
            >
              Delete
            </MenuItem>
          )}
        </MenuList>
      </Portal>
    </Menu>
  </HStack>
)}

                {/* Divider */}
                <Box marginTop={3} borderTop="1px" borderColor="gray.300" marginBottom={3} />

                {/* Raised / Goal / Left */}
                <HStack justify="space-between" spacing={2}>
                  <VStack spacing={0} align="flex-start" flex={1} minW={0}>
                    <Text
                      fontSize="9px"
                      color="gray.400"
                      fontWeight="bold"
                      textTransform="uppercase"
                      letterSpacing="0.07em"
                    >
                      RAISED
                    </Text>
                    <Text fontSize="sm" fontWeight="bold" color={textColor} noOfLines={1}>
                      ${(raised)}
                    </Text>
                  </VStack>
                  <VStack spacing={0} align="center" flex={1} minW={0}>
                    <Text
                      fontSize="9px"
                      color="gray.400"
                      fontWeight="bold"
                      textTransform="uppercase"
                      letterSpacing="0.07em"
                    >
                      GOAL
                    </Text>
                    <Text fontSize="sm" fontWeight="bold" color={textColor} noOfLines={1}>
                      ${(goal)}
                    </Text>
                  </VStack>
                  <VStack spacing={0} align="flex-end" flex={1} minW={0}>
                    <Text
                      fontSize="9px"
                      color="gray.400"
                      fontWeight="bold"
                      textTransform="uppercase"
                      letterSpacing="0.07em"
                    >
                      LEFT
                    </Text>
                    <Text fontSize="sm" fontWeight="bold" color={textColor} noOfLines={1}>
                      ${(left)}
                    </Text>
                  </VStack>
                </HStack>
              </CardBody>
            </Card>
          );
        })}
      </SimpleGrid>

      {/* ── Modals ── */}
      <ShareModal
        isOpen={isNewShareModalOpen}
        onClose={onNewShareModalClose}
        campaignId={selectedCampaignId}
        campaignName={selectedCampaignName}
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={onDeleteModalClose}
        onConfirm={handleConfirmDelete}
        title="Delete Campaign"
        message="Do you want to delete this campaign? This action cannot be undone."
        confirmText="Yes, Delete"
        type="danger"
        isLoading={isDeleting}
      />

      {/* Full-screen loader overlay when editing */}
      {editingCampaignId && (
  <Box
    position="fixed"
    top={0}
    left={0}
    right={0}
    bottom={0}
    bg="rgba(255, 255, 255, 0.85)"
    zIndex={9999}
    display="flex"
    alignItems="center"
    justifyContent="center"
  >
    <Loader
      message="Loading Campaign..."
      subtitle="Please wait while we prepare the campaign editor"
    />
  </Box>
)}
    </Box>
  );
};

export default recentCampaigns;