import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Flex,
  Box,
  Heading,
  IconButton,
  Tooltip,
  Icon,
} from '@chakra-ui/react';
import { ExportButtonProps } from '../../../../interface/donationInter/exportButtonDto';

  export const ExportButton: React.FC<ExportButtonProps> = ({ icon, label, onClick }) => (
    <Tooltip label={label} placement="top">
      <IconButton
        icon={<Icon as={icon} color="white" />}
        onClick={onClick}
        size="sm"
        variant="ghost"
        bg="transparent"
        borderRadius="md"
        _hover={{ bg: 'whiteAlpha.200' }}
        aria-label={label}
      />
    </Tooltip>
  );