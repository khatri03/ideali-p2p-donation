import React, { useState, useEffect } from 'react';
import { Box, VStack, Text, HStack, Divider, Select, Input, Spinner } from '@chakra-ui/react';
import { DonationFormData } from '../../../../interface/donationInter/donationFormDto';
import { donationService, PresetTip } from '../../../../service/organizer/donation/donatePaymentService';

interface DonationSummaryProps {
  formData: DonationFormData;
  themeColor: string;
  textColor: string;
  subTextColor: string;
  onTipChange?: (tipAmount: string, tipDescription: string, totalAmount: string) => void;  // NEW
}

const DonationSummary = React.memo(({
  formData,
  themeColor,
  textColor,
  subTextColor,
  onTipChange,
}: DonationSummaryProps) => {
  const [contributionType, setContributionType] = useState('Other');
  const [contributionAmount, setContributionAmount] = useState('0');
  const [presetTips, setPresetTips] = useState<PresetTip[]>([

  ]);
  const [loading, setLoading] = useState(true);

  // Fetch preset tips on component mount
  useEffect(() => {
    const fetchPresetTips = async () => {
      try {
        setLoading(true);
        console.log('Fetching preset tips...');
        const response = await donationService.getPresetTips();
        
        console.log('API Response:', response);
        
        if (response.success && response.data && response.data.length > 0) {
          setPresetTips(response.data);
          console.log('Preset tips set:', response.data);
          
          // Set default option if available
          const defaultTip = response.data.find(tip => tip.isDefault);
          if (defaultTip) {
            setContributionType(defaultTip.percent.toString());
            if (formData.donationAmount) {
              const calculated = (parseFloat(formData.donationAmount.toString()) * defaultTip.percent / 100).toFixed(2);
              setContributionAmount(calculated);
            }
          }
        } else {
          console.warn('API response invalid or empty, using fallback values');
        }
      } catch (error) {
        console.error('Failed to fetch preset tips:', error);
        // Keep fallback values that are already initialized
      } finally {
        setLoading(false);
      }
    };

    fetchPresetTips();
  }, [formData.donationAmount]);

  // Notify parent component whenever tip changes
  useEffect(() => {
  if (onTipChange) {
    const description = contributionType === 'Other' 
      ? 'Tip Amount-Other' 
      : `Tip Amount-${contributionType}%`;
    
    // Calculate total amount
    const donationAmt = formData.donationAmount 
      ? parseFloat(formData.donationAmount.toString()) 
      : 0;
    const tipAmt = parseFloat(contributionAmount || '0');
    const total = (donationAmt + tipAmt).toFixed(2);
    
    // Pass tip amount, description, AND total
    onTipChange(contributionAmount, description, total);
  }
}, [contributionAmount, contributionType, onTipChange, formData.donationAmount]);

  // Recalculate contribution amount when donation amount changes
  useEffect(() => {
    if (contributionType !== 'Other' && formData.donationAmount) {
      const percentage = parseInt(contributionType);
      const calculated = (parseFloat(formData.donationAmount.toString()) * percentage / 100).toFixed(2);
      setContributionAmount(calculated);
    }
  }, [formData.donationAmount, contributionType]);

  const handleContributionTypeChange = (value: string) => {
    setContributionType(value);
    let newAmount = '0';
    
    if (value !== 'Other' && formData.donationAmount) {
      const percentage = parseInt(value);
      newAmount = (parseFloat(formData.donationAmount.toString()) * percentage / 100).toFixed(2);
    }
    
    setContributionAmount(newAmount);
  };

  const totalAmount = formData.donationAmount 
    ? (parseFloat(formData.donationAmount.toString()) + parseFloat(contributionAmount || '0')).toFixed(2)
    : '0.00';

  return (
    <Box>
      

      <VStack spacing={4} align="stretch">
        {/* Donation Amount */}
        <HStack justify="space-between" >
          <Text fontSize="lg" fontWeight="semibold" color="gray.800">
            Donation
          </Text>
          <Text fontSize="lg" fontWeight="bold" color="gray.800">
            ${formData.donationAmount || '0.00'}
          </Text>
        </HStack>

        <Divider borderColor="gray.200" />

        {/* Platform Support Message */}
        <Box >
          <HStack spacing={1} mb={2}>
            <Text fontSize="md" color="purple.600" fontWeight="medium">
              Help keep our platform free for charities
            </Text>
            <Text fontSize="sm">💜</Text>
            <Text fontSize="xs" color="gray.500" fontWeight="normal">
              (optional)
            </Text>
          </HStack>
          
          <Text fontSize="sm" color="gray.600" mb={2} lineHeight="1.6">
            Your generosity allows nonprofits to use our 100% free fundraising platform with unlimited support, making your impact even stronger.
          </Text>
          
          {/* Contribution Section */}
          <HStack spacing={3} align="center">
            <Box position="relative" w="110px">
              <Select 
                size="sm" 
                value={contributionType}
                onChange={(e) => handleContributionTypeChange(e.target.value)}
                bg="white" 
                borderRadius="md" 
                fontSize="sm"
                w="110px"
                h="32px"
                borderColor="gray.300"
                color="gray.700"
                disabled={loading}
                opacity={loading ? 0.6 : 1}
              >
                <option value="Other">Other</option>
                {presetTips && presetTips.length > 0 && presetTips.map((tip) => (
                  <option key={tip.percent} value={tip.percent.toString()}>
                    {tip.percent}%
                  </option>
                ))}
              </Select>
              {loading && (
                <Box
                  position="absolute"
                  right="8px"
                  top="50%"
                  transform="translateY(-50%)"
                  pointerEvents="none"
                >
                  <Spinner size="xs" color="purple.500" thickness="2px" />
                </Box>
              )}
            </Box>
            
            <Text fontSize="sm" color="gray.700" whiteSpace="nowrap">
              Contribution
            </Text>

            <Box position="relative" w="110px">
              <Input 
                value={contributionAmount}
                onChange={(e) => setContributionAmount(e.target.value)}
                placeholder="0" 
                bg="white" 
                borderRadius="md" 
                fontSize="sm"
                textAlign="right"
                type="number"
                borderColor="gray.300"
                color="gray.700"
                h="32px"
                pr="25px"
                w="100%"
              />
              <Text 
                fontSize="sm" 
                color="gray.500"
                position="absolute"
                right="10px"
                top="50%"
                transform="translateY(-50%)"
                pointerEvents="none"
                zIndex={1}
              >
                $
              </Text>
            </Box>
          </HStack>
        </Box>

        <Divider borderColor="gray.200" />

        {/* Total */}
        <HStack justify="space-between" py={2}>
          <Text fontSize="xl" fontWeight="bold" color="gray.800">
            Total
          </Text>
          <Text fontSize="lg" fontWeight="bold" color="gray.800">
            ${totalAmount}
          </Text>
        </HStack>
      </VStack>
    </Box>
  );
});

DonationSummary.displayName = 'DonationSummary';

export default DonationSummary;