import React, { useState } from 'react';
import {
  Box,
  Badge,
  Flex,
  Grid,
  Icon,
  IconButton,
  Input,
  FormControl,
  FormLabel,
  Switch,
  Table,
  TableContainer,
  Thead,
  Tr,
  Th,
  Text,
} from '@chakra-ui/react';
import { ZebraTbody } from 'app/components/common/ZebraTable';
import type { Column } from 'app/components/common/ZebraTable';
import { MdOutlineShield, MdCalendarToday, MdWarningAmber, MdAdd, MdEdit, MdDelete, MdArrowUpward } from 'react-icons/md';
import { useStep10Advance } from './useStep10Advance';
import StepNavButtons from '../../shared/StepNavButtons';
import Loader from 'app/components/common/Loader';
import AddUpgradePathModal, { UpgradePath, CHARGE_RULE_LABELS } from './AddUpgradePathModal';

interface Step10Props {
  membershipId: string | null;
  isEditMode?: boolean;
  onComplete: () => void;
  onPrev?: () => void;
  onSkip?: () => void;
  onSaveAndExit?: () => void;
  isSavingAndExiting?: boolean;
}

export default function Step10AdvanceSettings({
  membershipId,
  isEditMode,
  onComplete,
  onPrev,
  onSkip,
  onSaveAndExit,
  isSavingAndExiting,
}: Step10Props) {
  const {
    requiresApproval, setRequiresApproval,
    registrationWindowEnabled, setRegistrationWindowEnabled,
    registrationStart, setRegistrationStart,
    registrationEnd, setRegistrationEnd,
    upgradePaths, addUpgradePath, updateUpgradePath, removeUpgradePath,
    isLoading, isSubmitting, submit, saveAndExit,
  } = useStep10Advance({ membershipId, isEditMode, onComplete });

  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [editingPath, setEditingPath] = useState<UpgradePath | null>(null);

  const openAddPath = () => { setEditingPath(null); setIsUpgradeModalOpen(true); };
  const openEditPath = (p: UpgradePath) => { setEditingPath(p); setIsUpgradeModalOpen(true); };
  const closeUpgradeModal = () => { setIsUpgradeModalOpen(false); setEditingPath(null); };

  const handleSavePath = (path: Omit<UpgradePath, 'id'>) => {
    if (editingPath) {
      updateUpgradePath(editingPath.id, path);
    } else {
      addUpgradePath(path);
    }
    closeUpgradeModal();
  };

  const upgradePathColumns: Column<UpgradePath>[] = [
    {
      key: 'toMembershipName',
      header: 'Target',
      render: (_: any, path: UpgradePath) => (
        <Flex align="center" gap={2}>
          <Flex w="26px" h="26px" borderRadius="md" bg="teal.50" border="1px solid" borderColor="teal.100" align="center" justify="center" flexShrink={0}>
            <Icon as={MdArrowUpward} boxSize={3} color="teal.500" />
          </Flex>
          <Text fontSize="sm" fontWeight="semibold" color="gray.800" noOfLines={1}>{path.toMembershipName}</Text>
        </Flex>
      ),
    },
    {
      key: 'chargeRule',
      header: 'Charge Rule',
      render: (_: any, path: UpgradePath) => (
        <Badge
          fontSize="11px"
          fontWeight="600"
          borderRadius="full"
          px={3}
          py={0.5}
          colorScheme={path.chargeRule === 'full_price' ? 'blue' : path.chargeRule === 'fixed_amount' ? 'purple' : 'green'}
          variant="subtle"
          textTransform="none"
        >
          {CHARGE_RULE_LABELS[path.chargeRule]}
        </Badge>
      ),
    },
    {
      key: 'fixedAmount',
      header: 'Amount',
      render: (_: any, path: UpgradePath) => (
        <Text fontSize="sm" fontWeight="medium" color={path.chargeRule === 'fixed_amount' ? 'gray.800' : 'gray.400'}>
          {path.chargeRule === 'fixed_amount' ? `$${path.fixedAmount.toFixed(2)}` : '—'}
        </Text>
      ),
    },
    {
      key: 'requiresApproval',
      header: 'Approval',
      render: (_: any, path: UpgradePath) => (
        <Badge
          fontSize="11px"
          borderRadius="full"
          px={2.5}
          py={0.5}
          colorScheme={path.requiresApproval ? 'orange' : 'gray'}
          variant="subtle"
          textTransform="none"
        >
          {path.requiresApproval ? 'Required' : 'Auto'}
        </Badge>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (_: any, path: UpgradePath) => (
        <Flex
          align="center"
          gap={1}
          px={2.5}
          py={0.5}
          borderRadius="full"
          bg={path.isActive ? 'teal.50' : 'gray.100'}
          border="1px solid"
          borderColor={path.isActive ? 'teal.200' : 'gray.200'}
          display="inline-flex"
        >
          <Box w="6px" h="6px" borderRadius="full" bg={path.isActive ? 'teal.500' : 'gray.400'} />
          <Text fontSize="11px" fontWeight="600" color={path.isActive ? 'teal.700' : 'gray.500'}>
            {path.isActive ? 'Active' : 'Inactive'}
          </Text>
        </Flex>
      ),
    },
    {
      key: 'id',
      header: '',
      render: (_: any, path: UpgradePath) => (
        <Flex justify="flex-end" gap={1.5}>
          <IconButton
            aria-label="Edit path"
            icon={<Icon as={MdEdit} boxSize={3.5} />}
            size="sm"
            variant="outline"
            borderRadius="full"
            borderColor="blue.200"
            color="blue.400"
            _hover={{ bg: 'blue.50', borderColor: 'blue.400' }}
            onClick={() => openEditPath(path)}
          />
          <IconButton
            aria-label="Delete path"
            icon={<Icon as={MdDelete} boxSize={3.5} />}
            size="sm"
            variant="outline"
            borderRadius="full"
            borderColor="red.200"
            color="red.400"
            _hover={{ bg: 'red.50', borderColor: 'red.400' }}
            onClick={() => removeUpgradePath(path.id)}
          />
        </Flex>
      ),
    },
  ];

  return (
    <Box
      bg="white"
      borderRadius="2xl"
      border="1px solid"
      borderColor="gray.200"
      boxShadow="0 4px 24px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04)"
      overflow="hidden"
    >
      <Box px={{ base: 3, md: 6 }} pt={6} pb={5}>
        {isLoading ? (
          <Loader message="Loading Settings" subtitle="Fetching saved advance settings..." />
        ) : (<>
        {/* Header */}
        <Text fontSize="xl" fontWeight="bold" color="gray.900" mb={1}>
          Advance Settings
        </Text>
        <Text fontSize="sm" color="gray.400" mb={6}>
          Set the optional registration window for this membership plan.
        </Text>

        {/* Requires Approval card */}
        <Box
          bg="gray.50"
          border="1px solid"
          borderColor="gray.200"
          borderRadius="xl"
          px={{ base: 3, md: 4 }}
          py={4}
          mb={3}
        >
          <Flex align="center" gap={3}>
            <Flex
              w="32px"
              h="32px"
              borderRadius="md"
              bg="blue.50"
              border="1px solid"
              borderColor="blue.100"
              align="center"
              justify="center"
              flexShrink={0}
            >
              <Icon as={MdOutlineShield} boxSize={4} color="blue.500" />
            </Flex>
            <Box flex={1} minW={0}>
              <Text fontSize="xs" fontWeight="bold" color="gray.700" textTransform="uppercase" letterSpacing="wide">
                Requires Approval?
              </Text>
              <Text fontSize="xs" color="gray.400" mt={0.5}>
                Manually approve each new applicant before they become a member.
              </Text>
            </Box>
            <Switch
              isChecked={requiresApproval}
              onChange={(e) => setRequiresApproval(e.target.checked)}
              colorScheme="blue"
              size="lg"
              flexShrink={0}
            />
          </Flex>
        </Box>

        {/* Registration Window card */}
        <Box
          bg="gray.50"
          border="1px solid"
          borderColor="gray.200"
          borderRadius="xl"
          px={{ base: 3, md: 4 }}
          py={4}
          mb={4}
          overflow="hidden"
        >
          <Flex align="center" gap={3} mb={registrationWindowEnabled ? 4 : 0}>
            <Flex
              w="32px"
              h="32px"
              borderRadius="md"
              bg="white"
              border="1px solid"
              borderColor="gray.200"
              align="center"
              justify="center"
              flexShrink={0}
            >
              <Icon as={MdCalendarToday} boxSize={4} color="blue.500" />
            </Flex>
            <Box flex={1} minW={0}>
              <Text fontSize="xs" fontWeight="bold" color="gray.700" textTransform="uppercase" letterSpacing="wide">
                Registration Window
              </Text>
              <Text fontSize="xs" color="gray.400" mt={0.5}>
                Subscriptions will only be available within this date range.
              </Text>
            </Box>
            <Switch
              isChecked={registrationWindowEnabled}
              onChange={(e) => setRegistrationWindowEnabled(e.target.checked)}
              colorScheme="blue"
              size="lg"
              flexShrink={0}
            />
          </Flex>

          {/* Date inputs */}
          {registrationWindowEnabled && (
            <Grid
              templateColumns={{ base: '1fr', md: '1fr 1fr' }}
              gap={3}
              w="full"
              overflow="hidden"
            >
              <FormControl minW={0} overflow="hidden">
                <FormLabel fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>
                  Registration Start
                </FormLabel>
                <Input
                  type="datetime-local"
                  value={registrationStart}
                  onChange={(e) => setRegistrationStart(e.target.value)}
                  fontSize={{ base: 'xs', md: 'sm' }}
                  bg="white"
                  borderColor="gray.200"
                  borderRadius="lg"
                  w="full"
                  minW={0}
                  sx={{ minWidth: '0 !important', width: '100% !important' }}
                  _focus={{ borderColor: '#044bd9', boxShadow: '0 0 0 1px #044bd9' }}
                />
              </FormControl>
              <FormControl minW={0} overflow="hidden">
                <FormLabel fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>
                  Registration End
                </FormLabel>
                <Input
                  type="datetime-local"
                  value={registrationEnd}
                  onChange={(e) => setRegistrationEnd(e.target.value)}
                  fontSize={{ base: 'xs', md: 'sm' }}
                  bg="white"
                  borderColor="gray.200"
                  borderRadius="lg"
                  w="full"
                  minW={0}
                  sx={{ minWidth: '0 !important', width: '100% !important' }}
                  _focus={{ borderColor: '#044bd9', boxShadow: '0 0 0 1px #044bd9' }}
                />
              </FormControl>
            </Grid>
          )}
        </Box>

       
        {/* <Box
          border="1px solid"
          borderColor="teal.100"
          borderRadius="xl"
          overflow="hidden"
          mb={4}
          boxShadow="0 1px 6px rgba(0,0,0,0.05)"
        >
         
          <Flex
            justify="space-between"
            align="center"
            px={4}
            py={4}
            bgGradient="linear(to-r, teal.50, cyan.50)"
            borderBottom="1px solid"
            borderColor="teal.100"
          >
            <Flex align="center" gap={3}>
              <Flex
                w="38px"
                h="38px"
                borderRadius="lg"
                bg="white"
                border="1.5px solid"
                borderColor="teal.200"
                align="center"
                justify="center"
                flexShrink={0}
                boxShadow="sm"
              >
                <Icon as={MdArrowUpward} boxSize={4} color="teal.500" />
              </Flex>
              <Box>
                <Flex align="center" gap={2}>
                  <Text fontSize="sm" fontWeight="bold" color="teal.800" textTransform="uppercase" letterSpacing="wider">
                    Membership Upgrade Paths
                  </Text>
                  <Badge
                    bg="teal.100"
                    color="teal.700"
                    fontSize="10px"
                    borderRadius="full"
                    px={2}
                    py={0.5}
                  >
                    {upgradePaths.length}
                  </Badge>
                </Flex>
                <Text fontSize="xs" color="teal.600" mt={0.5}>
                  Configure allowed upgrade paths and charge rules.
                </Text>
              </Box>
            </Flex>

            <IconButton
              aria-label="Add upgrade path"
              icon={<Icon as={MdAdd} boxSize={4} />}
              size="sm"
              bg="white"
              border="1.5px solid"
              borderColor="teal.300"
              borderRadius="full"
              color="teal.600"
              boxShadow="sm"
              onClick={openAddPath}
              _hover={{ borderColor: '#044bd9', color: '#044bd9', bg: 'blue.50', boxShadow: 'md' }}
              _active={{ bg: 'blue.100' }}
              transition="all 0.15s"
            />
          </Flex>

          {upgradePaths.length === 0 ? (
        
            <Flex direction="column" align="center" justify="center" py={10} gap={2} bg="white">
              <Flex
                w="52px"
                h="52px"
                borderRadius="full"
                bg="teal.50"
                border="2px dashed"
                borderColor="teal.200"
                align="center"
                justify="center"
                mb={1}
              >
                <Icon as={MdArrowUpward} boxSize={5} color="teal.400" />
              </Flex>
              <Text fontSize="sm" fontWeight="semibold" color="gray.700">No upgrade paths yet</Text>
              <Text fontSize="xs" color="gray.500" textAlign="center" maxW="240px" lineHeight="1.5">
                Click the <Text as="span" fontWeight="bold" color="teal.600">+</Text> button to add upgrade paths for this membership.
              </Text>
            </Flex>
          ) : (
            <TableContainer
              maxH="260px"
              overflowY="auto"
              sx={{
                '::-webkit-scrollbar': { width: '4px' },
                '::-webkit-scrollbar-thumb': { bg: 'teal.200', borderRadius: 'full' },
              }}
            >
              <Table variant="simple" size="sm">
                <Thead bg="gray.50" position="sticky" top={0} zIndex={1}>
                  <Tr>
                    {upgradePathColumns.map((col) => (
                      <Th
                        key={col.key}
                        fontSize="11px"
                        fontWeight="700"
                        color="gray.500"
                        textTransform="uppercase"
                        letterSpacing="0.07em"
                        borderColor="gray.100"
                        py={2.5}
                      >
                        {col.header}
                      </Th>
                    ))}
                  </Tr>
                </Thead>
                <ZebraTbody data={upgradePaths} columns={upgradePathColumns} />
              </Table>
            </TableContainer>
          )}
        </Box> */}

    
        {!membershipId && (
          <Box
            bg="orange.50"
            border="1px solid"
            borderColor="orange.200"
            borderRadius="xl"
            px={{ base: 3, md: 4 }}
            py={3}
          >
            <Flex align="center" gap={2}>
              <Icon as={MdWarningAmber} color="orange.400" boxSize={4} flexShrink={0} />
              <Text fontSize="sm" color="orange.500" fontWeight="medium">
                No active membership plan found.
              </Text>
            </Flex>
          </Box>
        )}
        </>)}
      </Box>

    
      <StepNavButtons
        onNext={submit}
        onPrev={onPrev}
        onSkip={onSkip}
        showSkip
        onSaveAndExit={onSaveAndExit ? () => saveAndExit(onSaveAndExit) : undefined}
        isSavingAndExiting={isSavingAndExiting}
        isSubmitting={isSubmitting}
      />

      <AddUpgradePathModal
        isOpen={isUpgradeModalOpen}
        onClose={closeUpgradeModal}
        onSave={handleSavePath}
        initialData={editingPath}
        currentMembershipId={membershipId}
      />
    </Box>
  );
}
