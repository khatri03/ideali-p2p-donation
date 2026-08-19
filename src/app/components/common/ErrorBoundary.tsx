import { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Button, Heading, Text, VStack } from '@chakra-ui/react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Without this, a throw anywhere in the tree unmounts the whole application and
 * leaves an empty page with no indication of what happened.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (import.meta.env.DEV) {
      console.error(
        `Unhandled render error: ${error.message}\n${error.stack ?? ''}\n${errorInfo.componentStack ?? ''}`,
      );
    }
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <Box
        minH="100dvh"
        display="flex"
        alignItems="center"
        justifyContent="center"
        px={{ base: 4, md: 8 }}
      >
        <VStack gap={4} maxW="md" textAlign="center">
          <Heading fontSize={{ base: 'xl', md: '2xl' }}>Something went wrong</Heading>
          <Text fontSize={{ base: 'sm', md: 'md' }} color="gray.500">
            This page could not be displayed. Reloading usually resolves it. If it keeps
            happening, contact support.
          </Text>
          <Button onClick={this.handleReload} minH="11" cursor="pointer">
            Reload page
          </Button>
        </VStack>
      </Box>
    );
  }
}
