import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Code,
  Heading,
  Stack,
  Text,
  useToast,
} from '@chakra-ui/react';
import { MdCheckCircle, MdContentCopy, MdLogout } from 'react-icons/md';
import { FundraiserJoinResult } from 'app/interface/donationInter/fundraiserJoinDto';
import {
  NEXT_SIGN_IN_NOTICE,
  SIGN_OUT_AND_BACK_IN,
  pageAddressLabel,
  successHeading,
  successMessage,
} from './joinCopy';

interface FundraiserJoinSuccessProps {
  result: FundraiserJoinResult;
  onSignOutAndBackIn: () => void;
}

/** The public address of a fundraiser page, as agreed: /campaigns/{campaign}/{fundraiser}. */
export const fundraiserPageAddress = (campaignSlug: string | null, slug: string): string =>
  campaignSlug ? `/campaigns/${campaignSlug}/${slug}` : `/campaigns/${slug}`;

export const FundraiserJoinSuccess = ({
  result,
  onSignOutAndBackIn,
}: FundraiserJoinSuccessProps) => {
  const toast = useToast();
  const address = fundraiserPageAddress(result.campaignSlug, result.slug);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${address}`);
      toast({ title: 'Address copied', status: 'success', duration: 3000, isClosable: true });
    } catch {
      toast({
        title: 'Could not copy',
        description: 'Select the address and copy it by hand.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box
      bg="white"
      _dark={{ bg: 'navy.700' }}
      borderRadius="16px"
      p={{ base: 4, md: 6 }}
      boxShadow="sm"
    >
      <Stack gap={5}>
        <Stack direction="row" align="center" gap={3}>
          <Box as={MdCheckCircle} color="green.500" fontSize="28px" aria-hidden="true" />
          <Heading as="h2" fontSize={{ base: 'lg', md: 'xl' }}>
            {successHeading(result.currentStatus, result.alreadyJoined)}
          </Heading>
        </Stack>

        <Text fontSize={{ base: 'sm', md: 'md' }} color="gray.600" _dark={{ color: 'gray.300' }}>
          {successMessage(result.currentStatus, result.alreadyJoined)}
        </Text>

        <Stack gap={2}>
          <Text fontSize="sm" fontWeight="600">
            {pageAddressLabel(result.currentStatus)}
          </Text>
          <Code
            px={3}
            py={2}
            borderRadius="8px"
            fontSize={{ base: 'xs', md: 'sm' }}
            overflowX="auto"
            whiteSpace="nowrap"
          >
            {address}
          </Code>
          <Button
            variant="outline"
            size="sm"
            minH="44px"
            leftIcon={<MdContentCopy />}
            alignSelf={{ base: 'stretch', md: 'flex-start' }}
            onClick={handleCopy}
            sx={{ cursor: 'pointer' }}
          >
            Copy address
          </Button>
        </Stack>

        <Alert status="info" borderRadius="12px">
          <AlertIcon />
          <Text fontSize="sm">{NEXT_SIGN_IN_NOTICE}</Text>
        </Alert>

        <Button
          colorScheme="brand"
          minH="44px"
          leftIcon={<MdLogout />}
          w={{ base: 'full', md: 'auto' }}
          alignSelf={{ base: 'stretch', md: 'flex-start' }}
          onClick={onSignOutAndBackIn}
          sx={{ cursor: 'pointer' }}
        >
          {SIGN_OUT_AND_BACK_IN}
        </Button>
      </Stack>
    </Box>
  );
};

export default FundraiserJoinSuccess;
