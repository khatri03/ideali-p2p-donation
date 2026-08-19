import { Box, Flex, Image, Text } from '@chakra-ui/react';
import RegistrationFooter from './RegistrationFooter';
import { MemberRegistrationInfo } from '../types';

interface Props {
  info: MemberRegistrationInfo;
  onContinue: () => void;
  onCancel: () => void;
}

function rgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function Step1MembershipInfo({
  info,
  onContinue,
  onCancel,
}: Props) {
  const { membershipDetail, paymentSettings } = info;
  const symbol = paymentSettings?.paymentCurrencySymbol ?? '$';
  const currency = paymentSettings?.paymentCurrencyCode ?? 'USD';
  const color = membershipDetail.color ?? '#044bd9';

  // Derived color tokens
  const colorBg = rgba(color, 0.06);
  const colorBorder = rgba(color, 0.25);
  const colorShadow = rgba(color, 0.12);
  const pageBg = `linear-gradient(135deg, ${rgba(color, 0.06)} 0%, #f7faff 35%, #f7faff 100%)`;

  return (
    <Box
      flex={1}
      display="flex"
      flexDirection="column"
      minH={0}
      style={{ background: pageBg }}
    >
      {/* Scrollable content */}
      <Box
        flex={1}
        overflowY="auto"
        px={{ base: 3, md: 6 }}
        py={5}
        position="relative"
      >
        {/* Decorative background blobs */}
        <Box
          position="fixed"
          top="80px"
          right="60px"
          w="300px"
          h="300px"
          borderRadius="full"
          bg={rgba(color, 0.07)}
          pointerEvents="none"
          style={{ filter: 'blur(60px)', zIndex: 0 }}
        />
        <Box
          position="fixed"
          bottom="100px"
          left="40px"
          w="200px"
          h="200px"
          borderRadius="full"
          bg={rgba(color, 0.05)}
          pointerEvents="none"
          style={{ filter: 'blur(50px)', zIndex: 0 }}
        />

        <Box
          bg="white"
          borderRadius="2xl"
          border={`1px solid ${colorBorder}`}
          boxShadow={`0 4px 24px ${colorShadow}`}
          p={4}
          display="flex"
          flexDirection="column"
          gap={4}
          position="relative"
          zIndex={1}
        >
          {/* ── Row 1: Image + About ── */}
          <Flex
            flexDirection={{ base: 'column', md: 'row' }}
            h={{ base: 'auto', md: '380px' }}
            align="stretch"
            gap={4}
            px={2}
          >
            {/* Banner */}
            <Box
              flex={3}
              minW={0}
              overflow="hidden"
              h={{ base: '220px', md: 'full' }}
              borderRadius="xl"
              boxShadow={`0 6px 24px ${rgba(color, 0.25)}`}
              border={`1.5px solid ${colorBorder}`}
            >
              {membershipDetail.bannerUrl ? (
                <Image
                  src={membershipDetail.bannerUrl}
                  alt="Membership banner"
                  w="full"
                  h="full"
                  objectFit="cover"
                  display="block"
                />
              ) : (
                <Box
                  w="full"
                  h="full"
                  bgGradient={`linear(135deg, ${color} 0%, #7c8cf8 100%)`}
                />
              )}
            </Box>

            {/* About This Membership */}
            <Box
              flex={2}
              minW={0}
              border={`1.5px solid ${colorBorder}`}
              borderRadius="xl"
              overflow="hidden"
              display="flex"
              flexDirection="column"
              boxShadow={`0 2px 16px ${colorShadow}`}
            >
              <Box
                flex={1}
                overflowY="auto"
                px={5}
                pb={5}
                display="flex"
                flexDirection="column"
                sx={{
                  '::-webkit-scrollbar': { width: '4px' },
                  '::-webkit-scrollbar-thumb': {
                    bg: 'gray.300',
                    borderRadius: 'full',
                  },
                }}
              >
                {/* Sticky heading */}
                <Box
                  mb={4}
                  flexShrink={0}
                  pb={1}
                  borderBottom={`2px solid ${colorBorder}`}
                  position="sticky"
                  top={0}
                  bg="white"
                  zIndex={1}
                  pt={5}
                  mx={-5}
                  px={5}
                  style={{ background: `linear-gradient(white, ${colorBg})` }}
                >
                  <Flex align="center" gap={2}>
                    <Box
                      w="3px"
                      h="16px"
                      borderRadius="full"
                      bg={color}
                      flexShrink={0}
                    />
                    <Text
                      fontSize="md"
                      fontWeight="bold"
                      color={color}
                      letterSpacing="tight"
                      style={{ textShadow: '0 1px 2px rgba(0,0,0,0.08)' }}
                    >
                      About This Membership
                    </Text>
                  </Flex>
                </Box>
                <Box
                  fontSize="sm"
                  color="gray.600"
                  lineHeight="tall"
                  flex={1}
                  mb={4}
                  dangerouslySetInnerHTML={{
                    __html:
                      membershipDetail.description ||
                      'No description provided.',
                  }}
                />
              </Box>
            </Box>
          </Flex>

          {/* ── Row 2: Membership details + Total Payable ── */}
          <Flex
            flexDirection={{ base: 'column', md: 'row' }}
            align="stretch"
            gap={4}
            px={{ base: 1, md: 2 }}
            pb={2}
          >
            {/* Membership details */}
            <Box
              flex={3}
              minW={0}
              border={`1.5px solid ${colorBorder}`}
              borderRadius="xl"
              p={{ base: 4, md: 5 }}
              boxShadow={`0 2px 16px ${colorShadow}`}
              overflow="hidden"
              position="relative"
            >
              {/* Top accent strip */}
              <Box
                position="absolute"
                top={0}
                left={0}
                right={0}
                h="3px"
                style={{
                  background: `linear-gradient(90deg, ${color}, transparent)`,
                }}
              />
              <Text fontSize="xl" fontWeight="bold" color="gray.900" mb={1}>
                {membershipDetail.name}
              </Text>
              <Flex align="center" gap={2} mb={3} flexWrap="wrap">
                <Text fontSize="sm" fontWeight="semibold" style={{ color }}>
                  by {membershipDetail.organizerName}
                </Text>
                {membershipDetail.tenure && (
                  <Box
                    fontSize="11px"
                    fontWeight="semibold"
                    px={2.5}
                    py={0.5}
                    borderRadius="full"
                    border={`1px solid ${colorBorder}`}
                    bg={colorBg}
                    style={{ color }}
                  >
                    {membershipDetail.tenure}
                  </Box>
                )}
              </Flex>
              <Text fontSize="sm" color="gray.500" lineHeight="tall">
                Review the membership charge before moving ahead.
              </Text>
            </Box>

            {/* Total payable — solid theme color */}
            <Box
              flex={2}
              minW={0}
              borderRadius="xl"
              p={5}
              color="white"
              display="flex"
              flexDirection="column"
              justifyContent="center"
              boxShadow={`0 4px 24px ${rgba(color, 0.4)}`}
              position="relative"
              overflow="hidden"
              style={{ background: color }}
            >
              {/* Decorative circles */}
              <Box
                position="absolute"
                top="-30px"
                right="-30px"
                w="130px"
                h="130px"
                borderRadius="full"
                bg="whiteAlpha.100"
                pointerEvents="none"
              />
              <Box
                position="absolute"
                top="-10px"
                right="-10px"
                w="70px"
                h="70px"
                borderRadius="full"
                bg="whiteAlpha.100"
                pointerEvents="none"
              />
              <Box
                position="absolute"
                bottom="-25px"
                left="-25px"
                w="100px"
                h="100px"
                borderRadius="full"
                bg="whiteAlpha.100"
                pointerEvents="none"
              />
              <Box
                position="absolute"
                bottom="20px"
                right="10px"
                w="40px"
                h="40px"
                borderRadius="full"
                bg="whiteAlpha.100"
                pointerEvents="none"
              />
              <Box
                position="absolute"
                top="50%"
                left="-15px"
                w="50px"
                h="50px"
                borderRadius="full"
                bg="whiteAlpha.100"
                pointerEvents="none"
              />
              <Text
                fontSize="15px"
                fontWeight="bold"
                textTransform="uppercase"
                textDecoration="underline"
                textColor="#ffffff"
                letterSpacing="widest"
                mb={2}
              >
                Total Payable
              </Text>
              {membershipDetail.isFree ? (
                <Text fontSize="2xl" fontWeight="extrabold" mb={4}>
                  Free
                </Text>
              ) : (
                <Text fontSize="3xl" fontWeight="extrabold" mb={4}>
                  {currency} {symbol}
                  {membershipDetail.membershipCharges.toFixed(2)}
                </Text>
              )}
              <Box h="1px" bg="whiteAlpha.300" mb={4} />
              <Text fontSize="xs" lineHeight="tall">
                Taxes and tips calculated at payment step.
              </Text>
            </Box>
          </Flex>
        </Box>
      </Box>

      <RegistrationFooter onContinue={onContinue} color={color} />
    </Box>
  );
}
