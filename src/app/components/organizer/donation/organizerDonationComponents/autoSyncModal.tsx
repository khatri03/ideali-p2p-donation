import { useState, useEffect, useRef } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  Box,
  Flex,
  Text,
  Select,
  Button,
  IconButton,
  Badge,
  Input,
  Spinner,
  useToast,
} from "@chakra-ui/react";
import { CloseIcon, AddIcon } from "@chakra-ui/icons";
import contactSyncService, {
  ConnectedIntegration,
  IntegrationList,
} from "../../../../service/organizer/Settings/contactSyncService"; 
import donationService from "app/service/organizer/donation/donationService";
import { hasPermission } from "app/service/organizer/rolesPermissions/permissionsService";

interface AutoSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId: string;
  selectedDonorIds?: string[]; 
}

export const AutoSyncModal = ({
  isOpen,
  onClose,
  campaignId,
  selectedDonorIds = [],
}: AutoSyncModalProps) => {
  const toast = useToast();
  const newListInputRef = useRef<HTMLInputElement>(null);

  const [connectedItems, setConnectedItems] = useState<ConnectedIntegration[]>([]);
  const [selectedIntegration, setSelectedIntegration] = useState<string>("");
  const [listItems, setListItems] = useState<IntegrationList[]>([]);
  const [selectedList, setSelectedList] = useState<string>("");
  const [loadingConnected, setLoadingConnected] = useState(false);
  const [loadingLists, setLoadingLists] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // New list item inline creation state
  const [showNewListInput, setShowNewListInput] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [isCreatingList, setIsCreatingList] = useState(false);

  // Fetch connected integrations when modal opens
  useEffect(() => {
    if (!isOpen) return;

    setSelectedIntegration("");
    setSelectedList("");
    setListItems([]);
    setShowNewListInput(false);
    setNewListName("");

    const fetchConnected = async () => {
      setLoadingConnected(true);
      try {
        const connected = await contactSyncService.getConnectedItems();
        setConnectedItems(connected);
      } catch (error) {
        console.error("Failed to load integrations:", error);
        toast({
          title: "Error",
          description: "Failed to load integrations.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoadingConnected(false);
      }
    };

    fetchConnected();
  }, [isOpen]);

  // Fetch list items whenever integration selection changes
  useEffect(() => {
    if (!selectedIntegration) {
      setListItems([]);
      setShowNewListInput(false);
      setNewListName("");
      return;
    }

    fetchListItems();
  }, [selectedIntegration]);

  // Auto-focus the input when it appears
  useEffect(() => {
    if (showNewListInput) {
      setTimeout(() => newListInputRef.current?.focus(), 50);
    }
  }, [showNewListInput]);

  const fetchListItems = async () => {
    setLoadingLists(true);
    setSelectedList("");
    try {
      const lists = await contactSyncService.getIntegrationListItems(selectedIntegration);
      setListItems(lists);
    } catch (error) {
      console.error("Failed to load list items:", error);
      toast({
        title: "Error",
        description: "Failed to load list items for this integration.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      setListItems([]);
    } finally {
      setLoadingLists(false);
    }
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) {
      toast({
        title: "Validation",
        description: "Please enter a list name.",
        status: "warning",
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    setIsCreatingList(true);
    try {
      await contactSyncService.createIntegrationListItem(
        selectedIntegration,
        newListName.trim()
      );
      toast({
        title: "List Created",
        description: `"${newListName.trim()}" has been created successfully.`,
        status: "success",
        duration: 2000,
        isClosable: true,
      });

      // Hide the input and reload the list
      setShowNewListInput(false);
      setNewListName("");
      await fetchListItems();
    } catch (error) {
      console.error("Failed to create list:", error);
      toast({
        title: "Error",
        description: "Failed to create the list. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsCreatingList(false);
    }
  };

  const handleCancelNewList = () => {
    setShowNewListInput(false);
    setNewListName("");
  };

const handleSave = async () => {
  if (!selectedIntegration) {
    toast({
      title: "Validation",
      description: "Please select an integration.",
      status: "warning",
      duration: 2000,
      isClosable: true,
    });
    return;
  }
  if (!selectedList) {
    toast({
      title: "Validation",
      description: "Please select a list.",
      status: "warning",
      duration: 2000,
      isClosable: true,
    });
    return;
  }

  setIsSaving(true);
  try {
    // ── If donor IDs are passed, call the manual sync API ──
    if (selectedDonorIds.length > 0) {

       console.log('Sending to queueManualSync:', {
        orgProviderId: selectedIntegration,
        providerListId: selectedList,
        contactIds: selectedDonorIds,
      });
      await contactSyncService.queueManualSync(
        selectedIntegration,   // orgProviderId
        selectedList,          // providerListId
        selectedDonorIds       // contactIds
      );
      toast({
        title: "Sync Queued",
        description: "Selected donors have been queued for sync.",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } else {
      // ── Original flow (no donors selected — auto sync config) ──
      await donationService.setIntegration(
        campaignId,
        selectedIntegration,
        selectedList
      );
      toast({
        title: "Configuration Saved",
        description: "Auto sync settings have been saved.",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    }
    onClose();
  } catch (error) {
    toast({
      title: "Error",
      description: selectedDonorIds.length > 0
        ? "Failed to queue sync. Please try again."
        : "Failed to save configuration.",
      status: "error",
      duration: 3000,
      isClosable: true,
    });
  } finally {
    setIsSaving(false);
  }
};

  const connectedItem = connectedItems.find(
    (item) => item.uniqueId === selectedIntegration
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="xl">
      <ModalOverlay bg="blackAlpha.500" />
      <ModalContent borderRadius="2xl" overflow="hidden" mx={4}>
        <ModalBody p={9}>
          {/* Header */}
          <Flex justify="space-between" align="flex-start" mb={8}>
            <Box>
             {/* Header — update these two Text lines */}
<Text fontWeight="bold" fontSize="xl" color="gray.800">
  {selectedDonorIds.length > 0 ? "Sync Donors" : "Configure"}
</Text>
<Text fontSize="sm" color="gray.500" mt={1}>
  {selectedDonorIds.length > 0
    ? `${selectedDonorIds.length} donor${selectedDonorIds.length > 1 ? "s" : ""} selected`
    : "Auto Sync Settings"}
</Text>

            </Box>

            <Flex align="center" gap={3}>
              {connectedItem && (
                <Badge
                  colorScheme="green"
                  borderRadius="full"
                  px={3}
                  py={1}
                  fontSize="xs"
                  fontWeight="medium"
                >
                  ● {connectedItem.name} Connected
                </Badge>
              )}
              <IconButton
                aria-label="Close"
                icon={<CloseIcon boxSize={2.5} />}
                size="xs"
                variant="ghost"
                color="gray.400"
                onClick={onClose}
                borderRadius="full"
                _hover={{ bg: "gray.100", color: "gray.600" }}
              />
            </Flex>
          </Flex>

          {loadingConnected ? (
            <Flex justify="center" align="center" py={14}>
              <Spinner size="lg" color="blue.500" />
            </Flex>
          ) : (
            <>
              {/* Integration Select */}
              <Box mb={7}>
                <Text fontSize="sm" fontWeight="semibold" color="gray.700" mb={2.5}>
                  Integration
                </Text>
                <Select
                  placeholder="Select Integration"
                  value={selectedIntegration}
                  onChange={(e) => setSelectedIntegration(e.target.value)}
                  fontSize="sm"
                  color={selectedIntegration ? "gray.800" : "gray.400"}
                  borderColor="gray.200"
                  borderRadius="lg"
                  h="48px"
                  _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px #4299e1" }}
                >
                  {connectedItems.map((item) => (
                    <option key={item.uniqueId} value={item.uniqueId}>
                      {item.name} ({item.provider})
                    </option>
                  ))}
                </Select>
              </Box>

              {/* List Items Section */}
              <Box mb={10}>
                <Flex justify="space-between" align="center" mb={2.5}>
                  <Text fontSize="sm" fontWeight="semibold" color="gray.700">
                    List Items
                  </Text>
                  {/* Only show "New List Item" when an integration is selected and input isn't already open */}
                  {selectedIntegration && !showNewListInput && hasPermission("donation:donors:sync:create-list") && (
                    <Text
                      fontSize="xs"
                      color="blue.500"
                      fontWeight="medium"
                      cursor="pointer"
                      _hover={{ textDecoration: "underline" }}
                      onClick={() => setShowNewListInput(true)}
                    >
                      → New List Item
                    </Text>
                  )}
                </Flex>

                {/* Inline new list creation row */}
                {showNewListInput && (
                  <Flex gap={2} mb={3} align="center">
                    <Input
                      ref={newListInputRef}
                      placeholder="Enter list item name"
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleCreateList();
                        if (e.key === "Escape") handleCancelNewList();
                      }}
                      fontSize="sm"
                      borderColor="gray.200"
                      borderRadius="lg"
                      h="40px"
                      _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px #4299e1" }}
                    />
                    <Button
                      colorScheme="blue"
                      borderRadius="lg"
                      fontSize="sm"
                      h="40px"
                      px={4}
                      leftIcon={<AddIcon boxSize={2.5} />}
                      isLoading={isCreatingList}
                      loadingText="Creating..."
                      onClick={handleCreateList}
                      flexShrink={0}
                    >
                      Create
                    </Button>
                    <Button
                      variant="outline"
                      borderColor="gray.200"
                      color="gray.500"
                      borderRadius="lg"
                      fontSize="sm"
                      h="40px"
                      px={4}
                      onClick={handleCancelNewList}
                      isDisabled={isCreatingList}
                      flexShrink={0}
                      _hover={{ bg: "gray.50" }}
                    >
                      Cancel
                    </Button>
                  </Flex>
                )}

                {/* List dropdown */}
                {loadingLists ? (
                  <Flex
                    align="center"
                    justify="center"
                    h="48px"
                    border="1px solid"
                    borderColor="gray.200"
                    borderRadius="lg"
                    gap={2}
                  >
                    <Spinner size="sm" color="blue.400" />
                    <Text fontSize="sm" color="gray.400">
                      Loading lists...
                    </Text>
                  </Flex>
                ) : (
                  <Select
                    placeholder={
                      !selectedIntegration
                        ? "Select an integration first"
                        : listItems.length === 0
                        ? "No lists available"
                        : "Select List"
                    }
                    value={selectedList}
                    onChange={(e) => setSelectedList(e.target.value)}
                    fontSize="sm"
                    color={selectedList ? "gray.800" : "gray.400"}
                    borderColor="gray.200"
                    borderRadius="lg"
                    h="48px"
                    isDisabled={!selectedIntegration || listItems.length === 0}
                    _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px #4299e1" }}
                  >
                    {listItems.map((item) => (
                      <option key={item.list_id} value={item.list_id}>
                        {item.name}
                        {item.membership_count != null
                          ? ` (${item.membership_count} members)`
                          : ""}
                      </option>
                    ))}
                  </Select>
                )}
              </Box>

              {/* Footer Buttons */}
              <Flex justify="flex-end" gap={3}>
                <Button
                  variant="outline"
                  borderColor="gray.200"
                  color="gray.600"
                  borderRadius="lg"
                  fontSize="sm"
                  px={7}
                  h="44px"
                  onClick={onClose}
                  _hover={{ bg: "gray.50" }}
                >
                  Cancel
                </Button>
                <Button
                  colorScheme="blue"
                  borderRadius="lg"
                  fontSize="sm"
                  px={7}
                  h="44px"
                  leftIcon={
                    <Box as="span" fontSize="14px">
                      ⊙
                    </Box>
                  }
                  isLoading={isSaving}
                  loadingText="Saving..."
                  onClick={handleSave}
                >
                  Save Configuration
                </Button>
              </Flex>
            </>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};