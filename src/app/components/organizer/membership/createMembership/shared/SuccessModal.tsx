import React, { useEffect, useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  Box,
  Button,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

type ConfettiPiece = { id: number; left: number; delay: number; duration: number; color: string };

const Confetti: React.FC<{ active: boolean }> = ({ active }) => {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (active) {
      setPieces(
        Array.from({ length: 50 }, (_, i) => ({
          id: i,
          left: Math.random() * 100,
          delay: Math.random() * 0.5,
          duration: 2 + Math.random() * 2,
          color: ['#ffd700', '#ff69b4', '#00ffff', '#ff4500', '#9370db'][Math.floor(Math.random() * 5)],
        })),
      );
    } else {
      setPieces([]);
    }
  }, [active]);

  return (
    <Box position="absolute" top={0} left={0} w="100%" h="100%" overflow="hidden" pointerEvents="none">
      {pieces.map((p) => (
        <Box
          key={p.id}
          position="absolute"
          left={`${p.left}%`}
          top="-10px"
          w="10px"
          h="10px"
          bg={p.color}
          style={{
            animation: `fall ${p.duration}s ease-in forwards`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
      <style>{`@keyframes fall { to { transform: translateY(120vh) rotate(720deg); opacity: 0; } }`}</style>
    </Box>
  );
};

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  showConfetti: boolean;
}

export default function SuccessModal({ isOpen, onClose, showConfetti }: SuccessModalProps) {
  const navigate = useNavigate();

  const handleDone = () => {
    onClose();
    navigate('/organizer/membership/manage');
  };

  return (
    <Modal isOpen={isOpen} onClose={handleDone} isCentered size="md" closeOnOverlayClick>
      <ModalOverlay bg="blackAlpha.700" />
      <ModalContent position="relative" overflow="hidden" borderRadius="xl" mx={4}>
        <ModalCloseButton zIndex={10} />
        <Confetti active={showConfetti} />
        <ModalBody p={8}>
          <VStack spacing={5} align="center">
            <Text fontSize="4xl">🎉</Text>
            <Text fontSize="2xl" fontWeight="bold" textAlign="center">
              Membership Published!
            </Text>
            <Text fontSize="md" color="gray.600" textAlign="center">
              Your membership type is now live and accepting registrations.
            </Text>
            <Button colorScheme="blue" size="lg" onClick={handleDone} px={10}>
              Awesome!
            </Button>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
