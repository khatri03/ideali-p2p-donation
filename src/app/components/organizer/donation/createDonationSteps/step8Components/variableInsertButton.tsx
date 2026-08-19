import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Divider,
  Flex,
  Spinner,
  Text,
  Tooltip,
} from '@chakra-ui/react';
import { MdPerson, MdArrowDropDown, MdArrowDropUp } from 'react-icons/md';
import campaignEditorService from '../../../../../service/organizer/donation/campaignEditorService';

// ─── Types ────────────────────────────────────────────────────────────────────

interface VariableItem {
  uniqueId: string;
  displayText: string;
  placeHolderText: string;
}

interface VariableGroups {
  donor:     VariableItem[];
  donation:  VariableItem[];
  invoice:   VariableItem[];
  organizer: VariableItem[];
  other:     VariableItem[];
}

interface VariableInsertButtonProps {
  onInsert: (placeholder: string) => void;
  size?: 'xs' | 'sm' | 'md';
}

const CATEGORIES: { key: keyof VariableGroups; label: string }[] = [
  { key: 'donor',     label: 'Donor' },
  { key: 'donation',  label: 'Donation' },
  { key: 'invoice',   label: 'Invoice' },
  { key: 'organizer', label: 'Organizer' },
  { key: 'other',     label: 'Other' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function VariableInsertButton({
  onInsert,
  size = 'sm',
}: VariableInsertButtonProps) {

  const [isOpen, setIsOpen]               = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const wrapperRef                        = useRef<HTMLDivElement>(null);
  const hasFetched                        = useRef(false);

  const [groups, setGroups]       = useState<VariableGroups>({
    donor: [], donation: [], invoice: [], organizer: [], other: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // ── outside click ─────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── recompute position on resize ──────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const handler = () => setDropdownStyle(computeStyle());
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [isOpen]);

  // ── fetch once ────────────────────────────────────────────────────────────
  const fetchGroups = useCallback(async () => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await campaignEditorService.getEmailPlaceHolders();
      if (res?.success && res?.data) {
        setGroups({
          donor:     res.data.donor     ?? [],
          donation:  res.data.donation  ?? [],
          invoice:   res.data.invoice   ?? [],
          organizer: res.data.organizer ?? [],
          other:     res.data.other     ?? [],
        });
      }
    } catch {
      setLoadError('Failed to load variables.');
      hasFetched.current = false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── position ──────────────────────────────────────────────────────────────
  const computeStyle = (): React.CSSProperties => {
    if (!wrapperRef.current) return {};
    const DROPDOWN_W = 200;
    const MARGIN     = 8;
    const rect       = wrapperRef.current.getBoundingClientRect();
    const vpW        = window.innerWidth;
    const availableW = vpW - MARGIN * 2;
    const finalW     = Math.min(DROPDOWN_W, availableW);

    let left = rect.left;
    if (vpW <= 400) {
      left = MARGIN;
    } else {
      if (left + finalW > vpW - MARGIN) left = vpW - finalW - MARGIN;
      if (left < MARGIN) left = MARGIN;
    }

    const maxH = Math.max(150, window.innerHeight - rect.bottom - 20);

    return {
      position: 'fixed',
      top:    rect.bottom + 4,
      left:   left,
      width:  vpW <= 400 ? availableW : finalW,
      maxHeight: `${maxH}px`,
    };
  };

  // ── toggle ────────────────────────────────────────────────────────────────
  const toggleDropdown = () => {
    if (isOpen) {
      setIsOpen(false);
    } else {
      setDropdownStyle(computeStyle());
      fetchGroups();
      setIsOpen(true);
    }
  };

  const hasAny = CATEGORIES.some(({ key }) => groups[key].length > 0);

  // ── hover helpers ─────────────────────────────────────────────────────────
  const hoverOn  = (e: React.MouseEvent) => { (e.currentTarget as HTMLElement).style.background = '#EBF8FF'; };
  const hoverOff = (e: React.MouseEvent) => { (e.currentTarget as HTMLElement).style.background = ''; };

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <Box ref={wrapperRef} display="inline-block" position="relative">

      {/* Trigger */}
      <Tooltip label="Insert variable" fontSize="xs" openDelay={400}>
        <Button
          size={size}
          variant="outline"
          leftIcon={<MdPerson size={15} />}
          rightIcon={isOpen ? <MdArrowDropUp /> : <MdArrowDropDown />}
          onClick={toggleDropdown}
          colorScheme="gray"
          fontWeight="500"
        >
          Variable
        </Button>
      </Tooltip>

      {/* Dropdown — exact same style as emailEditor MenuList */}
      {isOpen && (
        <Box
          style={dropdownStyle}
          bg="white"
          border="1px solid"
          borderColor="gray.200"
          borderRadius="md"
          boxShadow="lg"
          zIndex={2000}
          overflowY="auto"
          overflowX="hidden"
        >
          {/* Loading */}
          {isLoading && (
            <Flex align="center" gap={2} px={3} py={3}>
              <Spinner size="xs" color="blue.500" />
              <Text fontSize="xs" color="gray.500">Loading…</Text>
            </Flex>
          )}

          {/* Error */}
          {!isLoading && loadError && (
            <Text fontSize="xs" color="red.400" px={3} py={3}>{loadError}</Text>
          )}

          {/* Empty */}
          {!isLoading && !loadError && !hasAny && (
            <Text fontSize="xs" color="gray.400" px={3} py={3}>No variables available</Text>
          )}

          {/* Variable list — same pattern as emailEditor toolbar */}
          {!isLoading && !loadError && hasAny && CATEGORIES.map(({ key, label }, idx) => {
            const items = groups[key];
            if (!items.length) return null;
            return (
              <React.Fragment key={key}>
                {/* Category heading — disabled, not clickable, same as MenuList */}
                <Box
                  px={2}
                  py={1}
                  bg="gray.50"
                  cursor="default"
                  userSelect="none"
                >
                  <Text
                    fontSize="10px"
                    fontWeight="700"
                    color="gray.500"
                    textTransform="uppercase"
                    letterSpacing="0.05em"
                  >
                    {label}
                  </Text>
                </Box>

                {/* Variable items — same pl={5} indent as emailEditor */}
                {items.map((v) => (
                  <Box
                    key={v.uniqueId}
                    pl={5}
                    pr={3}
                    py="7px"
                    fontSize="xs"
                    cursor="pointer"
                    userSelect="none"
                    style={{ transition: 'background 0.1s' }}
                    onMouseEnter={hoverOn}
                    onMouseLeave={hoverOff}
                    onClick={() => {
                      onInsert(v.placeHolderText);
                      setIsOpen(false);
                    }}
                  >
                    <Text fontSize="xs" color="gray.700">{v.displayText}</Text>
                  </Box>
                ))}

                <Divider />
              </React.Fragment>
            );
          })}
        </Box>
      )}
    </Box>
  );
}