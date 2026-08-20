import { useState, useRef, useEffect, useCallback } from "react";
import { FaEdit } from "react-icons/fa";
import {
  Box,
  Button,
  Flex,
  Heading,
  Image,
  Input,
  InputGroup,
  InputRightElement,
  Text,
  Badge,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  HStack,
  VStack,
  Card,
  CardBody,
  Select,
  Stack,
  useToast,
  Grid,
  Portal,
  Skeleton,
  useDisclosure,
  Icon
} from "@chakra-ui/react";
import { SearchIcon, CalendarIcon, ChevronDownIcon } from "@chakra-ui/icons";
import ViewIcon from '../../../../assets/img/dashboards/organizer/viewIcon.svg';
import updateIcon from '../../../../assets/img/dashboards/organizer/update.svg';
import { useNavigate, useLocation } from "react-router-dom";
// @ts-ignore
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { MdCampaign } from 'react-icons/md';
import { BsThreeDotsVertical } from "react-icons/bs";
import { FaFileCsv, FaFileExcel } from 'react-icons/fa';
import { IoMdShare } from 'react-icons/io';
import donationService, {
  DonationCampaign
} from "../../../service/organizer/donation/donationService";
import Loader from "../../common/Loader";
import Pagination from "./organizerDonationComponents/Pagination";
import { ShareModal } from "./organizerDonationComponents/ShareModal";
import { ExportButton } from './organizerDonationComponents/ExportButtonProps';
import HttpClient from "app/service/httpClient/HttpClient";
import CampaignRecurringDonation from "./campaignRecurringDonation";
import ConfirmationModal from "../../common/ConfirmationModal";
import CustomButton from 'app/components/common/CustomButton';
import clockIcon from '../../../../assets/img/dashboards/clock.svg';
import peopleIcon from '../../../../assets/img/dashboards/member.svg';
import shareIcon from '../../../../assets/img/organizer/donation/share.svg';
import { ShareDonationModal } from './organizerDonationComponents/ShareDonationModal';
import { hasPermission, hasAnyPermission } from 'app/service/organizer/rolesPermissions/permissionsService';
import { AutoSyncModal } from "../../organizer/donation/organizerDonationComponents/autoSyncModal";
import contactSyncService from "../../../service/organizer/Settings/contactSyncService";
import { PeerToPeerMenuItem } from './peerToPeer/PeerToPeerMenuItem';

interface DonationListProps {
  currentPage: number;
  setCurrentPage: (page: number) => void;
  entriesPerPage: number;
  setEntriesPerPage: (size: number) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onExportCSV: () => void;
  onExportExcel: () => void;
  onAddCampaign: () => void;
}

// Custom hook for debouncing values
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(
    () => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      return () => {
        clearTimeout(handler);
      };
    },
    [value, delay]
  );

  return debouncedValue;
}

export const createHandleExport = (currentPage: number, entriesPerPage: number, searchQuery: string) => {
  return async (exportFormat: string) => {
    try {
      await donationService.exportDonationInvoiceList(
        exportFormat,
        currentPage,   
        entriesPerPage,    
        searchQuery    
      );
    } catch (error) {
      console.error('Export failed:', error);
    }
  };
};


export default function DonationList({
  currentPage,
  setCurrentPage,
  entriesPerPage,
  setEntriesPerPage,
  searchQuery,
  setSearchQuery,
  onExportCSV,
  onExportExcel,
  onAddCampaign,
}: DonationListProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const { isOpen, onOpen, onClose } = useDisclosure();

  const { isOpen: isAutoSyncOpen, onOpen: onAutoSyncOpen, onClose: onAutoSyncClose } = useDisclosure();
const [autoSyncCampaignId, setAutoSyncCampaignId] = useState<string>("");
const [hasIntegrations, setHasIntegrations] = useState<boolean>(false);

  const organizerUniqueId = localStorage.getItem('organizerUniqueId') ?? '';

  // Campaign permissions
  const canCreate       = hasPermission('Donation.Campaign.Create');
  const canView         = hasPermission('Donation.Campaign.View');
  const canEdit         = hasPermission('Donation.Campaign.Edit');
  const canDelete       = hasPermission('Donation.Campaign.Delete');
  const canArchive      = hasPermission('Donation.Campaign.Archive');
  const canViewDetail   = hasPermission('Donation.Campaign.ViewDetail');
  const canViewQrCode   = hasPermission('Donation.Campaign.ViewQrCode');
  const canViewEmbedCode = hasPermission('Donation.Campaign.ViewEmbeddedCode');
  const canShare        = hasAnyPermission('Donation.Campaign.ViewQrCode', 'Donation.Campaign.ViewEmbeddedCode');
  const canViewDonors   = hasPermission('Donation.Donors.View');
  const canViewInvoice  = hasPermission('Donation.Invoice.View');
  const canViewRecurring = hasPermission('Donation.Recurring.View');

  // Local state
  const [campaigns, setCampaigns] = useState<DonationCampaign[]>([]);
  const [totalRecordsCount, setTotalRecordsCount] = useState(0);
  const [loading, setLoading] = useState(false);
  // const [searchQuery, setSearchQuery] = useState("");
  // const [dateRange, setDateRange] = useState({ start: "", end: "" });
  // const [showDatePicker, setShowDatePicker] = useState(false);
  // const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  // const [customEndDate, setCustomEndDate] = useState<Date | null>(null);
  // const [entriesPerPage, setEntriesPerPage] = useState<number>(6);
  // const [currentPage, setCurrentPage] = useState<number>(1);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [loadingBanners, setLoadingBanners] = useState<Set<string>>(new Set());
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const [showRecurringView, setShowRecurringView] = useState(false);
  const [selectedCampaignName, setSelectedCampaignName] = useState<string>("");

  const { isOpen: isEmbedModalOpen, onOpen: onEmbedModalOpen, onClose: onEmbedModalClose } = useDisclosure();
  const { isOpen: isDeleteModalOpen, onOpen: onDeleteModalOpen, onClose: onDeleteModalClose } = useDisclosure();
  const { isOpen: isNewShareModalOpen, onOpen: onNewShareModalOpen, onClose: onNewShareModalClose } = useDisclosure();

  const [isDeleting, setIsDeleting] = useState(false);
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);


  useEffect(() => {
  contactSyncService.getConnectedItems()
    .then((items) => setHasIntegrations(items.length > 0))
    .catch(() => setHasIntegrations(false));
}, []);

const handleAutoSync = (campaignId: string) => {
  if (!hasIntegrations) return;
  setAutoSyncCampaignId(campaignId);
  onAutoSyncOpen();
};
  const handleDuplicate = async (campaignId: string) => {
  try {
    await donationService.duplicateCampaign(campaignId);
    toast({
      title: "Campaign Duplicated",
      description: "Campaign copied successfully.",
      status: "success",
      duration: 1000,
      isClosable: true,
    });
    setTimeout(() => window.location.reload(), 1000);
  } catch (error) {
    toast({
      title: "Error",
      description: "Failed to duplicate campaign",
      status: "error",
      duration: 2000,
      isClosable: true,
    });
  }
};
  const handleDeleteClick = (campaignId: string) => {
    setSelectedCampaignId(campaignId);
    onDeleteModalOpen();
  };

  // Function to confirm and delete
  const handleConfirmDelete = async () => {
    if (!selectedCampaignId) return;
    
    setIsDeleting(true);
    
    try {
      await donationService.deleteCampaign(selectedCampaignId);
      
      console.log("Campaign deleted successfully");
      
      toast({
        title: "Campaign Deleted",
        description: "Campaign deleted successfully.",
        status: "success",
        duration: 1000,
        isClosable: true,
      });
      
      onDeleteModalClose();
      
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error) {
      let errorMessage = "An error occurred while deleting the campaign";
      
      if (error && typeof error === 'object') {
        if ('response' in error && error.response && typeof error.response === 'object') {
          if ('data' in error.response && error.response.data && typeof error.response.data === 'object') {
            if ('message' in error.response.data) {
              errorMessage = String(error.response.data.message);
            }
          }
        } else if ('message' in error) {
          errorMessage = String(error.message);
        }
      }
      
      console.error("Failed to delete campaign:", error);
      
      toast({
        title: "Error",
        description: errorMessage || "Failed to delete campaign",
        status: "error",
        duration: 2000,
        isClosable: true,
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleClick = (campaignId: string) => {
    navigate(`/organizer/donation/invoice-list/${campaignId}`);
  };

  const handleDonorList = (campaignId: string) => {
    navigate(`/organizer/donation/donor-list/${campaignId}`);
  };

  const handleArchive = async (campaignuniqueId: string ) => {
    const confirmArchive = window.confirm(
      `Are you sure you want to archive the campaign ?`
    );

    if (!confirmArchive) return;

    try {
      await donationService.archiveCampaign(campaignuniqueId);
     
      toast({
        title: "Campaign archived",
        description: `campaign archived successfully.`,
        status: "success",
        duration: 2000,
        isClosable: true,
      });
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error) {
      console.error('Error archiving campaign:', error);
      toast({
        title: "Error",
        description: "Failed to archive campaign",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handlePeerToPeer = (campaignId: string) => {
    navigate(`/organizer/donation/campaign/${campaignId}/peer-to-peer`);
  };

  const handleRecurring = (campaignId: string) => {
    navigate(`/organizer/donation/recurring-donations/${campaignId}`);
    
    setSelectedCampaignId(campaignId);
    setShowRecurringView(true);
  };

  const handleShare = (campaignId: string, campaignName: string) => {
    setSelectedCampaignId(campaignId);
    setSelectedCampaignName(campaignName);
    onNewShareModalOpen();
  };



  const bannerUrlsRef = useRef<{ [key: string]: string }>({});
  const [, forceUpdate] = useState({});
  // const datePickerRef = useRef<HTMLDivElement>(null);

  // Debounce search query to reduce API calls while typing
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // ── Helpers ──
  // const formatAmount = (val: number | null) => {
  //   if (!val) return '$0';
  //   if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
  //   if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
  //   return `$${val}`;
  // };

  const getDaysLeft = (endDate: string) =>
    Math.max(0, Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000));

  const handleImageError = (campaignId: string, bannerId?: string) => {
    console.error(`Failed to load banner for campaign ${campaignId}`, {
      bannerId,
      attemptedUrl: bannerId
        ? donationService.getBannerImageUrl(bannerId)
        : "No banner"
    });
    setImageErrors(prev => new Set(prev).add(campaignId));
  };

  const handleEditCampaign = async (campaignId: string) => {
    setEditingCampaignId(campaignId);
    try {
      const completedSteps = await donationService.getCompletedSteps(
        campaignId
      );

      // Determine the next step to resume from
      const nextStep =
        completedSteps.length > 0 ? Math.max(...completedSteps) + 1 : 1;

      // Navigate to create donation page with campaign ID and initial step
      navigate(`/create-donation-campaign/${campaignId}?step=${nextStep}`);
    } catch (error) {
      console.error("Error fetching completed steps:", error);
      toast({
        title: "Error",
        description: "Failed to load campaign progress. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true
      });
    } finally {
      setEditingCampaignId(null);
    }
  };

  // const formatDate = (date: Date) => date.toISOString().split("T")[0];

  // const handleSelect = (option: string) => {
  //   const today = new Date();
  //   let start: Date, end: Date;

  //   switch (option) {
  //     case "Today":
  //       start = end = today;
  //       break;

  //     case "This Week":
  //       start = new Date(today);
  //       start.setDate(today.getDate() - today.getDay()); // Sunday
  //       end = new Date(start);
  //       end.setDate(start.getDate() + 6); // Saturday
  //       break;

  //     case "This Month":
  //     default:
  //       start = new Date(today.getFullYear(), today.getMonth(), 1);
  //       end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  //       break;
  //   }

  //   setDateRange({
  //     start: formatDate(start),
  //     end: formatDate(end)
  //   });
  // };

  // const applyCustomRange = () => {
  //   if (customStartDate && customEndDate) {
  //     setDateRange({
  //       start: formatDate(customStartDate),
  //       end: formatDate(customEndDate)
  //     });
  //     setShowDatePicker(false);
  //   }
  // };

  // useEffect(
  //   () => {
  //     const handleClickOutside = (e: MouseEvent) => {
  //       if (
  //         datePickerRef.current &&
  //         !datePickerRef.current.contains(e.target as Node)
  //       )
  //         setShowDatePicker(false);
  //     };
  //     if (showDatePicker)
  //       document.addEventListener("mousedown", handleClickOutside);
  //     return () =>
  //       document.removeEventListener("mousedown", handleClickOutside);
  //   },
  //   [showDatePicker]
  // );

  // Load banner image for a single campaign (non-blocking)
  const loadBannerImage = useCallback(
    async (campaign: DonationCampaign) => {
      if (!campaign.bannerList || campaign.bannerList.length === 0) return;

      const campaignId = campaign.uniqueId;
      const bannerId = campaign.bannerList[0];

      // Skip if already loaded or loading
      if (bannerUrlsRef.current[bannerId] || loadingBanners.has(campaignId)) return;

      setLoadingBanners(prev => new Set(prev).add(campaignId));

      try {
        const blobUrl = await donationService.getBannerImageBlob(bannerId);
        bannerUrlsRef.current[bannerId] = blobUrl;
        forceUpdate({}); // Force re-render to show the loaded image
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

  // Fetch donations from API
  const fetchDonations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await donationService.getDonationCampaignList({
        pageNo: currentPage,
        pageSize: entriesPerPage,
        search: debouncedSearchQuery || undefined,
        // startDate: dateRange.start || undefined,
        // endDate: dateRange.end || undefined
      });

      setCampaigns(response.data.pageData);
      setTotalRecordsCount(response.data.totalRecordsCount);
    } catch (error: any) {
      console.error('Error fetching donation campaigns:', error);
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to fetch campaigns',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, entriesPerPage, debouncedSearchQuery, toast]);

  useEffect(() => {
    fetchDonations();
  }, [fetchDonations]);

  // Handle refresh from navigation state (after donation or campaign creation)
  useEffect(() => {
    const state = location.state as { refresh?: boolean } | null;
    if (state?.refresh) {
      console.log('Refreshing donation list...');

      // Clear the state to prevent refresh on next render
      navigate(location.pathname, { replace: true, state: {} });

      // Refetch the list
      fetchDonations();
    }
  }, [location.state, navigate, fetchDonations]);

  // Load banner images after campaigns are loaded (non-blocking)
  useEffect(
    () => {
      if (campaigns.length > 0 && !loading) {
        campaigns.forEach(campaign => {
          loadBannerImage(campaign);
        });
      }
    },
    [campaigns, loading, loadBannerImage]
  );

  // Calculate total pages from server response
  const totalPages = Math.ceil(totalRecordsCount / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + campaigns.length;

  // Reset to page 1 when filters change (but not on page change)
  useEffect(
    () => {
      if (currentPage !== 1) {
        setCurrentPage(1);
      }
    },
    [debouncedSearchQuery, entriesPerPage]
  );

  // Cleanup blob URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      Object.values(bannerUrlsRef.current).forEach(url => {
        URL.revokeObjectURL(url);
      });
    };
  }, []);

  const GetDonationListData = async (PageSize: number) => {
    setEntriesPerPage(PageSize);
    setCurrentPage(1);
  };

  const getPaginationOptions = (total: number) => {
    if (total === 0) return [6]; 
    
    const options = [];
    
    if (total <= 6) {
      options.push(total);
    } else if (total <= 10) {
      options.push(6);
      if (total > 6) options.push(total);
    } else if (total <= 25) {
      options.push(6, 10);
      if (total > 10) options.push(total);
    } else {
      options.push(6, 10, 25);
      if (total > 25) options.push(total);
    }
    
    return options;
  };

  return (
    <Box position="relative">
      {/* FILTERS SECTION */}
      <Stack
        direction={{ base: "column", md: "row" }}
        spacing={3}
        mb={6}
        align={{ base: "stretch", md: "center" }}
        justify="space-between"
        flexWrap="wrap"
      >
        <Flex gap={3} wrap="wrap" justify="flex-start" align="center" flex="1">
         <Select
            value={entriesPerPage}
            onChange={e => GetDonationListData(Number(e.target.value))}
            w={{ base: "auto", sm: "110px" }}
            h="32px"
            bg="white"
            borderColor="gray.300"
            borderRadius="md"
            fontSize="sm"
            flexShrink={0}
          >
            {getPaginationOptions(totalRecordsCount).map((option) => (
              <option key={option} value={option}>
                Show {option}
              </option>
            ))}
          </Select>

          <InputGroup w={{ base: "auto", sm: "150px" }} flexShrink={0}>
            <Input
              placeholder="Search by title"
              h="32px"
              bg="white"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              borderColor="gray.300"
              borderRadius="md"
              fontSize="sm"
              minW="120px"
            />
            <InputRightElement h="38px">
              <SearchIcon color="gray.400" boxSize={3} />
            </InputRightElement>
          </InputGroup>

          {/* {!dateRange.start
            ? <Menu>
                <MenuButton
                  as={Button}
                  variant="outline"
                  h="32px"
                  bg="white"
                  fontSize="sm"
                  leftIcon={<CalendarIcon />}
                  rightIcon={<ChevronDownIcon />}
                  borderRadius="md"
                  borderColor="gray.300"
                  flexShrink={0}
                >
                  Date range
                </MenuButton>
                <MenuList fontSize="sm">
                  <MenuItem onClick={() => handleSelect("Today")}>
                    Today
                  </MenuItem>
                  <MenuItem onClick={() => handleSelect("This Week")}>
                    This Week
                  </MenuItem>
                  <MenuItem onClick={() => handleSelect("This Month")}>
                    This Month
                  </MenuItem>
                  <MenuItem onClick={() => setShowDatePicker(true)}>
                    Custom Range
                  </MenuItem>
                </MenuList>
              </Menu>
            : <HStack spacing={3} flexShrink={0}>
                <Input
                  value={dateRange.start}
                  readOnly
                  w="120px"
                  textAlign="center"
                  bg="white"
                  borderColor="purple.300"
                  fontSize="sm"
                  h="32px"
                />
                <Text fontSize="sm" color="purple.500">
                  →
                </Text>
                <Input
                  value={dateRange.end}
                  readOnly
                  w="120px"
                  textAlign="center"
                  bg="white"
                  borderColor="purple.300"
                  fontSize="sm"
                  h="32px"
                />
                <Button
                  colorScheme="purple"
                  variant="ghost"
                  fontSize="sm"
                  onClick={() => setDateRange({ start: "", end: "" })}
                >
                  Clear
                </Button>
              </HStack>} */}
        </Flex>

        {/* Export and Add Campaign Buttons */}
        <Flex gap={2} align="center" flexShrink={0}>
          {/* <Flex
            gap={1}
            align="center"
            bg="gray.500"
            borderRadius="md"
            h="32px"
          >
            <ExportButton
              icon={FaFileCsv}
              label="Export CSV"
              onClick={onExportCSV}
            />
            <ExportButton
              icon={FaFileExcel}
              label="Export Excel"
              onClick={onExportExcel}
            />
          </Flex> */}
         {canViewEmbedCode && (
           <CustomButton
             variant="outline"
             size="sm"
             leftIcon={<Image src={shareIcon} alt="donate" boxSize="9px" />}
             onClick={onEmbedModalOpen}
           >
             Embed Code
           </CustomButton>
         )}

          {canCreate && (
            <CustomButton
              variant="primary"
              size="sm"
              px={6}
              flexShrink={0}
              onClick={onAddCampaign}
            >
              + New Campaign
            </CustomButton>
          )}


        </Flex>
      </Stack>

      {/* DATE PICKER */}
      {/* {showDatePicker &&
        <Box
          ref={datePickerRef}
          position="fixed"
          top="80px"
          left="50%"
          transform="translateX(-50%)"
          bg="white"
          p={4}
          borderRadius="lg"
          shadow="2xl"
          zIndex={1000}
          border="1px solid"
          borderColor="gray.200"
        >
          <Flex gap={4} direction="column">
            <DatePicker
              selected={customStartDate}
              onChange={(dates: [Date | null, Date | null]) => {
                const [start, end] = dates;
                setCustomStartDate(start);
                setCustomEndDate(end);
              }}
              startDate={customStartDate}
              endDate={customEndDate}
              selectsRange
              inline
              monthsShown={2}
            />
            <Flex justify="flex-end" gap={3}>
              <Button
                colorScheme="purple"
                variant="ghost"
                onClick={() => {
                  setCustomStartDate(null);
                  setCustomEndDate(null);
                }}
              >
                Clear
              </Button>
              <Button
                colorScheme="purple"
                onClick={applyCustomRange}
                isDisabled={!customStartDate || !customEndDate}
              >
                Apply
              </Button>
            </Flex>
          </Flex>
        </Box>} */}

      {/* DONATION LIST */}
      {loading
        ? <Loader
            message="Loading Campaigns..."
            subtitle="Please wait while we fetch the latest donation campaigns"
          />
        : <Grid gap={4} templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(2, 1fr)", xl: "repeat(2, 1fr)", "2xl": "repeat(3, 1fr)", "3xl": "repeat(4, 1fr)" }}>
            {campaigns.map(campaign =>
              <Card
                key={campaign.uniqueId}
                bg="white"
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
                  {loadingBanners.has(campaign.uniqueId)
                    ? <Skeleton position="absolute" top={0} left={0} w="100%" h="100%" />
                    : campaign.bannerList[0] && bannerUrlsRef.current[campaign.bannerList[0]] &&
                      !imageErrors.has(campaign.uniqueId)
                      ? <Image
                          position="absolute"
                          top={0} left={0}
                          src={bannerUrlsRef.current[campaign.bannerList[0]]}
                          alt={campaign.name}
                          w="100%" h="100%"
                          objectFit="cover"
                          onError={() =>
                            handleImageError(
                              campaign.uniqueId,
                              campaign.bannerList[0]
                            )}
                        />
                      : <Image
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
                        />}

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
                          <Text as="span">{getDaysLeft(campaign.endDate)} DAYS LEFT</Text>
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

                  {/* Status badge */}
                  <Badge
                    mb={2}
                    alignSelf="flex-start"
                    fontSize="11px"
                    colorScheme={
                      campaign.status === "Draft"
                        ? undefined
                        : campaign.status === "Started" ||
                          campaign.status === "Published"
                          ? "green"
                          : "blue"
                    }
                    bg={campaign.status === "Draft" ? "white" : undefined}
                    color={campaign.status === "Draft" ? "gray.500" : undefined}
                    border={campaign.status === "Draft" ? "1px solid" : undefined}
                    borderColor={campaign.status === "Draft" ? "gray.300" : undefined}
                    borderRadius="full"
                    px={3}
                    py={0.5}
                    fontWeight="medium"
                    textTransform="capitalize"
                  >
                    {campaign.status}
                  </Badge>

                {/* Campaign name + three-dot (shown here when no action buttons) */}
<Flex justify="space-between" align="flex-start">
  <Text
    fontWeight="bold"
    fontSize="sm"
    color="gray.800"
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
            isDisabled={campaign.status === "Draft"}
            cursor={campaign.status === "Draft" ? "not-allowed" : "pointer"}
            _disabled={{ color: "gray.500", opacity: 1, cursor: "not-allowed" }}
          >
            Share
          </MenuItem>
        )}
        {canViewDonors && (
          <MenuItem
            onClick={() => handleDonorList(campaign.uniqueId)}
            isDisabled={campaign.status === "Draft"}
          >
            Donor List
          </MenuItem>
        )}
        {canArchive && (
          <MenuItem
            onClick={() => handleArchive(campaign.uniqueId)}
            isDisabled={campaign.status !== "Draft" && campaign.status !== "Ended"}
          >
            Archive
          </MenuItem>
        )}
        { <MenuItem
          onClick={() => handleAutoSync(campaign.uniqueId)}
          isDisabled={!hasIntegrations}
          cursor={!hasIntegrations ? "not-allowed" : "pointer"}
          title={!hasIntegrations ? "Please add an integration first" : undefined}
          _disabled={{ color: "gray.400", opacity: 1, cursor: "not-allowed" }}
        >
          Enable Autosync
        </MenuItem> }
        {canViewRecurring && (
          <MenuItem
            onClick={() => handleRecurring(campaign.uniqueId)}
            isDisabled={campaign.status === "Draft"}
          >
            Recurring Donations
          </MenuItem>
        )}
        <PeerToPeerMenuItem
          status={campaign.status}
          onOpen={() => handlePeerToPeer(campaign.uniqueId)}
        />
        <MenuItem onClick={() => handleDuplicate(campaign.uniqueId)}>
          Make a Copy
        </MenuItem>
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
        isDisabled={campaign.status === "Draft" || campaign.status === "Ended"}
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

    {/* Three-dot in action row when at least one button exists */}
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
              isDisabled={campaign.status === "Draft"}
              cursor={campaign.status === "Draft" ? "not-allowed" : "pointer"}
              _disabled={{ color: "gray.500", opacity: 1, cursor: "not-allowed" }}
            >
              Share
            </MenuItem>
          )}
          {canViewDonors && (
            <MenuItem
              onClick={() => handleDonorList(campaign.uniqueId)}
              isDisabled={campaign.status === "Draft"}
            >
              Donor List
            </MenuItem>
          )}
          {canArchive && (
            <MenuItem
              onClick={() => handleArchive(campaign.uniqueId)}
              isDisabled={campaign.status !== "Draft" && campaign.status !== "Ended"}
            >
              Archive
            </MenuItem>
          )}
          <MenuItem
            onClick={() => handleAutoSync(campaign.uniqueId)}
            isDisabled={!hasIntegrations}
            cursor={!hasIntegrations ? "not-allowed" : "pointer"}
            title={!hasIntegrations ? "Please add an integration first" : undefined}
            _disabled={{ color: "gray.400", opacity: 1, cursor: "not-allowed" }}
          >
            Enable Autosync
          </MenuItem>
          {canViewRecurring && (
            <MenuItem
              onClick={() => handleRecurring(campaign.uniqueId)}
              isDisabled={campaign.status == "Draft"}
            >
              Recurring Donations
            </MenuItem>
          )}
          <PeerToPeerMenuItem
            status={campaign.status}
            onOpen={() => handlePeerToPeer(campaign.uniqueId)}
          />
          <MenuItem onClick={() => handleDuplicate(campaign.uniqueId)}>
            Make a Copy
          </MenuItem>
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

                  {/* Raised / Goal / Donations row */}
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
                      <Text fontSize="sm" fontWeight="bold" color="gray.800" noOfLines={1}>
                        {(campaign.goal.goalAchieved)}
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
                      <Text fontSize="sm" fontWeight="bold" color="gray.800" noOfLines={1}>
                        {(campaign.goal.goal)}
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
                        DONATIONS
                      </Text>
                      <Text fontSize="sm" fontWeight="bold" color="gray.800" noOfLines={1}>
                        {campaign.invoiceCount}
                      </Text>
                    </VStack>
                  </HStack>

                </CardBody>
              </Card>
            )}
          </Grid>}

      {!loading &&
        campaigns.length === 0 &&
        <Box
          textAlign="center"
          py={12}
          bg="white"
          borderRadius="xl"
          shadow="sm"
        >
          <Text color="gray.500" fontSize="lg" fontWeight="medium">
            No donations found
          </Text>
          <Text color="gray.400" fontSize="sm" mt={2}>
            Try adjusting your search or filters
          </Text>
        </Box>}

      {!loading &&
        campaigns.length > 0 &&
        <Pagination
          currentPage={currentPage}
          totalRecords={totalRecordsCount}
          entriesPerPage={entriesPerPage}
          onPageChange={setCurrentPage}
          displayedItemsCount={campaigns.length}
        />}


        <ShareModal
          isOpen={isNewShareModalOpen}
          onClose={onNewShareModalClose}
          campaignId={selectedCampaignId}
          campaignName={selectedCampaignName}
        />

      {showRecurringView && selectedCampaignId && (
        <CampaignRecurringDonation 
          campaignId={selectedCampaignId}
        />
      )}

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

      {/* Full-screen loader overlay when editing campaign */}
      {editingCampaignId && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="rgba(255, 255, 255, 0.9)"
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
      <ShareDonationModal
  isOpen={isEmbedModalOpen}
  onClose={onEmbedModalClose}
  campaignId=""
  organizerUniqueId={organizerUniqueId}
/>

<AutoSyncModal
  isOpen={isAutoSyncOpen}
  onClose={onAutoSyncClose}
  campaignId={autoSyncCampaignId}
/>

    </Box>
  );
}

function toast(arg0: { title: string; description: string; status: string; duration: number; isClosable: boolean; }) {
  throw new Error("Function not implemented.");
}
