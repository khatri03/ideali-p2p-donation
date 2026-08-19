import { Box, Icon, Image, Text } from '@chakra-ui/react';
import { MdImage } from 'react-icons/md';
import PhoneFrame from '../../common/devicePreviews/PhoneFrame';
import { MembershipPreviewData } from '../types';

function rgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function MobilePreview({
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
    <PhoneFrame>
      {(isDarkMode) => {
        const bg = isDarkMode
          ? `linear-gradient(135deg, ${rgba(selectedColor, 0.12)} 0%, #111111 40%, #111111 100%)`
          : `linear-gradient(135deg, ${rgba(selectedColor, 0.08)} 0%, #f8f9ff 40%, #f8f9ff 100%)`;
        const cardBg        = isDarkMode ? '#1e1e1e' : '#ffffff';
        const textPrimary   = isDarkMode ? '#ffffff' : '#1a202c';
        const textSecondary = isDarkMode ? '#a0aec0' : '#4a5568';
        const textMuted     = isDarkMode ? '#718096' : '#a0aec0';
        const scrollThumb   = isDarkMode ? '#4a5568' : '#cbd5e0';

        const colorBg     = rgba(selectedColor, isDarkMode ? 0.08 : 0.06);
        const colorBorder = rgba(selectedColor, isDarkMode ? 0.35 : 0.25);

        return (
          <Box
            position="relative" display="flex" flexDirection="column"
            h="100%" overflow="hidden" style={{ background: bg }}
          >
            {/* ── Decorative blobs ── */}
            <Box position="absolute" top="-30px" right="-30px" w="130px" h="130px"
              borderRadius="full" bg={rgba(selectedColor, isDarkMode ? 0.12 : 0.08)}
              pointerEvents="none" style={{ filter: 'blur(30px)' }}
            />
            <Box position="absolute" bottom="20px" left="-20px" w="100px" h="100px"
              borderRadius="full" bg={rgba(selectedColor, isDarkMode ? 0.10 : 0.06)}
              pointerEvents="none" style={{ filter: 'blur(25px)' }}
            />

            {/* ── Scrollable content ── */}
            <Box flex={1} overflowY="auto" display="flex" flexDirection="column" gap={3}
              sx={{
                '::-webkit-scrollbar': { width: '3px' },
                '::-webkit-scrollbar-thumb': { bg: scrollThumb, borderRadius: 'full' },
              }}
            >
              {/* Banner */}
              <Box h="150px" overflow="hidden" flexShrink={0} position="relative" zIndex={1}>
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
                    <Icon as={MdImage} boxSize={8} color={isDarkMode ? '#4a5568' : '#9ca3af'} position="relative" zIndex={1} />
                    <Text fontSize="xs" fontWeight="semibold" color={isDarkMode ? '#718096' : '#9ca3af'} position="relative" zIndex={1}>
                      Your Membership Image
                    </Text>
                  </Box>
                )}
              </Box>

              <Box px={3} display="flex" flexDirection="column" gap={3} pb={3} position="relative" zIndex={1}>

                {/* About This Membership */}
                <Box bg={cardBg} border={`1.5px solid ${colorBorder}`} borderRadius="xl"
                  overflow="hidden" boxShadow={`0 2px 12px ${rgba(selectedColor, isDarkMode ? 0.2 : 0.10)}`} minH="140px"
                >
                  <Box px={3} pt={3} pb={1.5} bg={colorBg} borderBottom={`2px solid ${colorBorder}`}
                    display="flex" alignItems="center" gap={2}
                  >
                    <Box w="3px" h="12px" borderRadius="full" bg={selectedColor} flexShrink={0} />
                    <Text fontSize="xs" fontWeight="bold" color={selectedColor} letterSpacing="tight">
                      About This Membership
                    </Text>
                  </Box>
                  <Box px={3} py={2.5} fontSize="xs" color={textSecondary} lineHeight="tall"
                    dangerouslySetInnerHTML={{ __html: description || 'No description provided.' }}
                    sx={{ '& *': { color: `${textSecondary} !important` } }}
                  />
                </Box>

                 {/* Total Payable */}
                <Box borderRadius="xl" p={4} color="white"
                  style={{ background: selectedColor }}
                  boxShadow={`0 4px 16px ${rgba(selectedColor, 0.45)}`}
                  position="relative" overflow="hidden"
                >
                  {/* Decorative circles */}
                  <Box position="absolute" top="-20px" right="-20px" w="80px" h="80px" borderRadius="full" bg="whiteAlpha.100" pointerEvents="none" />
                  <Box position="absolute" top="-6px" right="-6px" w="44px" h="44px" borderRadius="full" bg="whiteAlpha.100" pointerEvents="none" />
                  <Box position="absolute" bottom="-18px" left="-18px" w="65px" h="65px" borderRadius="full" bg="whiteAlpha.100" pointerEvents="none" />
                  <Box position="absolute" bottom="10px" right="6px" w="24px" h="24px" borderRadius="full" bg="whiteAlpha.100" pointerEvents="none" />
                  <Box position="absolute" top="50%" left="-10px" w="32px" h="32px" borderRadius="full" bg="whiteAlpha.100" pointerEvents="none" />
                  <Text fontSize="9px" fontWeight="bold" textTransform="uppercase" letterSpacing="widest" mb={1} opacity={0.8}>
                    Total Payable
                  </Text>
                  <Text fontSize="md" fontWeight="extrabold" mb={3}>
                    {isFree ? 'Free' : `${currency} ${symbol}${price.toFixed(2)}`}
                  </Text>
                  <Box h="1px" bg="whiteAlpha.300" mb={2.5} />
                  <Text fontSize="xs" opacity={0.7} lineHeight="tall">
                    Taxes and tips calculated at payment step.
                  </Text>
                </Box>

                {/* Membership details */}
                <Box bg={cardBg} border={`1.5px solid ${colorBorder}`} borderRadius="xl" p={4}
                  boxShadow={`0 2px 10px ${rgba(selectedColor, isDarkMode ? 0.2 : 0.10)}`}
                  overflow="hidden" position="relative"
                >
                  <Box position="absolute" top={0} left={0} right={0} h="3px"
                    bgGradient={`linear(90deg, ${selectedColor}, transparent)`}
                  />
                  <Text fontSize="sm" fontWeight="bold" color={textPrimary} mb={1} noOfLines={1}>{name}</Text>
                  <Text fontSize="xs" fontWeight="semibold" color={selectedColor} opacity={0.8} mb={3}>by Ideali</Text>
                  <Text fontSize="9px" fontWeight="bold" color={textMuted} textTransform="uppercase" letterSpacing="widest" mb={1}>
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

               

              </Box>
            </Box>

            {/* ── Pinned Continue button ── */}
            <Box
              flexShrink={0} px={3} pt={2} pb={3} zIndex={10}
              borderTop={`1px solid ${colorBorder}`}
              style={{ background: isDarkMode ? 'rgba(17,17,17,0.85)' : 'rgba(248,249,255,0.85)', backdropFilter: 'blur(8px)' }}
            >
              <Box
                bg={selectedColor} color="white" textAlign="center"
                fontSize="sm" fontWeight="bold" py={3} borderRadius="xl"
                boxShadow={`0 4px 14px ${rgba(selectedColor, 0.45)}`}
              >
                Continue →
              </Box>
            </Box>
          </Box>
        );
      }}
    </PhoneFrame>
  );
}
