import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Avatar,
  Box,
  Collapse,
  Divider,
  Flex,
  Icon,
  IconButton,
  SimpleGrid,
  Text,
  useColorModeValue,
  useDisclosure,
} from '@chakra-ui/react';
import { ElementType, ReactNode, useEffect, useState } from 'react';
import {
  MdEmail,
  MdKeyboardArrowDown,
  MdLocationOn,
  MdPhone,
} from 'react-icons/md';
import Loader from 'app/components/common/Loader';
import StatusBadge, { STATUS_COLOR } from 'app/components/common/StatusBadge';
import membershipHistoryService, { MembershipHistoryItem } from '../services/membershipHistoryService';

function resolveImageUrl(photoUrl: string | null | undefined): string {
  if (!photoUrl) return '';
  if (/^https?:\/\//i.test(photoUrl)) return photoUrl;
  const baseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
  return `${baseUrl}${photoUrl.startsWith('/') ? '' : '/'}${photoUrl}`;
}

const ACCENT_COLORS = ['orange.400', 'gray.400', 'purple.400', 'brand.500', 'teal.400'];

function formatDate(utc: string) {
  return new Date(utc).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

// Rough renewal cadence derived from the real start/expiry dates — not fabricated.
function tenureLabel(startUtc: string, expiryUtc: string): string | null {
  const days = (new Date(expiryUtc).getTime() - new Date(startUtc).getTime()) / 86400000;
  if (!Number.isFinite(days) || days <= 0) return null;
  if (days <= 45) return 'Monthly';
  if (days <= 100) return 'Quarterly';
  if (days >= 300 && days <= 400) return 'Annual';
  if (days > 3650) return 'Lifetime';
  return null;
}

function ContactRow({ icon, children }: { icon: ElementType; children: ReactNode }) {
  const bg = useColorModeValue('gray.200', 'navy.500');
  const textColor = useColorModeValue('#1B2559', 'white');
  return (
    <Flex align="center" gap="10px" bg={bg} borderRadius="12px" px="12px" py="10px">
      <Icon as={icon} color="#A3AED0" w="16px" h="16px" flexShrink={0} />
      <Text
        fontSize="sm"
        color={textColor}
        overflow="hidden"
        textOverflow="ellipsis"
        whiteSpace="nowrap"
      >
        {children}
      </Text>
    </Flex>
  );
}

function FieldTile({ label, children }: { label: string; children: ReactNode }) {
  const labelColor = useColorModeValue('gray.400', 'gray.500');
  const valueColor = useColorModeValue('#1B2559', 'white');
  return (
    <Box>
      <Text fontSize="10px" fontWeight="700" color={labelColor} textTransform="uppercase" letterSpacing="wide" mb="4px">
        {label}
      </Text>
      <Box fontSize="sm" fontWeight="600" color={valueColor}>
        {children}
      </Box>
    </Box>
  );
}

function MembershipRow({ item, accentColor }: { item: MembershipHistoryItem; accentColor: string }) {
  const rowBg = useColorModeValue('#F4F5F9', 'navy.700');
  const textColor = useColorModeValue('#1B2559', 'white');
  const tenure = tenureLabel(item.membershipStartUtc, item.membershipExpiryUtc);

  const duration = `${formatDate(item.membershipStartUtc)} – ${formatDate(item.membershipExpiryUtc)}`;
  const userName = item.contact?.email ? item.contact.email.split('@')[0] : '—';
  const location = [item.address.city, item.address.state, item.address.country].filter(Boolean).join(', ') || '—';
  const address = [item.address.streetLine1, item.address.streetLine2, item.address.city, item.address.state, item.address.zipCode, item.address.country]
    .filter(Boolean)
    .join(', ') || '—';

  return (
    <AccordionItem border="none" mb="10px">
      {({ isExpanded }) => (
        <Box
          bg={rowBg}
          borderRadius="12px"
          borderLeft="4px solid"
          borderLeftColor={accentColor}
          overflow="hidden"
        >
          <AccordionButton
            px="16px"
            py="12px"
            _hover={{ bg: 'transparent' }}
            borderRadius="12px"
          >
            <Flex flex="1" align="center" gap="10px" flexWrap="wrap" textAlign="left">
              <Text fontWeight="700" fontSize="sm" color={textColor}>
                {item.membershipName}
              </Text>
              <StatusBadge label={item.membershipStatus} variant="status" size="sm" />
              {tenure && <StatusBadge label={tenure} variant="tag" colorScheme="teal" size="sm" />}
            </Flex>
            <AccordionIcon color={textColor} />
          </AccordionButton>

          {isExpanded && (
            <AccordionPanel px="16px" pb="16px" pt="4px">
           
              <SimpleGrid columns={{ base: 1, sm: 2 }} spacingX="24px" spacingY="28px">
                <FieldTile label="Membership Duration">{duration}</FieldTile>
                <FieldTile label="Membership Status">
                  <Flex align="center" gap="6px">
                    <Box w="8px" h="8px" borderRadius="full" bg={STATUS_COLOR[item.membershipStatus] ?? 'gray.400'} flexShrink={0} />
                    {item.membershipStatus}
                  </Flex>
                </FieldTile>
                <FieldTile label="User Name">{userName}</FieldTile>
                <FieldTile label="Location">{location}</FieldTile>
                <FieldTile label="Membership ID">
                  <Text noOfLines={1} fontWeight="600" fontSize="sm">{item.uniqueId}</Text>
                </FieldTile>
                <FieldTile label="Address">
                  <Text whiteSpace="normal" fontWeight="600" fontSize="sm">{address}</Text>
                </FieldTile>
              </SimpleGrid>
            </AccordionPanel>
          )}
        </Box>
      )}
    </AccordionItem>
  );
}

function MembershipInfoCard({ mb }: { mb?: string }) {
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: true });

  const [history, setHistory] = useState<MembershipHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  const cardBg = useColorModeValue('white', 'navy.800');
  const textColor = useColorModeValue('#1B2559', 'white');
  const subColor = useColorModeValue('#A3AED0', '#A3AED0');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const dividerColor = useColorModeValue('gray.200', 'whiteAlpha.100');

  const userUniqueId = localStorage.getItem('memberUniqueId') ?? '';

  useEffect(() => {
    if (!userUniqueId) { setLoading(false); return; }
    membershipHistoryService.getMembershipHistory().then((res) => {
      const sorted = [...res].sort(
        (a, b) => new Date(b.membershipStartUtc).getTime() - new Date(a.membershipStartUtc).getTime(),
      );
      setHistory(sorted);
      setLoading(false);
    });
  }, [userUniqueId]);

  if (loading) {
    return (
      <Box bg={cardBg} borderRadius="20px" boxShadow="sm" border="1px" borderColor={borderColor} mb={mb}>
        <Loader message="Loading membership information…" subtitle="Please wait while we fetch your membership details" />
      </Box>
    );
  }

  const current = history[activeIndex] ?? history[0] ?? null;
  const contact = current?.contact;
  const fullName = contact
    ? [contact.firstName, contact.middleName, contact.lastName].filter(Boolean).join(' ')
    : localStorage.getItem('userName') || 'Member';
  const email = contact?.email || '';
  const phone = contact?.cellPhone || '';
  const location = current
    ? [current.address.city, current.address.state, current.address.country].filter(Boolean).join(', ')
    : '';

  return (
    <Box
      bg={cardBg}
      borderRadius="20px"
      boxShadow="sm"
      border="1px"
      borderColor={borderColor}
      mb={mb}
      overflow="hidden"
    >
      <Flex align="center" justify="space-between" px="24px" py="18px">
        <Text color={textColor} fontWeight="700" fontSize="md">Membership Information</Text>
        <IconButton
          aria-label={isOpen ? 'Collapse' : 'Expand'}
          icon={
            <Icon
              as={MdKeyboardArrowDown}
              transition="transform 0.2s"
              transform={isOpen ? 'rotate(180deg)' : 'rotate(0deg)'}
            />
          }
          size="sm"
          variant="outline"
          borderColor={dividerColor}
          onClick={onToggle}
        />
      </Flex>
      <Divider borderColor={dividerColor} />

      <Collapse in={isOpen} animateOpacity>
        <Flex direction={{ base: 'column', md: 'row' }}>
          {/* Left column */}
          <Box
            w={{ base: '100%', md: '260px' }}
            flexShrink={0}
            p="24px"
          >
            <Flex direction="column" align="center" textAlign="center" gap="0" mb="16px">
              <Box
                position="relative"
                borderRadius="full"
                p="3px"
                bgGradient="linear(to-br, purple.300, brand.400, orange.200)"
                mb="10px"
              >
                <Avatar
                  name={fullName}
                  src={resolveImageUrl(current?.photoUrl) || undefined}
                  size="xl"
                  bg="brand.500"
                  color="white"
                  border="2px solid white"
                />
              </Box>
              <Text color={textColor} fontWeight="700" fontSize="md" noOfLines={2}>
                {fullName}
              </Text>
            </Flex>

            <Flex direction="column" gap="8px">
              {email && <ContactRow icon={MdEmail}>{email}</ContactRow>}
              {phone && <ContactRow icon={MdPhone}>{phone}</ContactRow>}
              {location && <ContactRow icon={MdLocationOn}>{location}</ContactRow>}
            </Flex>
          </Box>

          {/* Mobile: horizontal divider under the profile column */}
          <Divider display={{ base: 'block', md: 'none' }} borderColor={dividerColor} />
          {/* Desktop: vertical divider between the two columns */}
          <Box display={{ base: 'none', md: 'block' }} w="1px" alignSelf="stretch" bg={dividerColor} flexShrink={0} />

          {/* Right column — one dropdown row per membership */}
          <Box flex="1" minW="0" p="16px">
            {history.length > 0 ? (
              <Accordion index={activeIndex} onChange={(idx) => setActiveIndex(idx as number)}>
                {history.map((item, i) => (
                  <MembershipRow key={item.uniqueId} item={item} accentColor={ACCENT_COLORS[i % ACCENT_COLORS.length]} />
                ))}
              </Accordion>
            ) : (
              <Flex align="center" justify="center" py="40px">
                <Text color={subColor} fontSize="sm">No membership records found.</Text>
              </Flex>
            )}
          </Box>
        </Flex>
      </Collapse>
    </Box>
  );
}

export default MembershipInfoCard;
