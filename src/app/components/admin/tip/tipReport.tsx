import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Flex,
  Text,
  Input,
  InputGroup,
  InputLeftElement,
  Button,
  Tag,
  TagLabel,
  TagCloseButton,
  Spinner,
  useColorModeValue,
  Center,
  Divider,
} from '@chakra-ui/react';
import { MdSearch, MdGridView, MdAddCircle } from 'react-icons/md';
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import Card from 'themeComponents/card/Card';
import TipReportService, {
  OrganizerSummary,
  GroupedOrganizerReport,
} from '../../../service/admin/tipService';
import OrganizerCampaignReport from '../tip/organizerCampaignReport';

interface SelectedOrganizer {
  uniqueId: string;
  name: string;
}

export default function TipReport() {
  const [organizers, setOrganizers] = useState<OrganizerSummary[]>([]);
  const [selected, setSelected] = useState<SelectedOrganizer[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [reportData, setReportData] = useState<GroupedOrganizerReport[]>([]);
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const cardBg = useColorModeValue('white', 'navy.800');
  const headingColor = useColorModeValue('blue.700', 'blue.200');
  const subTextColor = useColorModeValue('gray.500', 'gray.400');
  const labelColor = useColorModeValue('gray.700', 'gray.300');
  const iconBg = useColorModeValue('blue.50', 'whiteAlpha.100');
  const iconColor = useColorModeValue('blue.500', 'blue.300');
  const triggerBorder = useColorModeValue('gray.200', 'whiteAlpha.200');
  const triggerHover = useColorModeValue('gray.100', 'whiteAlpha.100');
  const dropdownBg = useColorModeValue('white', 'navy.800');
  const dropdownBorder = useColorModeValue('gray.200', 'whiteAlpha.200');
  const dropdownShadow = useColorModeValue('lg', 'dark-lg');
  const searchBg = useColorModeValue('gray.50', 'navy.900');
  const searchBorder = useColorModeValue('gray.200', 'whiteAlpha.100');
  const itemHoverBg = useColorModeValue('gray.50', 'whiteAlpha.50');
  const itemSelectedBg = useColorModeValue('blue.50', 'whiteAlpha.100');
  const itemSelectedText = useColorModeValue('blue.700', 'blue.200');
  const footerBg = useColorModeValue('gray.50', 'navy.900');
  const emptyIconColor = useColorModeValue('gray.300', 'gray.600');
  const emptyTextColor = useColorModeValue('gray.500', 'gray.400');
  const checkBorder = useColorModeValue('gray.300', 'whiteAlpha.300');
 const dividerColor = useColorModeValue('gray.300', 'gray.500');

  // ── Fetch dropdown organizers ──────────────────────────────────────────────

  const fetchOrganizers = useCallback(async (search?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await TipReportService.getOrganizersForDropdown(search);
      setOrganizers(data);
    } catch {
      setError('Failed to load organizers. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Fetch dropdown organizers with debounce ──────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    // Only fetch immediately if we have no data yet (initial load)
    if (organizers.length === 0 && !searchTerm) {
      fetchOrganizers();
      return;
    }

    // Otherwise, debounce the search/refresh
    const t = setTimeout(() => {
      fetchOrganizers(searchTerm || undefined);
    }, 300);

    return () => clearTimeout(t);
  }, [searchTerm, isOpen, fetchOrganizers]);

  // ── Outside click ──────────────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (isOpen) setTimeout(() => searchRef.current?.focus(), 50);
  }, [isOpen]);

  // ── Dropdown handlers ──────────────────────────────────────────────────────

  const resetReport = () => {
    setShowReport(false);
    setReportData([]);
    setReportError(null);
  };

  const toggle = (org: OrganizerSummary) => {
    setSelected((prev) => {
      const exists = prev.some((s) => s.uniqueId === org.organizerUniqueId);
      if (exists) return prev.filter((s) => s.uniqueId !== org.organizerUniqueId);
      return [...prev, { uniqueId: org.organizerUniqueId, name: org.organizerName }];
    });
    resetReport();
  };

 const removeSelected = async (id: string) => {
  const updated = selected.filter((s) => s.uniqueId !== id);
  setSelected(updated);

  // If there are still selected organizers, re-fetch report automatically
  if (updated.length > 0) {
    setShowReport(true);
    setIsReportLoading(true);
    setReportError(null);
    setReportData([]);

    try {
      const result = await TipReportService.getOrganizerCampaignReport({
        organizerUniqueIds: updated.map((o) => o.uniqueId),
        pageNo: 1,
        pageSize: 100,
      });
      setReportData(result);
    } catch {
      setReportError('Failed to load report data. Please try again.');
    } finally {
      setIsReportLoading(false);
    }
  } else {
    // No organizers left — clear the report
    resetReport();
  }
};
  const isChecked = (org: OrganizerSummary) =>
    selected.some((s) => s.uniqueId === org.organizerUniqueId);

  // ── View Reports ───────────────────────────────────────────────────────────

  const handleViewReports = async () => {
    setIsOpen(false);
    setShowReport(true);
    setIsReportLoading(true);
    setReportError(null);
    setReportData([]);

    try {
      const result = await TipReportService.getOrganizerCampaignReport({
        organizerUniqueIds: selected.map((o) => o.uniqueId),
        pageNo: 1,
        pageSize: 100,
      });
      setReportData(result);
    } catch {
      setReportError('Failed to load report data. Please try again.');
    } finally {
      setIsReportLoading(false);
    }
  };

  const allSelected = organizers.length > 0 && selected.length === organizers.length;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Flex direction="column" pt={{ sm: '25px', lg: '5px' }} mt={14}>
      {/* Select Orga Card */}
      <Card p="10px" bg={cardBg}>
        <Box ref={wrapperRef} position="relative">
          <Flex align="flex-start" justify="space-between" px={4} py={3} gap={3}>

  {/* Left: Icon + Labels + Tags */}
  <Flex align="flex-start" gap={3} flex={1}>
    <Center w="36px" h="36px" borderRadius="8px" bg={iconBg} color={iconColor} flexShrink={0}>
      <MdGridView size={18} />
    </Center>

    <Flex direction="column" gap={2} flex={1}>
      <Box>
        <Text fontSize="sm" fontWeight="600" color={labelColor}>Select Organizers</Text>
        <Text fontSize="xs" color={subTextColor} mt="1px">
          Choose one or more organizers to view their tip reports
        </Text>
      </Box>

      {selected.length > 0 && (
        <Flex gap={2} flexWrap="wrap">
          {selected.map((org) => (
            <Tag
              key={org.uniqueId}
              size="sm"
              variant="subtle"
              colorScheme="blue"
              borderRadius="6px"
              fontSize="12px"
              fontWeight="500"
            >
              <TagLabel>{org.name}</TagLabel>
              <TagCloseButton onClick={() => removeSelected(org.uniqueId)} />
            </Tag>
          ))}
        </Flex>
      )}
    </Flex>
  </Flex>

  {/* Right: Trigger button — always fixed to the right, never moves */}
  <Box flexShrink={0}>
    <Button
      size="sm"
      variant="outline"
      borderColor={triggerBorder}
      borderRadius="8px"
      fontWeight="400"
      fontSize="13px"
      color={selected.length === 0 ? 'black.400' : labelColor}
      rightIcon={isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
      onClick={() => setIsOpen((v) => !v)}
      _hover={{ bg: triggerHover }}
      whiteSpace="nowrap"
      px={3}
    >
      {selected.length === 0
        ? 'Select organizers...'
        : `${selected.length} organizer${selected.length > 1 ? 's' : ''} selected`}
    </Button>
  </Box>

</Flex>

          {/* ── Dropdown ── */}
          {isOpen && (
            <Box
              position="absolute"
right="0" 
              w="300px"
              bg={dropdownBg}
              border="1px solid"
              borderColor={dropdownBorder}
              borderRadius="10px"
              boxShadow={dropdownShadow}
              zIndex={100}
              overflow="hidden"
            >
              <Box p={2} pb={1}>
                <InputGroup size="sm">
                  <InputLeftElement pointerEvents="none" color="gray.400">
                    <MdSearch size={14} />
                  </InputLeftElement>
                  <Input
                    ref={searchRef}
                    placeholder="Search organizers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    bg={searchBg}
                    border="1px solid"
                    borderColor={searchBorder}
                    borderRadius="7px"
                    fontSize="13px"
                    _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px var(--chakra-colors-blue-400)' }}
                  />
                </InputGroup>
              </Box>

              <Box maxH="220px" overflowY="auto">
                {isLoading ? (
                  <Center py={6}><Spinner size="sm" color="blue.500" /></Center>
                ) : error ? (
                  <Text fontSize="12px" color="red.400" textAlign="center" py={4} px={3}>{error}</Text>
                ) : organizers.length === 0 ? (
                  <Text fontSize="12px" color="gray.400" textAlign="center" py={4}>No organizers found</Text>
                ) : (
                  <>
                    <Flex
                      align="center"
                      gap={3}
                      px={4}
                      py="10px"
                      cursor="pointer"
                      bg={allSelected ? itemSelectedBg : 'transparent'}
                      _hover={{ bg: allSelected ? itemSelectedBg : itemHoverBg }}
                      onClick={() => {
                        if (allSelected) {
                          setSelected([]);
                        } else {
                          setSelected(
                            organizers.map((o) => ({
                              uniqueId: o.organizerUniqueId,
                              name: o.organizerName,
                            }))
                          );
                        }
                        resetReport();
                      }}
                      transition="background 0.1s"
                    >
                      <Center
                        w="18px"
                        h="18px"
                        borderRadius="full"
                        border="2px solid"
                        borderColor={allSelected ? 'blue.500' : checkBorder}
                        bg={allSelected ? 'blue.500' : 'transparent'}
                        flexShrink={0}
                        transition="all 0.15s"
                      >
                        {allSelected && (
                          <Box as="svg" width="9px" height="9px" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                          </Box>
                        )}
                      </Center>
                      <Box flex={1} minW={0}>
                        <Text
                          fontSize="13px"
                          fontWeight={allSelected ? '600' : '400'}
                          color={allSelected ? itemSelectedText : labelColor}
                          lineHeight="1.3"
                        >
                          ALL
                        </Text>
                        <Text fontSize="11px" color={subTextColor}>All organizers</Text>
                      </Box>
                    </Flex>
                    <Divider borderColor={dividerColor} />
                    {organizers.map((org) => {
                      const checked = isChecked(org);
                      return (
                        <Flex
                          key={org.organizerUniqueId}
                          align="center"
                          gap={3}
                          px={4}
                          py="10px"
                          cursor="pointer"
                          bg={checked ? itemSelectedBg : 'transparent'}
                          _hover={{ bg: checked ? itemSelectedBg : itemHoverBg }}
                          onClick={() => toggle(org)}
                          transition="background 0.1s"
                        >
                          <Center
                            w="18px"
                            h="18px"
                            borderRadius="full"
                            border="2px solid"
                            borderColor={checked ? 'blue.500' : checkBorder}
                            bg={checked ? 'blue.500' : 'transparent'}
                            flexShrink={0}
                            transition="all 0.15s"
                          >
                            {checked && (
                              <Box as="svg" width="9px" height="9px" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                              </Box>
                            )}
                          </Center>

                          <Box flex={1} minW={0}>
                            <Text
                              fontSize="13px"
                              fontWeight={checked ? '600' : '400'}
                              color={checked ? itemSelectedText : labelColor}
                              lineHeight="1.3"
                              noOfLines={1}
                            >
                              {org.organizerName}
                            </Text>
                            <Text fontSize="11px" color={subTextColor}>
                              {org.campaignCount} campaign{org.campaignCount !== 1 ? 's' : ''}
                              {' · '}${org.totalTipAmount?.toLocaleString()}
                            </Text>
                          </Box>
                        </Flex>
                      );
                    })}
                  </>
                )}
              </Box>

              <Divider borderColor={dividerColor} />
              <Flex align="center" justify="space-between" px={4} py="10px" bg={footerBg}>
                <Button
                  size="xs"
                  variant="ghost"
                  color="gray.500"
                  fontWeight="400"
                  fontSize="12px"
                  onClick={() => { setSelected([]); resetReport(); }}
                  _hover={{ color: 'gray.700' }}
                >
                  Clear all
                </Button>
                <Button
                  size="sm"
                  leftIcon={<MdAddCircle size={14} />}
                  fontSize="12px"
                  fontWeight="600"
                  colorScheme="blue"
                  borderRadius="7px"
                  isDisabled={selected.length === 0}
                  onClick={handleViewReports}
                  px={4}
                >
                  View Reports
                </Button>
              </Flex>
            </Box>
          )}
        </Box>
      </Card>

      {/* ── Empty State ── */}
      {selected.length === 0 && !showReport && (
        <Card p="10px" bg={cardBg} mt={3}>
          <Center flexDirection="column" py={16} gap={3}>
            <Box color={emptyIconColor}>
              <Box as="svg" width="48px" height="48px" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </Box>
            </Box>
            <Text fontSize="sm" fontWeight="600" color={emptyTextColor}>No Organizers Selected</Text>
            <Text fontSize="xs" color={emptyTextColor} textAlign="center">
              Select one or more organizers from the dropdown above
              <br />to view their tip-reports across campaigns.
            </Text>
          </Center>
        </Card>
      )}

      {/* ── Report Results ── */}
      {showReport && (
        <OrganizerCampaignReport
          data={reportData}
          isLoading={isReportLoading}
          error={reportError}
          selectedCount={selected.length}
          onBack={resetReport}
        />
      )}
    </Flex>
  );
}