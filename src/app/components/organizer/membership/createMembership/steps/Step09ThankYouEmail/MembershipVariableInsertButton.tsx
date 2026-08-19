import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Button, Divider, Flex, Spinner, Text, Tooltip } from '@chakra-ui/react';
import { MdPerson, MdArrowDropDown, MdArrowDropUp } from 'react-icons/md';
import membershipEmailTemplateService from 'app/components/organizer/membership/services/membershipEmailTemplateService';

interface VariableItem {
  uniqueId: string;
  displayText: string;
  placeHolderText: string;
}

interface VariableGroups {
  member:         VariableItem[];
  membershipType: VariableItem[];
  invoice:        VariableItem[];
  organizer:      VariableItem[];
  other:          VariableItem[];
}

const CATEGORIES: { key: keyof VariableGroups; label: string }[] = [
  { key: 'member',         label: 'Member' },
  { key: 'membershipType', label: 'Membership' },
  { key: 'invoice',        label: 'Invoice' },
  { key: 'organizer',      label: 'Organizer' },
  { key: 'other',          label: 'Other' },
];

interface Props {
  onInsert: (placeholder: string) => void;
  size?: 'xs' | 'sm' | 'md';
}

export default function MembershipVariableInsertButton({ onInsert, size = 'sm' }: Props) {
  const [isOpen, setIsOpen]               = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const wrapperRef                        = useRef<HTMLDivElement>(null);
  const hasFetched                        = useRef(false);

  const [groups, setGroups]       = useState<VariableGroups>({ member: [], membershipType: [], invoice: [], organizer: [], other: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchGroups = useCallback(async () => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await membershipEmailTemplateService.getEmailPlaceHolders();
      if (res?.success && res?.data) {
        setGroups({
          member:         (res.data as any).member         ?? [],
          membershipType: (res.data as any).membershipType ?? [],
          invoice:        res.data.invoice                 ?? [],
          organizer:      res.data.organizer               ?? [],
          other:          res.data.other                   ?? [],
        });
      }
    } catch {
      setLoadError('Failed to load variables.');
      hasFetched.current = false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const computeStyle = (): React.CSSProperties => {
    if (!wrapperRef.current) return {};
    const rect = wrapperRef.current.getBoundingClientRect();
    const vpW  = window.innerWidth;
    const W    = Math.min(200, vpW - 16);
    let left   = rect.left;
    if (left + W > vpW - 8) left = vpW - W - 8;
    if (left < 8) left = 8;
    return { position: 'fixed', top: rect.bottom + 4, left, width: W, maxHeight: `${Math.max(150, window.innerHeight - rect.bottom - 20)}px` };
  };

  const toggleDropdown = () => {
    if (isOpen) { setIsOpen(false); }
    else { setDropdownStyle(computeStyle()); fetchGroups(); setIsOpen(true); }
  };

  const hasAny = CATEGORIES.some(({ key }) => groups[key].length > 0);
  const hoverOn  = (e: React.MouseEvent) => { (e.currentTarget as HTMLElement).style.background = '#EBF8FF'; };
  const hoverOff = (e: React.MouseEvent) => { (e.currentTarget as HTMLElement).style.background = ''; };

  return (
    <Box ref={wrapperRef} display="inline-block" position="relative">
      <Tooltip label="Insert variable" fontSize="xs" openDelay={400}>
        <Button size={size} variant="outline" leftIcon={<MdPerson size={15} />}
          rightIcon={isOpen ? <MdArrowDropUp /> : <MdArrowDropDown />}
          onClick={toggleDropdown} colorScheme="gray" fontWeight="500">
          Variable
        </Button>
      </Tooltip>

      {isOpen && (
        <Box style={dropdownStyle} bg="white" border="1px solid" borderColor="gray.200"
          borderRadius="md" boxShadow="lg" zIndex={2000} overflowY="auto" overflowX="hidden">
          {isLoading && (
            <Flex align="center" gap={2} px={3} py={3}>
              <Spinner size="xs" color="blue.500" />
              <Text fontSize="xs" color="gray.500">Loading…</Text>
            </Flex>
          )}
          {!isLoading && loadError && <Text fontSize="xs" color="red.400" px={3} py={3}>{loadError}</Text>}
          {!isLoading && !loadError && !hasAny && <Text fontSize="xs" color="gray.400" px={3} py={3}>No variables available</Text>}
          {!isLoading && !loadError && hasAny && CATEGORIES.map(({ key, label }) => {
            const items = groups[key];
            if (!items.length) return null;
            return (
              <React.Fragment key={key}>
                <Box px={2} py={1} bg="gray.50" cursor="default" userSelect="none">
                  <Text fontSize="10px" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="0.05em">{label}</Text>
                </Box>
                {items.map((v) => (
                  <Box key={v.uniqueId} pl={5} pr={3} py="7px" fontSize="xs" cursor="pointer"
                    userSelect="none" style={{ transition: 'background 0.1s' }}
                    onMouseEnter={hoverOn} onMouseLeave={hoverOff}
                    onClick={() => { onInsert(v.placeHolderText); setIsOpen(false); }}>
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
