import { Button, Icon } from '@chakra-ui/react';
import { MdDownload } from 'react-icons/md';

interface DownloadReceiptButtonProps {
  receiptUrl: string | null;
  invoiceNo: string;
  size?: 'sm' | 'md';
}

function DownloadReceiptButton({ receiptUrl, invoiceNo, size = 'sm' }: DownloadReceiptButtonProps) {
  const handleDownload = () => {
    if (!receiptUrl) return;
    const a = document.createElement('a');
    a.href = receiptUrl;
    a.download = `receipt-${invoiceNo}.pdf`;
    a.target = '_blank';
    a.click();
  };

  return (
    <Button size={size} variant="outline" colorScheme="brand" leftIcon={<Icon as={MdDownload} />} isDisabled={!receiptUrl} onClick={handleDownload}>
      Receipt
    </Button>
  );
}

export default DownloadReceiptButton;
