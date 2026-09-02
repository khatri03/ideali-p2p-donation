import { FormEvent } from 'react';
import { Button, Stack } from '@chakra-ui/react';
import { SupporterSignUpRequest } from 'app/interface/donationInter/supporterSignUpDto';
import { SIGN_UP_SUBMIT } from './signUpCopy';
import SupporterSignUpFields from './SupporterSignUpFields';
import { SupporterSignUpFormState } from './useSupporterSignUpForm';

interface SupporterSignUpFormProps {
  form: SupporterSignUpFormState;
  isSubmitting: boolean;
  onSubmit: (request: SupporterSignUpRequest) => void;
  /** True when an invitation decided the address, which the fields then show without letting it be typed over. */
  isEmailFixed?: boolean;
}

export const SupporterSignUpForm = ({
  form,
  isSubmitting,
  onSubmit,
  isEmailFixed = false,
}: SupporterSignUpFormProps) => {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (form.validate()) {
      onSubmit(form.buildRequest());
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Stack gap={6}>
        <SupporterSignUpFields form={form} isDisabled={isSubmitting} isEmailFixed={isEmailFixed} />
        <Button
          type="submit"
          colorScheme="brand"
          minH="44px"
          w={{ base: 'full', md: 'auto' }}
          alignSelf={{ base: 'stretch', md: 'flex-start' }}
          isDisabled={isSubmitting}
          isLoading={isSubmitting}
          loadingText="Creating your account..."
          sx={{ cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
        >
          {SIGN_UP_SUBMIT}
        </Button>
      </Stack>
    </form>
  );
};

export default SupporterSignUpForm;
