import {
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Input,
  SimpleGrid,
  Stack,
} from '@chakra-ui/react';
import {
  CONFIRM_PASSWORD_LABEL,
  EMAIL_FIXED_BY_INVITATION,
  EMAIL_LABEL,
  EMAIL_MAX_LENGTH,
  FIRST_NAME_LABEL,
  LAST_NAME_LABEL,
  NAME_MAX_LENGTH,
  PASSWORD_HINT,
  PASSWORD_LABEL,
} from './signUpCopy';
import { SupporterSignUpFormState } from './useSupporterSignUpForm';

interface SupporterSignUpFieldsProps {
  form: SupporterSignUpFormState;
  isDisabled: boolean;
  /**
   * True when an invitation decided the address. The field still shows it, because a person should
   * see which address they are creating an account under, but it cannot be typed over.
   */
  isEmailFixed?: boolean;
}

/**
 * What a supporter types to create an account. Presentational only: every rule that decides whether
 * an answer is acceptable lives in the form hook, and the server checks the same rules again.
 */
export const SupporterSignUpFields = ({
  form,
  isDisabled,
  isEmailFixed = false,
}: SupporterSignUpFieldsProps) => {
  const cursor = isDisabled ? 'not-allowed' : 'text';

  return (
    <Stack gap={5}>
      <SimpleGrid columns={{ base: 1, md: 2 }} gap={5}>
        <FormControl isInvalid={Boolean(form.errors.firstName)} isRequired>
          <FormLabel htmlFor="supporter-first-name" fontSize={{ base: 'sm', md: 'md' }} mb={1}>
            {FIRST_NAME_LABEL}
          </FormLabel>
          <Input
            id="supporter-first-name"
            autoComplete="given-name"
            value={form.values.firstName}
            maxLength={NAME_MAX_LENGTH}
            onChange={(event) => form.setValue('firstName', event.target.value)}
            isDisabled={isDisabled}
            minH="44px"
            sx={{ cursor }}
          />
          <FormErrorMessage>{form.errors.firstName}</FormErrorMessage>
        </FormControl>

        <FormControl isInvalid={Boolean(form.errors.lastName)} isRequired>
          <FormLabel htmlFor="supporter-last-name" fontSize={{ base: 'sm', md: 'md' }} mb={1}>
            {LAST_NAME_LABEL}
          </FormLabel>
          <Input
            id="supporter-last-name"
            autoComplete="family-name"
            value={form.values.lastName}
            maxLength={NAME_MAX_LENGTH}
            onChange={(event) => form.setValue('lastName', event.target.value)}
            isDisabled={isDisabled}
            minH="44px"
            sx={{ cursor }}
          />
          <FormErrorMessage>{form.errors.lastName}</FormErrorMessage>
        </FormControl>
      </SimpleGrid>

      <FormControl isInvalid={Boolean(form.errors.emailAddress)} isRequired>
        <FormLabel htmlFor="supporter-email" fontSize={{ base: 'sm', md: 'md' }} mb={1}>
          {EMAIL_LABEL}
        </FormLabel>
        <Input
          id="supporter-email"
          type="email"
          autoComplete="email"
          value={form.values.emailAddress}
          maxLength={EMAIL_MAX_LENGTH}
          onChange={(event) => form.setValue('emailAddress', event.target.value)}
          isDisabled={isDisabled}
          isReadOnly={isEmailFixed}
          minH="44px"
          sx={{ cursor: isEmailFixed ? 'not-allowed' : cursor }}
        />
        {isEmailFixed && !form.errors.emailAddress && (
          <FormHelperText>{EMAIL_FIXED_BY_INVITATION}</FormHelperText>
        )}
        <FormErrorMessage>{form.errors.emailAddress}</FormErrorMessage>
      </FormControl>

      <SimpleGrid columns={{ base: 1, md: 2 }} gap={5}>
        <FormControl isInvalid={Boolean(form.errors.password)} isRequired>
          <FormLabel htmlFor="supporter-password" fontSize={{ base: 'sm', md: 'md' }} mb={1}>
            {PASSWORD_LABEL}
          </FormLabel>
          <Input
            id="supporter-password"
            type="password"
            autoComplete="new-password"
            value={form.values.password}
            onChange={(event) => form.setValue('password', event.target.value)}
            isDisabled={isDisabled}
            minH="44px"
            sx={{ cursor }}
          />
          {form.errors.password ? (
            <FormErrorMessage>{form.errors.password}</FormErrorMessage>
          ) : (
            <FormHelperText>{PASSWORD_HINT}</FormHelperText>
          )}
        </FormControl>

        <FormControl isInvalid={Boolean(form.errors.confirmPassword)} isRequired>
          <FormLabel htmlFor="supporter-confirm-password" fontSize={{ base: 'sm', md: 'md' }} mb={1}>
            {CONFIRM_PASSWORD_LABEL}
          </FormLabel>
          <Input
            id="supporter-confirm-password"
            type="password"
            autoComplete="new-password"
            value={form.values.confirmPassword}
            onChange={(event) => form.setValue('confirmPassword', event.target.value)}
            isDisabled={isDisabled}
            minH="44px"
            sx={{ cursor }}
          />
          <FormErrorMessage>{form.errors.confirmPassword}</FormErrorMessage>
        </FormControl>
      </SimpleGrid>
    </Stack>
  );
};

export default SupporterSignUpFields;
