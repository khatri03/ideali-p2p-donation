import { useCallback, useMemo, useState } from 'react';
import {
  InvitationPreview,
  InvitationSendResult,
} from 'app/interface/donationInter/fundraiserInvitationDto';
import {
  previewInvitation,
  sendInvitations,
} from 'app/service/organizer/donation/fundraiserInvitationService';
import {
  ADDRESS_LIMIT,
  MESSAGE_LIMIT,
  MESSAGE_TOO_LONG_ERROR,
  NO_ADDRESSES_ERROR,
  TOO_MANY_ADDRESSES_ERROR,
  invalidAddressError,
  isEmailShaped,
  splitAddresses,
} from './invitationCopy';

interface ComposerState {
  addresses: string;
  personalMessage: string;
  parsedAddresses: string[];
  error: string | null;
  isSending: boolean;
  isPreviewing: boolean;
  preview: InvitationPreview | null;
  setAddresses: (value: string) => void;
  setPersonalMessage: (value: string) => void;
  addAddress: (address: string) => void;
  openPreview: () => Promise<void>;
  closePreview: () => void;
  send: () => Promise<InvitationSendResult | null>;
}

/**
 * The invite form. It validates the same rules the server does, so the organiser is told about a typo
 * before a request is spent — but the server is still the authority, and its refusal is what is shown.
 */
export const useInvitationComposer = (campaignUniqueId: string): ComposerState => {
  const [addresses, setAddresses] = useState('');
  const [personalMessage, setPersonalMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [preview, setPreview] = useState<InvitationPreview | null>(null);

  const parsedAddresses = useMemo(() => splitAddresses(addresses), [addresses]);

  const validate = useCallback((): string | null => {
    if (parsedAddresses.length === 0) {
      return NO_ADDRESSES_ERROR;
    }

    if (parsedAddresses.length > ADDRESS_LIMIT) {
      return TOO_MANY_ADDRESSES_ERROR;
    }

    if (personalMessage.trim().length > MESSAGE_LIMIT) {
      return MESSAGE_TOO_LONG_ERROR;
    }

    const invalid = parsedAddresses.find((address) => !isEmailShaped(address));

    return invalid ? invalidAddressError(invalid) : null;
  }, [parsedAddresses, personalMessage]);

  const addAddress = useCallback((address: string) => {
    setAddresses((current) => {
      if (splitAddresses(current).includes(address)) {
        return current;
      }

      return current.trim().length === 0 ? address : `${current.trim()}, ${address}`;
    });
  }, []);

  const openPreview = useCallback(async () => {
    setIsPreviewing(true);

    try {
      setPreview(await previewInvitation(campaignUniqueId, personalMessage.trim() || undefined));
      setError(null);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'The preview could not be prepared.');
    } finally {
      setIsPreviewing(false);
    }
  }, [campaignUniqueId, personalMessage]);

  const closePreview = useCallback(() => setPreview(null), []);

  const send = useCallback(async (): Promise<InvitationSendResult | null> => {
    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return null;
    }

    setError(null);
    setIsSending(true);

    try {
      const result = await sendInvitations(campaignUniqueId, {
        emailAddresses: parsedAddresses,
        personalMessage: personalMessage.trim() || undefined,
      });

      setAddresses('');
      setPersonalMessage('');

      return result;
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Those invitations could not be sent.');
      return null;
    } finally {
      setIsSending(false);
    }
  }, [campaignUniqueId, parsedAddresses, personalMessage, validate]);

  return {
    addresses,
    personalMessage,
    parsedAddresses,
    error,
    isSending,
    isPreviewing,
    preview,
    setAddresses,
    setPersonalMessage,
    addAddress,
    openPreview,
    closePreview,
    send,
  };
};

export default useInvitationComposer;
