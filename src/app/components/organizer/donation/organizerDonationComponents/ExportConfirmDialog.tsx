import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  AlertDialogCloseButton,
  Button,
} from '@chakra-ui/react';


export const ExportConfirmDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm,
  titlePlaceholder = 'donations',
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: (exportAll: boolean) => void;
  titlePlaceholder?: string;
}) => {
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  const handleCurrentPage = () => {
    onConfirm(false);
    onClose();
  };

  const handleAllDonations = () => {
    onConfirm(true);
    onClose();
  };

  return (
    <AlertDialog
      isOpen={isOpen}
      leastDestructiveRef={cancelRef}
      onClose={onClose}
      isCentered
    >
      <AlertDialogOverlay>
        <AlertDialogContent>
          <AlertDialogHeader  fontSize="lg" fontWeight="bold">
            Export Confirmation
          </AlertDialogHeader>

          <AlertDialogCloseButton />

          <AlertDialogBody  fontSize="sm">
            {titlePlaceholder
    ? `Do you want to export ${titlePlaceholder}?`
    : 'Do you want to export?'}
          </AlertDialogBody>

          <AlertDialogFooter>
            <Button 
              ref={cancelRef} 
              onClick={handleCurrentPage}
              colorScheme="gray"
              variant="outline"
               fontSize="sm"
            >
              Current Page Data
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={handleAllDonations} 
              ml={2}
              fontSize="sm"
            >
              All List
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
};