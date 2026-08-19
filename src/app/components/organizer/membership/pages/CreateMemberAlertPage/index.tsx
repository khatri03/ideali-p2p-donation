import { useEffect, useRef, useState } from 'react';
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogCloseButton,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Badge,
  Box,
  Button,
  Checkbox,
  Flex,
  Icon,
  IconButton,
  Input,
  Select,
  Skeleton,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tooltip,
  Tr,
} from '@chakra-ui/react';
import {
  MdArrowBack,
  MdFormatBold,
  MdFormatItalic,
  MdFormatListBulleted,
  MdFormatListNumbered,
  MdFormatQuote,
  MdGroup,
  MdListAlt,
  MdPersonAdd,
  MdRedo,
  MdSend,
  MdUndo,
} from 'react-icons/md';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Pagination from 'app/components/organizer/donation/organizerDonationComponents/Pagination';
import CharacterCounter from 'app/components/common/CharacterCounter';
import MultiSelectDropdown from '../../common/MultiSelectDropdown';
import { useCreateMemberAlert } from './useCreateMemberAlert';

const PRIORITY_OPTIONS: { value: 'Urgent' | 'Important' | 'Normal' | 'Low'; label: string }[] = [
  { value: 'Urgent', label: 'Urgent' },
  { value: 'Important', label: 'Important' },
  { value: 'Normal', label: 'Normal' },
  { value: 'Low', label: 'Low' },
];

function fmtUtcNow(date: Date) {
  return date.toLocaleString('en-US', {
    timeZone: 'UTC',
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }) + ' UTC';
}

function ToolbarButton({ icon, label, isActive, onClick }: {
  icon: React.ReactElement;
  label: string;
  isActive?: boolean;
  onClick: () => void;
}) {
  return (
    <Tooltip label={label} fontSize="xs">
      <IconButton
        aria-label={label}
        icon={icon}
        size="xs"
        variant={isActive ? 'solid' : 'ghost'}
        colorScheme={isActive ? 'blue' : 'gray'}
        onClick={onClick}
      />
    </Tooltip>
  );
}

const fieldLabelProps = {
  fontSize: 'sm',
  fontWeight: 'medium',
  color: 'gray.800',
  mb: 1.5,
};

function RequiredMark() {
  return <Text as="span" color="red.500">*</Text>;
}

export default function CreateMemberAlertPage() {
  const {
    priority, setPriority,
    channel, setChannel, channelOptions,
    scheduleForLater, setScheduleForLater,
    scheduledAt, setScheduledAt,
    title, setTitle, titleMaxLength,
    setMessage, messageText, setMessageText, messageMaxLength,

    audienceSource, handleAudienceSourceChange,

    membershipTypeOptions, membershipTypeLoading, membershipType, setMembershipType,
    membershipStatusOptions, membershipStatusLoading, membershipStatus, setMembershipStatus,

    customListOptions, customListLoading, customListIds, toggleCustomListId, clearCustomListIds,

    canApply, matchedMembers, matchedTotal, isPreviewLoading, handleApplyAudience,
    matchedPageNo, matchedPageSize, handleMatchedPageChange,

    isSending, errors, handleSend, handleCancel,
    isConfirmOpen, closeConfirm, handleConfirmSend,
  } = useCreateMemberAlert();

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'What do you want to tell them?' }),
    ],
    content: '',
    onUpdate: ({ editor: e }) => {
      setMessage(e.getHTML());
      setMessageText(e.getText());
    },
  });

  // ── Jump to the first invalid field on a failed submit ────────────────────
  const channelRef = useRef<HTMLSelectElement>(null);
  const scheduledAtRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const messageBoxRef = useRef<HTMLDivElement>(null);
  const audienceRef = useRef<HTMLDivElement>(null);
  const cancelSendRef = useRef<HTMLButtonElement>(null);

  const scrollToField = (ref: React.RefObject<HTMLElement>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    ref.current?.focus?.();
  };

  const handleSendClick = async () => {
    const validationErrors = await handleSend();
    if (Object.keys(validationErrors).length === 0) return;

    if (validationErrors.channel) scrollToField(channelRef);
    else if (validationErrors.scheduledAt) scrollToField(scheduledAtRef);
    else if (validationErrors.title) scrollToField(titleRef);
    else if (validationErrors.message) {
      scrollToField(messageBoxRef);
      editor?.chain().focus().run();
    } else if (validationErrors.audience) scrollToField(audienceRef);
  };

  return (
    <Box minH="100vh" bg="gray.50" pt={16} pb={8}>
      <Box mx={{ base: 2, md: 4 }} mt={4}>
        <Button
          size="sm"
          variant="outline"
          leftIcon={<Icon as={MdArrowBack} />}
          borderRadius="lg"
          mb={4}
          fontSize="xs"
          fontWeight="700"
          onClick={handleCancel}
        >
          Back to alerts
        </Button>

        <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="xl" boxShadow="sm" p={{ base: 4, md: 5 }} mb={4}>
          <Flex justify="space-between" align={{ base: 'flex-start', md: 'center' }} flexDirection={{ base: 'column', md: 'row' }} gap={2} mb={5}>
            <Text fontSize="lg" fontWeight="700" color="gray.900">
              New alert
            </Text>
            <Text fontSize="xs" color="gray.400">
              Current UTC time: {fmtUtcNow(now)}
            </Text>
          </Flex>

          <Flex gap={3} flexWrap="wrap" mb={5}>
            <Box flex="1" minW="180px">
              <Text {...fieldLabelProps}>Priority</Text>
              <Select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                bg="gray.50"
                borderColor="gray.200"
                borderRadius="lg"
                fontSize="sm"
                _focus={{ borderColor: '#044bd9', boxShadow: '0 0 0 1px #044bd9', bg: 'white' }}
              >
                {PRIORITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </Select>
            </Box>

            <Box flex="1" minW="200px">
              <Text {...fieldLabelProps}>Channel <RequiredMark /></Text>
              <Select
                ref={channelRef}
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                placeholder="Select a channel"
                bg="gray.50"
                borderColor={errors.channel ? 'red.400' : 'gray.200'}
                borderRadius="lg"
                fontSize="sm"
                _focus={{ borderColor: '#044bd9', boxShadow: '0 0 0 1px #044bd9', bg: 'white' }}
              >
                {channelOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.text}</option>
                ))}
              </Select>
              {errors.channel && <Text fontSize="xs" color="red.500" mt={1}>{errors.channel}</Text>}
            </Box>

            <Box flex="1" minW="220px">
              <Checkbox
                isChecked={scheduleForLater}
                onChange={(e) => setScheduleForLater(e.target.checked)}
                mb={1.5}
                colorScheme="blue"
              >
                <Text fontSize="sm" fontWeight="medium" color="gray.800">
                  Schedule for later
                </Text>
              </Checkbox>
              <Input
                ref={scheduledAtRef}
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                isDisabled={!scheduleForLater}
                bg="gray.50"
                borderColor={errors.scheduledAt ? 'red.400' : 'gray.200'}
                borderRadius="lg"
                fontSize="sm"
                _focus={{ borderColor: '#044bd9', boxShadow: '0 0 0 1px #044bd9', bg: 'white' }}
              />
              {errors.scheduledAt && <Text fontSize="xs" color="red.500" mt={1}>{errors.scheduledAt}</Text>}
            </Box>
          </Flex>

          <Box mb={5}>
            <Text {...fieldLabelProps}>Title <RequiredMark /></Text>
            <Input
              ref={titleRef}
              placeholder="Alert title"
              value={title}
              maxLength={titleMaxLength}
              onChange={(e) => setTitle(e.target.value)}
              bg="gray.50"
              borderColor={errors.title ? 'red.400' : 'gray.200'}
              borderRadius="lg"
              fontSize="sm"
              _focus={{ borderColor: '#044bd9', boxShadow: '0 0 0 1px #044bd9', bg: 'white' }}
            />
            <Flex justify="space-between" align="flex-start" mt={1}>
              <Text fontSize="xs" color="red.500">{errors.title}</Text>
              <Text fontSize="xs" color={title.length >= titleMaxLength ? 'orange.500' : 'gray.400'} flexShrink={0}>
                {title.length}/{titleMaxLength}
              </Text>
            </Flex>
          </Box>

          <Box ref={messageBoxRef}>
            <Text {...fieldLabelProps} mb={0.5}>Message <RequiredMark /></Text>
            <Text fontSize="xs" color="gray.500" mb={2}>
              Compose the alert with basic formatting.
            </Text>

            <Box border="1px solid" borderColor={errors.message ? 'red.400' : 'gray.200'} borderRadius="lg" overflow="hidden">
              <Flex align="center" justify="space-between" px={2} py={1.5} borderBottom="1px solid" borderColor="gray.200" bg="gray.50" flexWrap="wrap" gap={2}>
                <Badge bg="blue.50" color="blue.700" border="1px solid" borderColor="blue.200" borderRadius="md" px={2.5} py={1} fontSize="10px" fontWeight="700" textTransform="uppercase">
                  Basic formatting
                </Badge>
                <Flex align="center" gap={0.5}>
                  <ToolbarButton icon={<MdFormatBold size={15} />} label="Bold" isActive={editor?.isActive('bold')} onClick={() => editor?.chain().focus().toggleBold().run()} />
                  <ToolbarButton icon={<MdFormatItalic size={15} />} label="Italic" isActive={editor?.isActive('italic')} onClick={() => editor?.chain().focus().toggleItalic().run()} />
                  <ToolbarButton icon={<MdFormatListBulleted size={15} />} label="Bullet list" isActive={editor?.isActive('bulletList')} onClick={() => editor?.chain().focus().toggleBulletList().run()} />
                  <ToolbarButton icon={<MdFormatListNumbered size={15} />} label="Numbered list" isActive={editor?.isActive('orderedList')} onClick={() => editor?.chain().focus().toggleOrderedList().run()} />
                  <ToolbarButton icon={<MdFormatQuote size={15} />} label="Quote" isActive={editor?.isActive('blockquote')} onClick={() => editor?.chain().focus().toggleBlockquote().run()} />
                  <ToolbarButton icon={<MdUndo size={15} />} label="Undo" onClick={() => editor?.chain().focus().undo().run()} />
                  <ToolbarButton icon={<MdRedo size={15} />} label="Redo" onClick={() => editor?.chain().focus().redo().run()} />
                </Flex>
              </Flex>

              <Box
                sx={{
                  '.ProseMirror': {
                    minHeight: '140px',
                    padding: '12px',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    outline: 'none',
                  },
                  '.ProseMirror p': { margin: '0 0 0.4em 0' },
                  '.ProseMirror ul': { listStyleType: 'disc', paddingLeft: '1.5em', margin: '0.25em 0' },
                  '.ProseMirror ol': { listStyleType: 'decimal', paddingLeft: '1.5em', margin: '0.25em 0' },
                  '.ProseMirror li': { margin: '0.15em 0' },
                  '.ProseMirror li p': { margin: 0 },
                  '.ProseMirror blockquote': {
                    borderLeft: '3px solid',
                    borderColor: 'gray.300',
                    paddingLeft: '0.75em',
                    margin: '0.5em 0',
                    color: 'gray.600',
                    fontStyle: 'italic',
                  },
                  '.ProseMirror p.is-editor-empty:first-of-type::before': {
                    content: 'attr(data-placeholder)',
                    color: '#A0AEC0',
                    pointerEvents: 'none',
                    float: 'left',
                    height: 0,
                  },
                }}
              >
                <EditorContent editor={editor} />
              </Box>
            </Box>
            <Text fontSize="11px" color="gray.400" mt={1.5}>
              Rich text is stored as sanitized HTML. Keep content concise for alerts.
            </Text>
            <Flex justify="space-between" align="flex-start" mt={1}>
              <Text fontSize="xs" color="red.500">{errors.message}</Text>
              <CharacterCounter currentLength={messageText.length} maxLength={messageMaxLength} />
            </Flex>
          </Box>
        </Box>

        <Box ref={audienceRef} bg="white" border="1px solid" borderColor="gray.200" borderRadius="xl" boxShadow="sm" p={{ base: 4, md: 5 }} mb={4}>
          <Flex justify="space-between" align="flex-start" mb={1}>
            <Text fontSize="11px" fontWeight="700" color="gray.400" textTransform="uppercase" letterSpacing="wide">
              Audience
            </Text>
            <Icon as={MdGroup} boxSize={4} color="gray.300" />
          </Flex>
          <Text fontSize="md" fontWeight="700" color="gray.900" mb={0.5}>
            Choose recipients
          </Text>
          <Text fontSize="xs" color="gray.500" mb={4}>
            Select the audience source, then press Apply to refresh the preview.
          </Text>

          <Flex mb={5} w="full" border="1px solid" borderColor="gray.200" borderRadius="lg" overflow="hidden">
            <Button
              flex="1"
              size="sm"
              borderRadius="none"
              fontSize="xs"
              fontWeight="700"
              bg={audienceSource === 'members' ? '#044bd9' : 'white'}
              color={audienceSource === 'members' ? 'white' : 'gray.600'}
              onClick={() => handleAudienceSourceChange('members')}
              _hover={{ bg: audienceSource === 'members' ? '#0340b8' : 'gray.50' }}
            >
              Members
            </Button>
            <Button
              flex="1"
              size="sm"
              borderRadius="none"
              fontSize="xs"
              fontWeight="700"
              bg={audienceSource === 'customLists' ? '#044bd9' : 'white'}
              color={audienceSource === 'customLists' ? 'white' : 'gray.600'}
              onClick={() => handleAudienceSourceChange('customLists')}
              _hover={{ bg: audienceSource === 'customLists' ? '#0340b8' : 'gray.50' }}
            >
              Custom Lists
            </Button>
          </Flex>

          {errors.audience && <Text fontSize="xs" color="red.500" mb={3}>{errors.audience}</Text>}

          {audienceSource === 'members' ? (
            <Flex gap={3} flexWrap="wrap" align="flex-end" mb={5}>
              <Box flex="1" minW="220px">
                <Text {...fieldLabelProps} mb={0.5}>Membership type</Text>
                <Text fontSize="11px" color="gray.400" mb={1.5}>Choose one membership type.</Text>
                <Select
                  value={membershipType}
                  onChange={(e) => setMembershipType(e.target.value)}
                  placeholder={membershipTypeLoading ? 'Loading...' : 'Select membership type'}
                  isDisabled={membershipTypeLoading}
                  bg="gray.50"
                  borderColor="gray.200"
                  borderRadius="lg"
                  fontSize="sm"
                  _focus={{ borderColor: '#044bd9', boxShadow: '0 0 0 1px #044bd9', bg: 'white' }}
                >
                  {membershipTypeOptions.map((option) => (
                    <option key={option.uniqueId} value={option.uniqueId}>
                      {option.name} ({option.memberCount})
                    </option>
                  ))}
                </Select>
              </Box>

              <Box flex="1" minW="220px">
                <Text {...fieldLabelProps} mb={0.5}>Membership status</Text>
                <Text fontSize="11px" color="gray.400" mb={1.5}>Choose one membership status.</Text>
                <Select
                  value={membershipStatus}
                  onChange={(e) => setMembershipStatus(e.target.value)}
                  placeholder={membershipStatusLoading ? 'Loading...' : 'Select membership status'}
                  isDisabled={membershipStatusLoading}
                  bg="gray.50"
                  borderColor="gray.200"
                  borderRadius="lg"
                  fontSize="sm"
                  _focus={{ borderColor: '#044bd9', boxShadow: '0 0 0 1px #044bd9', bg: 'white' }}
                >
                  {membershipStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.text}</option>
                  ))}
                </Select>
              </Box>

              <Button
                size="sm"
                h="40px"
                bg="#044bd9"
                color="white"
                borderRadius="lg"
                px={6}
                fontSize="xs"
                fontWeight="700"
                onClick={handleApplyAudience}
                isDisabled={!canApply}
                isLoading={isPreviewLoading}
                loadingText="Applying"
                _hover={{ bg: '#0340b8' }}
                _active={{ bg: '#02308a' }}
              >
                Apply
              </Button>
            </Flex>
          ) : (
            <Box mb={5}>
              <Text fontSize="sm" fontWeight="700" color="gray.900" mb={0.5}>Custom lists</Text>
              <Text fontSize="11px" color="gray.400" mb={1.5}>
                Select one or more custom lists, then optionally narrow them with the same refiners.
              </Text>
              <Box mb={3}>
                <MultiSelectDropdown
                  options={customListOptions.map((option) => ({
                    value: option.uniqueId,
                    text: `${option.name} (${option.memberCount})`,
                  }))}
                  selected={customListIds}
                  onToggle={toggleCustomListId}
                  onClear={clearCustomListIds}
                  placeholder={customListLoading ? 'Loading...' : 'Select custom list(s)'}
                />
              </Box>

              <Flex gap={3} flexWrap="wrap" align="flex-end">
                <Box flex="1" minW="220px">
                  <Text {...fieldLabelProps} mb={0.5}>Membership type</Text>
                  <Text fontSize="11px" color="gray.400" mb={1.5}>Choose one membership type.</Text>
                  <Select
                    value={membershipType}
                    onChange={(e) => setMembershipType(e.target.value)}
                    placeholder={membershipTypeLoading ? 'Loading...' : 'Select membership type'}
                    isDisabled={membershipTypeLoading}
                    bg="gray.50"
                    borderColor="gray.200"
                    borderRadius="lg"
                    fontSize="sm"
                    _focus={{ borderColor: '#044bd9', boxShadow: '0 0 0 1px #044bd9', bg: 'white' }}
                  >
                    {membershipTypeOptions.map((option) => (
                      <option key={option.uniqueId} value={option.uniqueId}>
                        {option.name} ({option.memberCount})
                      </option>
                    ))}
                  </Select>
                </Box>

                <Box flex="1" minW="220px">
                  <Text {...fieldLabelProps} mb={0.5}>Membership status</Text>
                  <Text fontSize="11px" color="gray.400" mb={1.5}>Choose one membership status.</Text>
                  <Select
                    value={membershipStatus}
                    onChange={(e) => setMembershipStatus(e.target.value)}
                    placeholder={membershipStatusLoading ? 'Loading...' : 'Select membership status'}
                    isDisabled={membershipStatusLoading}
                    bg="gray.50"
                    borderColor="gray.200"
                    borderRadius="lg"
                    fontSize="sm"
                    _focus={{ borderColor: '#044bd9', boxShadow: '0 0 0 1px #044bd9', bg: 'white' }}
                  >
                    {membershipStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.text}</option>
                    ))}
                  </Select>
                </Box>

                <Button
                  size="sm"
                  h="40px"
                  bg="#044bd9"
                  color="white"
                  borderRadius="lg"
                  px={6}
                  fontSize="xs"
                  fontWeight="700"
                  onClick={handleApplyAudience}
                  isDisabled={!canApply}
                  _hover={{ bg: '#0340b8' }}
                  _active={{ bg: '#02308a' }}
                >
                  Apply
                </Button>
              </Flex>
            </Box>
          )}

          <Box borderTop="1px solid" borderColor="gray.100" pt={4}>
            <Flex justify="space-between" align="center" mb={3}>
              <Box>
                <Text fontSize="11px" fontWeight="700" color="gray.400" textTransform="uppercase" letterSpacing="wide">
                  Audience preview
                </Text>
                <Text fontSize="sm" fontWeight="700" color="gray.800">
                  {audienceSource === 'members' ? 'Matched members' : 'Custom lists'}
                </Text>
              </Box>
              <Badge bg="blue.50" color="blue.700" border="1px solid" borderColor="blue.200" borderRadius="md" px={2.5} py={1} fontSize="11px" fontWeight="700">
                {matchedTotal} MATCHED
              </Badge>
            </Flex>

            <Box border="1px solid" borderColor="gray.200" borderRadius="lg" overflow="hidden">
              <TableContainer>
                <Table variant="simple" size="md">
                  <Thead bg="gray.200" borderBottom="2px solid" borderColor="gray.100">
                    <Tr>
                      <Th color="gray.800" fontWeight="bold" fontSize="sm" textTransform="uppercase">Member</Th>
                      <Th color="gray.800" fontWeight="bold" fontSize="sm" textTransform="uppercase">Email</Th>
                      <Th color="gray.800" fontWeight="bold" fontSize="sm" textTransform="uppercase">Membership Type</Th>
                    </Tr>
                  </Thead>
                  {isPreviewLoading ? (
                    <Tbody>
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Tr key={i}>
                          {Array.from({ length: 3 }).map((__, j) => (
                            <Td key={j}><Skeleton h="14px" borderRadius="md" /></Td>
                          ))}
                        </Tr>
                      ))}
                    </Tbody>
                  ) : matchedMembers.length === 0 ? (
                    <Tbody>
                      <Tr>
                        <Td colSpan={3} border="none">
                          <Flex direction="column" align="center" justify="center" py={10} px={4} textAlign="center" gap={1}>
                            <Icon as={MdListAlt} boxSize={5} color="gray.300" mb={1} />
                            <Text fontSize="sm" fontWeight="600" color="gray.600">
                              Choose at least one filter to preview the matched members.
                            </Text>
                            <Text fontSize="xs" color="gray.400">
                              We only fetch the filtered page, not the entire member table.
                            </Text>
                          </Flex>
                        </Td>
                      </Tr>
                    </Tbody>
                  ) : (
                    <Tbody>
                      {matchedMembers.map((member) => (
                        <Tr key={member.uniqueId}>
                          <Td><Text fontSize="sm" fontWeight="bold" color="gray.900">{member.memberFullName}</Text></Td>
                          <Td><Text fontSize="sm" color="gray.600">{member.email}</Text></Td>
                          <Td><Text fontSize="sm" color="gray.600">{member.activeMembershipName}</Text></Td>
                        </Tr>
                      ))}
                    </Tbody>
                  )}
                </Table>
              </TableContainer>
              {matchedTotal > 0 && (
                <Pagination
                  currentPage={matchedPageNo}
                  totalRecords={matchedTotal}
                  entriesPerPage={matchedPageSize}
                  onPageChange={handleMatchedPageChange}
                  displayedItemsCount={matchedMembers.length}
                />
              )}
            </Box>
          </Box>
        </Box>

        <Flex justify="space-between" gap={3}>
          <Button size="sm" variant="outline" borderRadius="lg" px={6} fontSize="xs" fontWeight="700" onClick={handleCancel} isDisabled={isSending}>
            Cancel
          </Button>
          <Button
            size="sm"
            bg="#044bd9"
            color="white"
            borderRadius="lg"
            px={6}
            fontSize="xs"
            fontWeight="700"
            leftIcon={<Icon as={MdSend} />}
            onClick={handleSendClick}
            isLoading={isSending}
            loadingText="Sending"
            _hover={{ bg: '#0340b8' }}
            _active={{ bg: '#02308a' }}
          >
            Send alert
          </Button>
        </Flex>
      </Box>

      <AlertDialog isOpen={isConfirmOpen} leastDestructiveRef={cancelSendRef} onClose={closeConfirm} isCentered>
        <AlertDialogOverlay>
          <AlertDialogContent borderRadius="xl" mx={4}>
            <AlertDialogHeader display="flex" alignItems="center" gap={2} fontSize="lg" fontWeight="800" color="gray.900" pb={2}>
              <Icon as={MdPersonAdd} color="#044bd9" boxSize={5} />
              Send this alert?
            </AlertDialogHeader>
            <AlertDialogCloseButton />

            <AlertDialogBody fontSize="sm" color="gray.600">
              The alert will be delivered to the selected audience right away. This can't be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button
                ref={cancelSendRef}
                size="md"
                variant="outline"
                borderRadius="lg"
                px={6}
                fontSize="sm"
                fontWeight="700"
                onClick={closeConfirm}
                isDisabled={isSending}
              >
                Cancel
              </Button>
              <Button
                size="md"
                bg="#044bd9"
                color="white"
                borderRadius="lg"
                px={6}
                ml={3}
                fontSize="sm"
                fontWeight="700"
                onClick={handleConfirmSend}
                isLoading={isSending}
                loadingText="Sending"
                _hover={{ bg: '#0340b8' }}
                _active={{ bg: '#02308a' }}
              >
                Send alert
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}
