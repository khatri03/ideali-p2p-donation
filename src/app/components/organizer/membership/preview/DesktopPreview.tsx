import React from 'react';
import { Box, Flex, Icon, Image, Text } from '@chakra-ui/react';
import { MdImage } from 'react-icons/md';
import LaptopFrame from '../../common/devicePreviews/LaptopFrame';
import { MembershipPreviewData } from '../types';

// Convert hex → rgba so we can tint with the selected color
function rgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function DesktopPreview({
  name = 'Membership Name',
  description = '',
  selectedColor = '#3b4fcf',
  bannerImage,
  pricingTiers = [],
}: MembershipPreviewData) {
  const firstTier = pricingTiers[0];
  const isFree    = !firstTier || firstTier.price === 0;
  const price     = firstTier?.price ?? 0;
  const currency  = 'USD';
  const symbol    = '$';

  return (
    <LaptopFrame urlText="https://app.ideali.io/membership/register">
      {(isDarkMode) => {
        const bg = isDarkMode
          ? `linear-gradient(135deg, ${rgba(selectedColor, 0.12)} 0%, #111111 40%, #111111 100%)`
          : `linear-gradient(135deg, ${rgba(selectedColor, 0.08)} 0%, #f8f9ff 40%, #f8f9ff 100%)`;
        const cardBg        = isDarkMode ? '#1e1e1e' : '#ffffff';
        const textPrimary   = isDarkMode ? '#ffffff' : '#1a202c';
        const textSecondary = isDarkMode ? '#a0aec0' : '#4a5568';
        const textMuted     = isDarkMode ? '#718096' : '#a0aec0';
        const scrollThumb   = isDarkMode ? '#4a5568' : '#cbd5e0';

        // Derived from selectedColor
        const colorBg       = rgba(selectedColor, isDarkMode ? 0.08 : 0.06);
        const colorBorder   = rgba(selectedColor, isDarkMode ? 0.35 : 0.25);
        const colorMid      = rgba(selectedColor, isDarkMode ? 0.12 : 0.10);
        const colorStrong   = rgba(selectedColor, isDarkMode ? 0.25 : 0.15);

        return (
          <Box position="relative" minH="100%" px={3} py={4} display="flex" flexDirection="column" gap={3} overflow="hidden" style={{ background: bg }}>

            {/* ── Decorative background blobs from selectedColor ── */}
            <Box
              position="absolute" top="-40px" right="-40px"
              w="180px" h="180px" borderRadius="full"
              bg={rgba(selectedColor, isDarkMode ? 0.12 : 0.08)}
              pointerEvents="none"
              style={{ filter: 'blur(40px)' }}
            />
            <Box
              position="absolute" bottom="-30px" left="-30px"
              w="140px" h="140px" borderRadius="full"
              bg={rgba(selectedColor, isDarkMode ? 0.10 : 0.06)}
              pointerEvents="none"
              style={{ filter: 'blur(35px)' }}
            />

            {/* ── Row 1: Banner + About ── */}
            <Flex h="220px" align="stretch" gap={3} px={1} position="relative" zIndex={1}>

              {/* Banner */}
              <Box flex={3} minW={0} overflow="hidden" borderRadius="xl"
                boxShadow={`0 6px 20px ${rgba(selectedColor, 0.3)}`}
                border={`1.5px solid ${colorBorder}`}
              >
                {bannerImage ? (
                  <Image src={bannerImage} alt="banner" w="full" h="full" objectFit="cover" display="block" />
                ) : (
                  <Box
                    w="full" h="full"
                    bg={isDarkMode ? '#252525' : '#f0f2f7'}
                    display="flex" flexDirection="column" alignItems="center" justifyContent="center"
                    gap={2} position="relative" overflow="hidden"
                  >
                    <Box
                      position="absolute" inset={0} opacity={0.5}
                      style={{
                        backgroundImage: isDarkMode
                          ? 'radial-gradient(circle, #3a3a3a 1px, transparent 1px)'
                          : 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
                        backgroundSize: '18px 18px',
                      }}
                    />
                    <Icon as={MdImage} boxSize={9} color={isDarkMode ? '#4a5568' : '#9ca3af'} position="relative" zIndex={1} />
                    <Text fontSize="xs" fontWeight="semibold" color={isDarkMode ? '#718096' : '#9ca3af'} position="relative" zIndex={1}>
                      Your Membership Image
                    </Text>
                  </Box>
                )}
              </Box>

              {/* About This Membership */}
              <Box flex={2} minW={0} bg={cardBg}
                border={`1.5px solid ${colorBorder}`}
                borderRadius="xl" overflow="hidden"
                display="flex" flexDirection="column"
                boxShadow={`0 2px 16px ${rgba(selectedColor, isDarkMode ? 0.2 : 0.12)}`}
              >
                {/* Heading with color accent bar */}
                <Box
                  px={4} pt={4} pb={2}
                  borderBottom={`2px solid ${colorBorder}`}
                  bg={colorBg} flexShrink={0}
                  display="flex" alignItems="center" gap={2}
                >
                  <Box w="3px" h="14px" borderRadius="full" bg={selectedColor} flexShrink={0} />
                  <Text fontSize="xs" fontWeight="bold" color={selectedColor} letterSpacing="tight">
                    About This Membership
                  </Text>
                </Box>
                <Box flex={1} overflowY="auto" px={4} py={3} fontSize="2xs" color={textSecondary}
                  lineHeight="tall"
                  dangerouslySetInnerHTML={{ __html: description || 'No description provided.' }}
                  sx={{
                    '::-webkit-scrollbar': { width: '3px' },
                    '::-webkit-scrollbar-thumb': { bg: scrollThumb, borderRadius: 'full' },
                    '& *': { color: `${textSecondary} !important` },
                  }}
                />
              </Box>
            </Flex>

            {/* ── Row 2: Membership details + Total Payable ── */}
            <Flex align="stretch" gap={3} px={1} pb={1} position="relative" zIndex={1}>

              {/* Membership details */}
              <Box flex={3} minW={0} bg={cardBg}
                border={`1.5px solid ${colorBorder}`}
                borderRadius="xl" p={3}
                boxShadow={`0 2px 12px ${rgba(selectedColor, isDarkMode ? 0.2 : 0.10)}`}
              >
                {/* Color accent strip at top */}
                <Box h="3px" bg={`linear-gradient(90deg, ${selectedColor}, transparent)`}
                  borderRadius="full" mb={2.5} mx={-3} mt={-3} />
                <Text fontSize="sm" fontWeight="bold" color={textPrimary} mb={0.5} noOfLines={1}>{name}</Text>
                <Text fontSize="2xs" fontWeight="semibold" color={selectedColor} opacity={0.8} mb={2}>by Ideali</Text>
                <Text fontSize="8px" fontWeight="bold" color={textMuted} textTransform="uppercase" letterSpacing="widest" mb={0.5}>
                  Amount
                </Text>
                {isFree ? (
                  <Text fontSize="md" fontWeight="bold" color="green.400">Free</Text>
                ) : (
                  <Text fontSize="md" fontWeight="extrabold" color={selectedColor}>
                    {currency} {symbol}{price.toFixed(2)}
                  </Text>
                )}
              </Box>

              {/* Total payable — uses selectedColor gradient */}
              <Box flex={2} minW={0}
                borderRadius="xl" p={3} color="white"
                style={{ background: selectedColor }}
                boxShadow={`0 4px 20px ${rgba(selectedColor, 0.5)}`}
                display="flex" flexDirection="column" justifyContent="center"
                position="relative" overflow="hidden"
              >
                {/* Decorative circles */}
                <Box position="absolute" top="-25px" right="-25px" w="90px" h="90px" borderRadius="full" bg="whiteAlpha.100" pointerEvents="none" />
                <Box position="absolute" top="-8px" right="-8px" w="50px" h="50px" borderRadius="full" bg="whiteAlpha.100" pointerEvents="none" />
                <Box position="absolute" bottom="-20px" left="-20px" w="70px" h="70px" borderRadius="full" bg="whiteAlpha.100" pointerEvents="none" />
                <Box position="absolute" bottom="12px" right="8px" w="28px" h="28px" borderRadius="full" bg="whiteAlpha.100" pointerEvents="none" />
                <Box position="absolute" top="50%" left="-12px" w="36px" h="36px" borderRadius="full" bg="whiteAlpha.100" pointerEvents="none" />
                <Text fontSize="8px" fontWeight="bold" textTransform="uppercase" letterSpacing="widest" mb={1} opacity={0.8}>
                  Total Payable
                </Text>
                <Text fontSize="md" fontWeight="extrabold" mb={2}>
                  {isFree ? 'Free' : `${currency} ${symbol}${price.toFixed(2)}`}
                </Text>
                <Box h="1px" bg="whiteAlpha.300" mb={2} />
                <Text fontSize="2xs" opacity={0.7} lineHeight="tall">
                  Taxes and tips calculated at payment step.
                </Text>
              </Box>
            </Flex>

            {/* Sticky footer */}
            <Box
              position="sticky" bottom={0}
              bg={cardBg} borderTop={`1px solid ${colorBorder}`}
              px={3} py={2} mx={-3} mb={-4}
              display="flex" justifyContent="flex-end"
              zIndex={10}
              style={{ backdropFilter: 'blur(8px)' }}
            >
              <Box
                bg={selectedColor} color="white"
                fontSize="2xs" fontWeight="bold"
                px={3} py={1.5} borderRadius="lg"
                boxShadow={`0 2px 8px ${rgba(selectedColor, 0.4)}`}
              >
                Continue →
              </Box>
            </Box>

          </Box>
        );
      }}
    </LaptopFrame>
  );
}
