import React from 'react';
import { Box, Icon, Text, VStack } from '@chakra-ui/react';
import { MdLockOutline } from 'react-icons/md';
import { hasPermission, hasAnyPermission } from 'app/service/organizer/rolesPermissions/permissionsService';

interface PermissionGateProps {
  /** Single permission key required */
  permission?: string;
  /** Pass multiple keys — user needs at least ONE */
  anyOf?: string[];
  /** Children to render when access is granted */
  children: React.ReactNode;
  /**
   * When true and access is denied, render an "Access Denied" panel
   * instead of nothing. Use this for full-page / section-level gates.
   */
  showAccessDenied?: boolean;
  /** Custom message shown in the access-denied panel */
  deniedMessage?: string;
}

/**
 * Wrap any component or section with <PermissionGate>.
 *
 * Examples:
 *   // Hide a button silently
 *   <PermissionGate permission="Donation.Campaign.Create">
 *     <Button>New Campaign</Button>
 *   </PermissionGate>
 *
 *   // Show access-denied panel for a whole page section
 *   <PermissionGate permission="Donation.Invoice.Refund" showAccessDenied>
 *     <RefundSection />
 *   </PermissionGate>
 *
 *   // Require any one of multiple permissions
 *   <PermissionGate anyOf={['Donation.Campaign.View', 'Donation.Dashboard.View']}>
 *     <CampaignList />
 *   </PermissionGate>
 */
export default function PermissionGate({
  permission,
  anyOf,
  children,
  showAccessDenied = false,
  deniedMessage = "You don't have permission to access this.",
}: PermissionGateProps) {
  const granted =
    permission  ? hasPermission(permission) :
    anyOf       ? hasAnyPermission(...anyOf) :
    true; // no restriction specified → always show

  if (granted) return <>{children}</>;

  if (!showAccessDenied) return null;

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      py={16}
      px={6}
      w="full"
    >
      <VStack spacing={3} textAlign="center">
        <Box
          w="56px" h="56px"
          borderRadius="full"
          bg="gray.100"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Icon as={MdLockOutline} boxSize={7} color="gray.400" />
        </Box>
        <Text fontSize="md" fontWeight="semibold" color="gray.700">
          Access Restricted
        </Text>
        <Text fontSize="sm" color="gray.500" maxW="320px">
          {deniedMessage}
        </Text>
      </VStack>
    </Box>
  );
}
