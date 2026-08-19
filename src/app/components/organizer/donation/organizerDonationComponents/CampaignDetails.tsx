import React from 'react';
import { Box, Text, VStack, HStack, Icon } from '@chakra-ui/react';
import { TbTargetArrow } from 'react-icons/tb';

interface CampaignDetailsProps {
  fundRaisingGoal: {
    amount: number;
    visibleToDonor: boolean;
    stepNo: number;
  };
  goalAchieved?: number;
  description: string;
  themeColor: string;
  cardBg: string;
  cardBorder: string;
  textColor: string;
  subTextColor: string;
}

const CampaignDetails: React.FC<CampaignDetailsProps> = ({
  fundRaisingGoal,
  goalAchieved = 0,
  description,
  themeColor,
  cardBg,
  cardBorder,
  textColor,
  subTextColor,
}) => {
  // Extract amount and visibility
  const goalAmount = fundRaisingGoal?.amount || 0;
  const isVisible = fundRaisingGoal?.visibleToDonor !== false;

  return (
    <VStack spacing={6} align="stretch">
      {/* Goal Section - Conditionally rendered */}
      {isVisible && (
        <Box
          p={6}
          borderRadius="xl"
          bg={cardBg}
          borderWidth="2px"
          borderColor={themeColor}
          boxShadow="lg"
        >
          <VStack spacing={3} align="stretch">
            {/* Header with icon */}
            <HStack spacing={2}>
              <Icon as={TbTargetArrow} color={themeColor} boxSize={4} />
              <Text
                fontSize="xs"
                color={themeColor}
                fontWeight="semibold"
                textTransform="uppercase"
                letterSpacing="wider"
              >
                Fundraising Goal
              </Text>
            </HStack>

            {/* Goal Amount */}
            <Text fontSize="3xl" fontWeight="bold" color={textColor} lineHeight="1">
              ${goalAmount ? goalAmount.toLocaleString() : '0'}
            </Text>

            {/* Progress Bar */}
            <Box w="100%" h="8px" bg="gray.200" borderRadius="full" overflow="hidden">
              <Box
                w="40%"
                h="100%"
                borderRadius="full"
                style={{ backgroundColor: themeColor }}
              />
            </Box>
          </VStack>
        </Box>
      )}

      {/* Description Section */}
      <Box
        p={5}
        borderRadius="xl"
        bg={cardBg}
        borderWidth="1px"
        borderColor={cardBorder}
        boxShadow="lg"
      >
        <Text fontSize="lg" fontWeight="semibold" color={textColor} mb={3}>
          About this campaign
        </Text>
        <Box
          fontSize="sm"
          color={subTextColor}
          lineHeight="1.7"
          fontWeight="normal"
          wordBreak="break-word"
          overflowWrap="break-word"
          sx={{
            // Override all inline width styles from Summernote/jQuery
            '& *': {
              maxWidth: '100% !important',
              width: 'auto !important',
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
            },
            
            // Paragraph styles
            '& p': {
              marginBottom: '12px',
              maxWidth: '100% !important',
              width: 'auto !important',
              lineHeight: '1.7',
            },
            
            // Heading styles
            '& h1': {
              fontSize: '2xl',
              fontWeight: 'bold',
              marginTop: '20px',
              marginBottom: '12px',
              color: textColor,
              lineHeight: '1.3',
            },
            '& h2': {
              fontSize: 'xl',
              fontWeight: 'bold',
              marginTop: '18px',
              marginBottom: '10px',
              color: textColor,
              lineHeight: '1.3',
            },
            '& h3': {
              fontSize: 'lg',
              fontWeight: 'bold',
              marginTop: '16px',
              marginBottom: '8px',
              color: textColor,
              lineHeight: '1.3',
            },
            '& h4': {
              fontSize: 'md',
              fontWeight: 'bold',
              marginTop: '14px',
              marginBottom: '8px',
              color: textColor,
              lineHeight: '1.3',
            },
            '& h5': {
              fontSize: 'sm',
              fontWeight: 'bold',
              marginTop: '12px',
              marginBottom: '6px',
              color: textColor,
              lineHeight: '1.3',
            },
            '& h6': {
              fontSize: 'xs',
              fontWeight: 'bold',
              marginTop: '10px',
              marginBottom: '6px',
              color: textColor,
              lineHeight: '1.3',
            },
            
            // Blockquote styles
            '& blockquote': {
              borderLeft: '4px solid',
              borderColor: themeColor,
              paddingLeft: '16px',
              paddingTop: '8px',
              paddingBottom: '8px',
              marginTop: '16px',
              marginBottom: '16px',
              fontStyle: 'italic',
              backgroundColor: 'gray.50',
              borderRadius: '4px',
              color: 'gray.700',
            },
            
            // Code block styles
            '& pre': {
              backgroundColor: 'gray.800',
              color: 'white',
              padding: '16px',
              borderRadius: '8px',
              overflowX: 'auto',
              marginTop: '16px',
              marginBottom: '16px',
              fontFamily: 'monospace',
              fontSize: '13px',
              lineHeight: '1.5',
            },
            
            // Inline code
            '& code': {
              backgroundColor: 'gray.100',
              color: 'gray.800',
              padding: '2px 6px',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '0.9em',
            },
            
            // Preserve code inside pre
            '& pre code': {
              backgroundColor: 'transparent',
              color: 'inherit',
              padding: 0,
            },
            
            // Text formatting
            '& b, & strong': {
              fontWeight: 'bold',
            },
            '& u': {
              textDecoration: 'underline',
            },
            '& i, & em': {
              fontStyle: 'italic',
            },
            
            // Links
            '& a': {
              color: themeColor,
              textDecoration: 'underline',
              wordBreak: 'break-word',
              transition: 'opacity 0.2s',
              _hover: {
                opacity: 0.7,
              },
            },
            
            // Lists
            '& ul, & ol': {
              marginLeft: '24px',
              marginBottom: '12px',
              maxWidth: '100% !important',
            },
            '& ul': {
              listStyleType: 'disc',
            },
            '& ol': {
              listStyleType: 'decimal',
            },
            '& li': {
              marginBottom: '6px',
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
              lineHeight: '1.6',
            },
            
            // Nested lists
            '& ul ul, & ol ul': {
              listStyleType: 'circle',
              marginTop: '6px',
            },
            '& ul ol, & ol ol': {
              listStyleType: 'lower-alpha',
              marginTop: '6px',
            },
            
            // Div elements (for colored backgrounds, etc.)
            '& div': {
              maxWidth: '100% !important',
              width: 'auto !important',
            },
            
            // Horizontal rules
            '& hr': {
              border: 'none',
              borderTop: '1px solid',
              borderColor: 'gray.300',
              marginTop: '16px',
              marginBottom: '16px',
            },
            
            // Tables (if any)
            '& table': {
              width: '100%',
              borderCollapse: 'collapse',
              marginTop: '16px',
              marginBottom: '16px',
            },
            '& th': {
              backgroundColor: 'gray.100',
              padding: '8px',
              textAlign: 'left',
              fontWeight: 'bold',
              borderBottom: '2px solid',
              borderColor: 'gray.300',
            },
            '& td': {
              padding: '8px',
              borderBottom: '1px solid',
              borderColor: 'gray.200',
            },
            
            // Images
            '& img': {
              maxWidth: '100%',
              height: 'auto',
              borderRadius: '8px',
              marginTop: '12px',
              marginBottom: '12px',
            },
          }}
          dangerouslySetInnerHTML={{ __html: description }}
        />
      </Box>
    </VStack>
  );
};

export default CampaignDetails;