import {
  Avatar,
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
} from '@chakra-ui/react';
import { CampaignTeamMember } from 'app/interface/donationInter/campaignTeamDto';
import { fundraiserPhotoUrl } from 'app/service/organizer/donation/fundraiserConsoleService';
import { formatMoney } from '../page/money';
import { initialsOf } from '../page/pageCopy';
import { CHOOSE_MEMBER_BODY, CHOOSE_MEMBER_TITLE, donateToMember, raisedByMember } from './teamCopy';

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
 */
export const ChooseMemberModal = ({
  isOpen,
  members,
  currencySymbol,
  onChoose,
  onClose,
}: ChooseMemberModalProps) => (
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

          <Stack gap={3}>
            {members.map((member) => (
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
                aria-label={donateToMember(member.displayName)}
              >
                <Stack direction="row" gap={3} align="center" w="full" minW={0}>
                  <Avatar
                    name={member.displayName}
                    src={member.photoUniqueId ? fundraiserPhotoUrl(member.photoUniqueId) : undefined}
                    getInitials={() => initialsOf(member.displayName)}
                    size="sm"
                    bg="brand.500"
                    color="white"
                  />
                  <Stack gap={0} align="flex-start" minW={0}>
                    <Text fontWeight="600" noOfLines={1}>
                      {member.displayName}
                    </Text>
                    <Text fontSize="xs" color="gray.500" _dark={{ color: 'gray.400' }}>
                      {raisedByMember(formatMoney(member.raisedAmount, currencySymbol))}
                    </Text>
                  </Stack>
                </Stack>
              </Button>
            ))}
          </Stack>
        </Stack>
      </ModalBody>
    </ModalContent>
  </Modal>
);

export default ChooseMemberModal;
