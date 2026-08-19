import { Avatar, Badge, Box, Divider, Flex, Icon, Text, useColorModeValue } from '@chakra-ui/react';
import { MdArrowOutward } from 'react-icons/md';
import { SuggestedCampaignItem } from 'app/interface/memberInter/donorDashboardDto';
import { useNavigate } from 'react-router-dom';

interface SuggestedCampaignsProps {
  campaigns: SuggestedCampaignItem[];
}

function deriveCategory(name: string): { label: string; color: string } {
  const n = name.toLowerCase();
  if (n.match(/water|flood|ocean|clean\s+water/)) return { label: 'Water', color: 'cyan' };
  if (n.match(/food|hunger|meal|feed|ramadan/))    return { label: 'Food', color: 'orange' };
  if (n.match(/school|educat|youth|learn|program/)) return { label: 'Education', color: 'blue' };
  if (n.match(/tree|environ|green|plant|climate/))  return { label: 'Environment', color: 'green' };
  if (n.match(/animal|pet|shelter|rescue/))         return { label: 'Animals', color: 'orange' };
  if (n.match(/health|medical|hospital|healthcare/)) return { label: 'Health', color: 'red' };
  if (n.match(/child|kid|orphan/))                  return { label: 'Children', color: 'purple' };
  if (n.match(/emergency|relief|disaster/))         return { label: 'Relief', color: 'yellow' };
  return { label: 'Campaign', color: 'brand' };
}

function formatGoal(amount: number): string {
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}k raised`;
  return `$${amount} raised`;
}

function SuggestedCampaigns({ campaigns }: SuggestedCampaignsProps) {
  const navigate = useNavigate();
  const cardBg = useColorModeValue('white', 'navy.800');
  const textColor = useColorModeValue('#1B2559', 'white');
  const subColor = useColorModeValue('#A3AED0', '#A3AED0');
  const dividerColor = useColorModeValue('gray.100', 'whiteAlpha.100');

  return (
    <Box
      bg={cardBg}
      borderRadius="2xl"
      p="20px"
      w="100%"
      boxShadow="sm"
      border="1px"
      borderColor={useColorModeValue('gray.200', 'gray.700')}
    >
      <Text color={textColor} fontWeight="700" fontSize="lg" mb="2px">
        Suggested for You
      </Text>
      <Text color={subColor} fontSize="xs" mb="16px">
        Based on your giving history
      </Text>

      {campaigns.length === 0 ? (
        <Text color={subColor} fontSize="sm" textAlign="center" py="24px">
          No suggestions yet.
        </Text>
      ) : (
        <Flex direction="column" gap="6px">
          {campaigns.map((c, i) => {
            const { label, color } = deriveCategory(c.campaignName);
            return (
              <Box key={c.campaignUniqueId}>
                <Flex
                  align="center"
                  gap="12px"
                  px="10px"
                  py="10px"
                  borderRadius="12px"
                  bg={useColorModeValue('gray.50', 'whiteAlpha.50')}
                  cursor="pointer"
                  _hover={{ bg: useColorModeValue('brand.50', 'whiteAlpha.100') }}
                  transition="background 0.15s"
                  onClick={() => navigate(`/donate/${c.campaignUniqueId}`)}
                >
                  {/* Thumbnail */}
                  <Avatar
                    name={c.campaignName}
                    size="md"
                    borderRadius="10px"
                    bg={`${color}.400`}
                    color="white"
                    fontWeight="700"
                    flexShrink={0}
                  />

                  {/* Text block */}
                  <Box flex="1" minW="0">
                    <Badge
                      colorScheme={color}
                      fontSize="9px"
                      borderRadius="full"
                      px="6px"
                      py="1px"
                      mb="3px"
                      fontWeight="700"
                      textTransform="capitalize"
                    >
                      {label}
                    </Badge>
                    <Text
                      color={textColor}
                      fontWeight="600"
                      fontSize="sm"
                      lineHeight="1.3"
                      noOfLines={1}
                    >
                      {c.campaignName}
                    </Text>
                    <Text color={subColor} fontSize="xs" noOfLines={1}>
                      {c.organizerName}
                    </Text>
                    <Text color="green.500" fontSize="xs" fontWeight="600" mt="2px">
                      {formatGoal(c.fundRaisingGoal)}
                    </Text>
                  </Box>

                  {/* Arrow */}
                  <Icon
                    as={MdArrowOutward}
                    color="brand.500"
                    w="14px"
                    h="14px"
                    flexShrink={0}
                  />
                </Flex>
                {/* gap between highlighted rows */}
              </Box>
            );
          })}
        </Flex>
      )}
    </Box>
  );
}

export default SuggestedCampaigns;
