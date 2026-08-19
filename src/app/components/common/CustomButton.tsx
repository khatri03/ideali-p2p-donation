import React from 'react';
import { Button, ButtonProps } from '@chakra-ui/react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

interface CustomButtonProps extends Omit<ButtonProps, 'variant' | 'size'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactElement;
  rightIcon?: React.ReactElement;
}

const variantStyles: Record<ButtonVariant, ButtonProps> = {
  primary: {
    colorScheme: 'blue',
    bg: '#044bd9',
    color: 'white',
    _hover: { bg: '#033fb6' },
  },
  secondary: {
    colorScheme: 'purple',
    bg: 'purple.500',
    color: 'white',
    _hover: { bg: 'purple.600' },
  },
  outline: {
    variant: 'outline',
    colorScheme: 'blue',
    borderColor: 'blue.500',
    color: 'blue.500',
    _hover: { bg: 'blue.50' },
  },
  ghost: {
    variant: 'ghost',
    colorScheme: 'gray',
    _hover: { bg: 'gray.100' },
  },
  danger: {
    colorScheme: 'red',
    bg: 'red.500',
    color: 'white',
    _hover: { bg: 'red.600' },
  },
  success: {
    colorScheme: 'green',
    bg: 'green.500',
    color: 'white',
    _hover: { bg: 'green.600' },
  },
};

const CustomButton: React.FC<CustomButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  loadingText,
  leftIcon,
  rightIcon,
  isDisabled,
  onClick,
  ...rest
}) => {
  const styles = variantStyles[variant];

  return (
    <Button
      size={size}
      w={fullWidth ? '100%' : 'auto'}
      isLoading={isLoading}
      loadingText={loadingText}
      leftIcon={leftIcon}
      rightIcon={rightIcon}
      isDisabled={isDisabled}
      onClick={onClick}
      borderRadius="lg"
      fontWeight="medium"
      {...styles}
      {...rest}
    >
      {children}
    </Button>
  );
};

export default CustomButton;
