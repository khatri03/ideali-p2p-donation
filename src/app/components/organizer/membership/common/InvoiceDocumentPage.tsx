import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Box, Button, Flex, Icon, Text } from '@chakra-ui/react';
import { MdArrowBack, MdDownload } from 'react-icons/md';
import Loader from 'app/components/common/Loader';
import InvoiceDocument, { type InvoiceDocumentData } from './InvoiceDocument';

interface InvoiceDocumentPageProps {
  data: InvoiceDocumentData | null;
  isLoading: boolean;
  error: string | null;
  loadingSubtitle: string;
  backLabel?: string;
  onBack?: () => void;
}

export default function InvoiceDocumentPage({
  data,
  isLoading,
  error,
  loadingSubtitle,
  backLabel,
  onBack,
}: InvoiceDocumentPageProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handleDownload = useReactToPrint({
    content: () => printRef.current,
    documentTitle: data ? `Invoice-${data.invoiceNo}` : 'Invoice',
  });

  if (isLoading) {
    return (
      <Flex minH="100vh" align="center" justify="center" bg="gray.50">
        <Loader message="Loading Invoice" subtitle={loadingSubtitle} />
      </Flex>
    );
  }

  if (error || !data) {
    return (
      <Flex
        minH="100vh"
        align="center"
        justify="center"
        bg="gray.50"
        direction="column"
        gap={2}
        px={4}
        textAlign="center"
      >
        <Text fontSize="lg" fontWeight="700" color="red.500">
          Invoice unavailable
        </Text>
        <Text fontSize="sm" color="gray.500">
          {error ?? 'No invoice data found.'}
        </Text>
      </Flex>
    );
  }

  return (
    <Box minH="100vh" bg="gray.50" pt={4} pb={8}>
      <Box mx={{ base: 2, md: 4 }} mt={{ base: 6, md: 10 }}>
        <Flex
          justify={onBack ? 'space-between' : 'flex-end'}
          align="center"
          mb={4}
          gap={3}
          wrap="wrap"
        >
          {onBack ? (
            <Button
              size="sm"
              variant="ghost"
              color="#044bd9"
              leftIcon={<Icon as={MdArrowBack} />}
              borderRadius="full"
              onClick={onBack}
              _hover={{ bg: 'blue.50' }}
            >
              {backLabel ?? 'Back'}
            </Button>
          ) : null}
          {/* <Button
            size="sm"
            leftIcon={<Icon as={MdDownload} boxSize={4} />}
            bg="#044bd9"
            color="white"
            borderRadius="lg"
            _hover={{ bg: '#0339ad' }}
            onClick={handleDownload}
          >
            Download Invoice
          </Button> */}
        </Flex>

        <InvoiceDocument ref={printRef} data={data} />
      </Box>
    </Box>
  );
}
