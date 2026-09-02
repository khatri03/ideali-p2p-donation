import { useEffect, useState } from 'react';
import {
  Avatar,
  Button,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
} from '@chakra-ui/react';
import { MdSearch } from 'react-icons/md';
import { CampaignTeamMember } from 'app/interface/donationInter/campaignTeamDto';
import { fundraiserPhotoUrl } from 'app/service/organizer/donation/fundraiserConsoleService';
import { formatMoney } from '../page/money';
import { initialsOf } from '../page/pageCopy';
import {
  CHOOSE_MEMBER_BODY,
  CHOOSE_MEMBER_NO_MATCH,
  CHOOSE_MEMBER_SEARCH_LABEL,
  CHOOSE_MEMBER_SEARCH_PLACEHOLDER,
  CHOOSE_MEMBER_TITLE,
  MEMBERS_VISIBLE_LIMIT,
  donateToMember,
  raisedByMember,
} from './teamCopy';

interface ChooseMemberModalProps {
  isOpen: boolean;
  members: CampaignTeamMember[];
  currencySymbol: string;
  onChoose: (member: CampaignTeamMember) => void;
  onClose: () => void;
}

/**
 * A team is not itself a payee. Every donation belongs to exactly one fundraiser and is counted once
 * towards the team, so the team page asks who to support and then sends the donor down the one donate
 * route the product already has. No second money path is created here.
 *
 * A donor who came to support one person should not have to scroll a large team to find them, so past
 * the length the page itself lists the names are searchable.
 */
export const ChooseMemberModal = ({
  isOpen,
  members,
  currencySymbol,
  onChoose,
  onClose,
}: ChooseMemberModalProps) => {
  const [search, setSearch] = useState('');

  // A search left behind from a previous visit would hide most of the team the next time it opens.
  useEffect(() => {
    if (!isOpen) {
      setSearch('');
    }
  }, [isOpen]);

  const isSearchable = members.length > MEMBERS_VISIBLE_LIMIT;
  const term = search.trim().toLowerCase();
  const shown = term
    ? members.filter((member) => member.displayName.toLowerCase().includes(term))
    : members;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={{ base: 'full', md: 'lg' }} isCentered>
      <ModalOverlay />
      <ModalContent borderRadius={{ base: 0, md: '16px' }} mx={{ md: 4 }}>
        <ModalHeader fontSize={{ base: 'lg', md: 'xl' }}>{CHOOSE_MEMBER_TITLE}</ModalHeader>
        <ModalCloseButton cursor="pointer" minH="44px" minW="44px" />

        <ModalBody pb={6}>
          <Stack gap={4}>
            <Text fontSize={{ base: 'sm', md: 'md' }} color="gray.600" _dark={{ color: 'gray.300' }}>
              {CHOOSE_MEMBER_BODY}
            </Text>

            {isSearchable && (
              <FormControl>
                <FormLabel htmlFor="choose-member-search" srOnly>
                  {CHOOSE_MEMBER_SEARCH_LABEL}
                </FormLabel>
                <InputGroup>
                  <InputLeftElement h="44px" pointerEvents="none">
                    <MdSearch aria-hidden="true" />
                  </InputLeftElement>
                  <Input
                    id="choose-member-search"
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={CHOOSE_MEMBER_SEARCH_PLACEHOLDER}
                    minH="44px"
                    borderRadius="12px"
                  />
                </InputGroup>
              </FormControl>
            )}

            {shown.length === 0 ? (
              <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.300' }} py={2}>
                {CHOOSE_MEMBER_NO_MATCH}
              </Text>
            ) : (
              <Stack gap={3} maxH={{ md: '50vh' }} overflowY={{ md: 'auto' }}>
                {shown.map((member) => (
                  <Button
                    key={member.uniqueId}
                    onClick={() => onChoose(member)}
                    variant="outline"
                    colorScheme="brand"
                    minH="56px"
                    borderRadius="12px"
                    cursor="pointer"
                    justifyContent="flex-start"
                    px={4}
                    flexShrink={0}
                    aria-label={donateToMember(member.displayName)}
                  >
                    <Stack direction="row" gap={3} align="center" w="full" minW={0}>
                      <Avatar
                        name={member.displayName}
                        src={
                          member.photoUniqueId ? fundraiserPhotoUrl(member.photoUniqueId) : undefined
                        }
                        getInitials={() => initialsOf(member.displayName)}
                        size="sm"
                        bg="brand.500"
                        color="white"
                      />
                      <Stack gap={0} align="flex-start" minW={0}>
                        <Text fontWeight="600" noOfLines={1}>
                          {member.displayName}
                        </Text>
                        <Text fontSize="xs" color="gray.600" _dark={{ color: 'gray.400' }}>
                          {raisedByMember(formatMoney(member.raisedAmount, currencySymbol))}
                        </Text>
                      </Stack>
                    </Stack>
                  </Button>
                ))}
              </Stack>
            )}
          </Stack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ChooseMemberModal;
