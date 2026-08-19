import React, { useState, useEffect } from 'react';
import {
  Box,
  FormControl,
  FormLabel,
  Input,
  Select,
  Grid,
  GridItem,
  VStack,
  HStack,
  useToast,
  useColorModeValue,
  Flex,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Text,
  Circle,
  Icon,
  useDisclosure,
} from '@chakra-ui/react';
import { FaCheck } from 'react-icons/fa';
import Loader from '../../../common/Loader';
import CustomButton from '../../../common/CustomButton';
import ConfirmationModal from '../../../common/ConfirmationModal';
import paymentAccountService, {
  PaymentMerchant,
  PaymentCurrency,
  StripeTokenExchangeData,
  PaymentAccountDetail
} from '../../../../service/organizer/donation/paymentAccountService';
import { FormData } from 'app/interface/paymentMethod/paymentAccountForm';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { MdArrowBack } from 'react-icons/md';

/* ---------- Reusable Form Field ---------- */
const FormField = ({
  label,
  name,
  placeholder,
  type = 'input',
  options = [],
  value,
  onChange
}: any) => (
  <FormControl isRequired>
    <FormLabel fontSize="sm" fontWeight="medium" color="gray.700" mb={2}>
      {label}
    </FormLabel>
    {type === 'select' ? (
      <Select
        name={name}
        value={value}
        onChange={onChange}
        size="md"
        fontSize="sm"
        borderWidth="1px"
        borderColor="gray.300"
        _hover={{ borderColor: 'gray.400' }}
        _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px #3182ce' }}
      >
        {options.length === 0 && (
          <option value="">No {label.toLowerCase()} available</option>
        )}
        {options.map((opt: any) => (
          <option key={opt.id || opt.value} value={opt.name || opt.text}>
            {opt.name || opt.text}
          </option>
        ))}
      </Select>
    ) : (
      <Input
        name={name}
        value={value}
        onChange={onChange}
        size="md"
        fontSize="sm"
        borderWidth="1px"
        borderColor="gray.300"
        _hover={{ borderColor: 'gray.400' }}
        _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px #3182ce' }}
        placeholder={placeholder}
      />
    )}
  </FormControl>
);

// Helper function to mask value - show first 8 characters + fixed dots
const maskValue = (value: string) => {
  if (!value || value.length <= 8) return value;
  return value.substring(0, 8) + '••••••';
};

export default function PaymentAccountForm() {
  const [formData, setFormData] = useState<FormData>({
    accountName: '',
    paymentMerchant: '',
    paymentCurrency: '',
    paymentAccount: '',
    accessToken: '',
    publishableKey: ''
  });
  const [merchants, setMerchants] = useState<PaymentMerchant[]>([]);
  const [currencies, setCurrencies] = useState<PaymentCurrency[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [connectingStripe, setConnectingStripe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stripeCredentials, setStripeCredentials] = useState<StripeTokenExchangeData | null>(null);
  const [processedCode, setProcessedCode] = useState<string | null>(null);
  const [accountDetails, setAccountDetails] = useState<PaymentAccountDetail | null>(null);
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const { accountId } = useParams<{ accountId: string }>();

  // Determine if we're in edit mode
  const isEditMode = !!accountId;

  // Clear connection confirmation dialog
  const { isOpen: isClearDialogOpen, onOpen: onClearDialogOpen, onClose: onClearDialogClose } = useDisclosure();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.700', 'white');
  const headerBg = useColorModeValue('gray.50', 'gray.700');

  useEffect(() => {
    fetchMerchantsAndCurrencies();

    // Restore account name from localStorage if returning from Stripe
    // Note: Currency is restored in fetchMerchantsAndCurrencies to avoid race condition
    const savedAccountName = localStorage.getItem('paymentAccountName');
    if (savedAccountName) {
      setFormData(prev => ({
        ...prev,
        accountName: savedAccountName
      }));
      // Clear from localStorage after restoring
      localStorage.removeItem('paymentAccountName');
    }
  }, []);

  // Handle OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');

    // Only exchange if we have a code, haven't processed it yet, and don't have credentials
    if (code && code !== processedCode && !stripeCredentials) {
      exchangeStripeCode(code);
    }
  }, [location.search, processedCode, stripeCredentials]);

  // Fetch account details when in edit mode
  useEffect(() => {
    if (isEditMode && accountId) {
      fetchAccountDetails(accountId);
    }
  }, [isEditMode, accountId]);

  const fetchAccountDetails = async (id: string) => {
    try {
      setLoading(true);
      const accountData = await paymentAccountService.getPaymentAccountById(id);
      setAccountDetails(accountData);

      // Pre-populate form with existing data
      setFormData(prev => ({
        ...prev,
        accountName: accountData.accountName || '',
        paymentMerchant: accountData.paymentMerchant?.name || '',
        paymentCurrency: accountData.paymentCurrency?.currency || '',
        paymentAccount: accountData.accountCredentials?.['AccountId'] || '',
        accessToken: accountData.accountCredentials?.['SecretKey'] || '',
        publishableKey: accountData.accountCredentials?.['PublishableKey'] || ''
      }));

      // If we have credentials, set them to show the connected state
      if (accountData.accountCredentials?.['AccountId']) {
        setStripeCredentials({
          stripe_user_id: accountData.accountCredentials['AccountId'] || '',
          access_token: accountData.accountCredentials['SecretKey'] || '',
          stripe_publishable_key: accountData.accountCredentials['PublishableKey'] || ''
        });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load account details';
      showToast('Error', errorMessage, 'error');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const exchangeStripeCode = async (code: string) => {
    try {
      setConnectingStripe(true);
      setProcessedCode(code); // Mark this code as processed immediately

      const response = await paymentAccountService.exchangeStripeToken(code);

      if (response.success && response.data) {
        setStripeCredentials(response.data);
        // Auto-fill form fields with Stripe credentials
        setFormData(prev => ({
          ...prev,
          paymentAccount: response.data.stripe_user_id,
          accessToken: response.data.access_token,
          publishableKey: response.data.stripe_publishable_key
        }));
        showToast('Success', 'Successfully connected to Stripe!', 'success');

        // Clean up URL by removing query parameters
        window.history.replaceState({}, document.title, window.location.pathname);
      } else {
        throw new Error('Failed to exchange Stripe token');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to connect with Stripe';
      showToast('Error', errorMessage, 'error');
      // Reset processed code on error so user can try again
      setProcessedCode(null);
    } finally {
      setConnectingStripe(false);
    }
  };

  const showToast = (
    title: string,
    description: string,
    status: 'success' | 'error'
  ) => {
    toast({
      title,
      description,
      status,
      duration: status === 'error' ? 5000 : 3000,
      isClosable: true
    });
  };

  const fetchMerchantsAndCurrencies = async () => {
    try {
      setLoading(true);
      setError(null);

      const { merchants: merchantsData, currencies: currenciesData } =
        await paymentAccountService.getMerchantsAndCurrencies();

      if (!merchantsData?.success || !merchantsData?.data) {
        throw new Error('Invalid merchants data format received from API');
      }
      if (!currenciesData?.success || !currenciesData?.data) {
        throw new Error('Invalid currencies data format received from API');
      }

      setMerchants(merchantsData.data);

      // Sort currencies to put USD first
      const sortedCurrencies = [...currenciesData.data].sort((a, b) => {
        if (a.text === 'USD') return -1;
        if (b.text === 'USD') return 1;
        return 0;
      });
      setCurrencies(sortedCurrencies);

      // Check for saved currency from localStorage (from Stripe redirect)
      const savedCurrency = localStorage.getItem('paymentAccountCurrency');
      // Clear from localStorage after reading
      if (savedCurrency) {
        localStorage.removeItem('paymentAccountCurrency');
      }

      // Default to USD if available, otherwise first currency
      const defaultCurrency = sortedCurrencies.find(c => c.text === 'USD')?.text || sortedCurrencies[0]?.text || '';

      setFormData(prev => ({
        ...prev,
        paymentMerchant: merchantsData.data[0]?.name || '',
        // Use saved currency if available, otherwise use USD as default
        paymentCurrency: savedCurrency || defaultCurrency
      }));
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to load payment options from API';
      setError(errorMessage);
      showToast('Error loading data', errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  /* ================= STRIPE CONNECT ================= */
  const handleConnectWithStripe = async () => {
    // Validate account name before connecting
    if (!formData.accountName.trim()) {
      showToast('Validation Error', 'Please enter an account name before connecting to Stripe', 'error');
      return;
    }

    try {
      setConnectingStripe(true);

      // Save account name and currency to localStorage so they persist after redirect
      localStorage.setItem('paymentAccountName', formData.accountName);
      localStorage.setItem('paymentAccountCurrency', formData.paymentCurrency);

      const response = await paymentAccountService.getStripeOAuthSettings();

      if (!response?.success || !response?.data) {
        throw new Error('Failed to get Stripe OAuth settings.');
      }

      const { clientId, oAuthUrl } = response.data;

      if (!clientId) {
        throw new Error('Stripe Client ID is not configured on the backend.');
      }

      // Construct the complete OAuth URL with parameters
      const baseUrl = oAuthUrl || 'https://connect.stripe.com/oauth/authorize';
      const redirectUri = `${window.location.origin}/organizer/setting/payment-account`;
      const finalUrl = `${baseUrl}?response_type=code&client_id=${clientId}&scope=read_write&redirect_uri=${encodeURIComponent(redirectUri)}`;

      // Redirect to Stripe
      window.location.href = finalUrl;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to connect with Stripe';

      console.error('Stripe Connect Error:', error);
      showToast('Stripe Configuration Error', errorMessage, 'error');
      setConnectingStripe(false);
      // Clear saved data if connection fails
      localStorage.removeItem('paymentAccountName');
      localStorage.removeItem('paymentAccountCurrency');
    }
  };
  /* ================================================= */

  const handleSubmit = async () => {
    // Validation: If Stripe credentials are available, only require accountName
    // Otherwise, require all fields including paymentAccount
    if (!formData.accountName) {
      showToast('Validation Error', 'Account name is required', 'error');
      return;
    }

    if (!isEditMode && !stripeCredentials && !formData.paymentAccount) {
      showToast('Validation Error', 'Please connect with Stripe or enter a payment account manually', 'error');
      return;
    }

    if (!formData.paymentMerchant || !formData.paymentCurrency) {
      showToast('Validation Error', 'Please select payment merchant and currency', 'error');
      return;
    }

    try {
      setSubmitting(true);

      const selectedMerchant = merchants.find(
        m => m.name === formData.paymentMerchant
      );
      const selectedCurrency = currencies.find(
        c => c.text === formData.paymentCurrency
      );

      if (!selectedMerchant || !selectedCurrency) {
        throw new Error('Invalid merchant or currency selection');
      }

      let result;

      if (isEditMode && accountId) {
        // Update existing payment account
        const updateRequest = paymentAccountService.prepareUpdatePaymentAccountRequest(
          formData.accountName,
          selectedCurrency.value
        );

        result = await paymentAccountService.updatePaymentAccount(accountId, updateRequest);
      } else {
        // Create new payment account
        let requestBody;

        // If Stripe credentials are available, use them
        if (stripeCredentials) {
          requestBody = paymentAccountService.prepareCreatePaymentAccountWithStripeOAuth(
            formData.accountName,
            selectedMerchant.id,
            selectedCurrency.value,
            stripeCredentials,
            false
          );
        } else {
          // Otherwise, use manual payment account entry
          requestBody = paymentAccountService.prepareCreatePaymentAccountRequest(
            formData.accountName,
            selectedMerchant.id,
            selectedCurrency.value,
            formData.paymentAccount,
            false
          );
        }

        result = await paymentAccountService.createPaymentAccount(requestBody);
      }

      if (result?.success) {
        showToast(
          'Success',
          result.message || (isEditMode ? 'Payment account updated successfully!' : 'Payment account created successfully!'),
          'success'
        );
        // Clear form and Stripe credentials
        setFormData({
          accountName: '',
          paymentMerchant: merchants[0]?.name || '',
          paymentCurrency: currencies[0]?.text || '',
          paymentAccount: '',
          accessToken: '',
          publishableKey: ''
        });
        setStripeCredentials(null);
        setProcessedCode(null);
        // Navigate back to the list
        navigate('/organizer/setting/payment-account-list');
      } else {
        throw new Error(result?.message || (isEditMode ? 'Failed to update payment account' : 'Failed to create payment account'));
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.response?.data?.errorMessage ||
        error.message ||
        (isEditMode ? 'Failed to update payment account' : 'Failed to create payment account');

      showToast('Error', errorMessage, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleClearConnection = () => {
    setStripeCredentials(null);
    setFormData(prev => ({
      ...prev,
      paymentAccount: '',
      accessToken: '',
      publishableKey: ''
    }));
    onClearDialogClose();
    showToast('Connection Cleared', 'Stripe connection has been removed', 'success');
  };

  if (loading) {
    return (
      <Box
        bg={bgColor}
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="lg"
        mt={24}
        overflow="hidden"
      >
        <Box minH="400px" display="flex" alignItems="center" justifyContent="center">
          <Loader message="Loading Payment Options..." subtitle="Please wait while we fetch payment options" />
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        bg={bgColor}
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="lg"
        mt={24}
        overflow="hidden"
      >
        <Box p={8}>
          <Alert
            status="error"
            variant="subtle"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            textAlign="center"
            height="300px"
            borderRadius="lg"
          >
            <AlertIcon boxSize="40px" mr={0} />
            <AlertTitle mt={4} mb={1} fontSize="lg">
              Failed to Load Payment Data
            </AlertTitle>
            <AlertDescription maxWidth="sm" mt={2}>
              {error}
            </AlertDescription>
            <CustomButton mt={6} variant="danger" onClick={fetchMerchantsAndCurrencies}>
              Retry
            </CustomButton>
          </Alert>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      bg={bgColor}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="lg"
      mt={24}
      overflow="hidden"
    >
      {/* Header */}
      <HStack
        justify="space-between"
        align="center"
        px={6}
        py={4}
        bg={headerBg}
        borderBottomWidth="1px"
        borderColor={borderColor}
      >
        <Text fontSize="lg" fontWeight="bold" color={textColor}>
          {isEditMode ? 'Edit Payment Account' : 'Create Payment Account'}
        </Text>
        <CustomButton
          leftIcon={<MdArrowBack />}
          onClick={() => navigate('/organizer/setting/payment-account-list')}
          variant="ghost"
          size="sm"
        >
          Back to List
        </CustomButton>
      </HStack>

      {/* Form Content */}
      <Box p={8}>
        <VStack spacing={6} align="stretch">
            {/* Payment Merchant Selection Card */}
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={2}>
                Payment Merchant {isEditMode && <Text as="span" fontSize="xs" color="gray.500">(Read-only)</Text>}
              </Text>
              {merchants.map((merchant) => (
                <Box
                  key={merchant.id}
                  p={4}
                  borderWidth="2px"
                  borderColor={formData.paymentMerchant === merchant.name ? 'blue.500' : 'gray.200'}
                  borderRadius="xl"
                  cursor={isEditMode ? 'not-allowed' : 'pointer'}
                  onClick={() => !isEditMode && setFormData(prev => ({ ...prev, paymentMerchant: merchant.name }))}
                  bg={formData.paymentMerchant === merchant.name ? 'blue.50' : 'white'}
                  transition="all 0.2s"
                  _hover={isEditMode ? {} : { borderColor: 'blue.400' }}
                  opacity={isEditMode && formData.paymentMerchant !== merchant.name ? 0.5 : 1}
                  mb={2}
                >
                  <HStack justify="space-between">
                    <HStack spacing={3}>
                      <Box
                      w="40px"
                      h="40px"
                      bg="#6425EB"
                      color="white"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      borderRadius="md"
                    >
                      <Text fontWeight="bold" fontSize="lg">
                        {merchant.name.charAt(0)}
                      </Text>
                    </Box>

                      <Box>
                        <Text fontWeight="semibold" fontSize="md">{merchant.name}</Text>
                        <Text fontSize="sm" color="gray.500">
                          Online payment process for internet business
                        </Text>
                      </Box>
                    </HStack>
                    {formData.paymentMerchant === merchant.name && (
                      <Circle size="24px" bg="blue.500" color="white">
                        <Icon as={FaCheck} boxSize={3} />
                      </Circle>
                    )}
                  </HStack>
                </Box>
              ))}
            </Box>

            {/* Account Name and Payment Currency - Same Row */}
            <Grid
              templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }}
              gap={6}
            >
              <GridItem>
                <Box>
                  <FormField
                    label="Account Name"
                    name="accountName"
                    placeholder="Enter account name"
                    value={formData.accountName}
                    onChange={handleChange}
                  />
                  {!isEditMode && !formData.accountName.trim() && (
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      Required before connecting to Stripe
                    </Text>
                  )}
                </Box>
              </GridItem>
              <GridItem>
                <FormField
                  label="Payment Currency"
                  name="paymentCurrency"
                  type="select"
                  options={currencies}
                  value={formData.paymentCurrency}
                  onChange={handleChange}
                />
              </GridItem>
            </Grid>

            {/* Stripe Credentials (visible only after connection) */}
            {stripeCredentials && (
              <Box
                p={4}
                bg="green.50"
                borderWidth="1px"
                borderColor="green.200"
                borderRadius="lg"
              >
                <HStack justify="space-between" mb={4}>
                  <Text fontSize="sm" fontWeight="medium" color="green.700">
                    ✓ {isEditMode ? 'Stripe Account Connected' : 'Successfully connected to Stripe'}
                  </Text>
                  {!isEditMode && (
                    <CustomButton
                      onClick={onClearDialogOpen}
                      variant="danger"
                      size="xs"
                    >
                      Clear Connection
                    </CustomButton>
                  )}
                </HStack>
                <Grid
                  templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }}
                  gap={6}
                >
                  <GridItem>
                    <FormControl>
                      <FormLabel fontSize="sm" fontWeight="medium" color="gray.700" mb={2}>
                        Payment Account
                      </FormLabel>
                      <Input
                        name="paymentAccount"
                        value={formData.paymentAccount}
                        size="md"
                        fontSize="sm"
                        borderWidth="1px"
                        borderColor="gray.300"
                        isReadOnly
                        bg="white"
                      />
                    </FormControl>
                  </GridItem>
                  <GridItem>
                    <FormControl>
                      <FormLabel fontSize="sm" fontWeight="medium" color="gray.700" mb={2}>
                        Secret key
                      </FormLabel>
                      <Input
                        name="accessToken"
                        value={maskValue(formData.accessToken)}
                        size="md"
                        fontSize="sm"
                        borderWidth="1px"
                        borderColor="gray.300"
                        isReadOnly
                        bg="gray.100"
                        color="gray.600"
                        cursor="not-allowed"
                        _hover={{ bg: 'gray.100' }}
                      />
                    </FormControl>
                  </GridItem>
                  <GridItem>
                    <FormControl>
                      <FormLabel fontSize="sm" fontWeight="medium" color="gray.700" mb={2}>
                        Publishable Key
                      </FormLabel>
                      <Input
                        name="publishableKey"
                        value={maskValue(formData.publishableKey)}
                        size="md"
                        fontSize="sm"
                        borderWidth="1px"
                        borderColor="gray.300"
                        isReadOnly
                        bg="gray.100"
                        color="gray.600"
                        cursor="not-allowed"
                        _hover={{ bg: 'gray.100' }}
                      />
                    </FormControl>
                  </GridItem>
                </Grid>
              </Box>
            )}

            {/* Single Action Button - Changes based on connection state and edit mode */}
            <CustomButton
              onClick={isEditMode || stripeCredentials ? handleSubmit : handleConnectWithStripe}
              variant="primary"
              size="lg"
              fullWidth
              isLoading={(isEditMode || stripeCredentials) ? submitting : connectingStripe}
              loadingText={(isEditMode || stripeCredentials) ? (isEditMode ? "Updating..." : "Creating...") : "Connecting..."}
              isDisabled={!formData.accountName.trim() || !formData.paymentCurrency}
            >
              {isEditMode ? "Update Payment Account" : (stripeCredentials ? "Create Payment Account" : "Connect with Stripe")}
            </CustomButton>
        </VStack>
      </Box>

      {/* Clear Connection Confirmation Dialog */}
      <ConfirmationModal
        isOpen={isClearDialogOpen}
        onClose={onClearDialogClose}
        onConfirm={handleClearConnection}
        title="Clear Stripe Connection"
        message="Are you sure you want to clear the Stripe connection? You will need to reconnect to Stripe before you can create this payment account."
        confirmText="Clear Connection"
        cancelText="Cancel"
        type="danger"
      />
    </Box>
  );
}
