import React, { useEffect, useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  Box,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import CustomButton from '../../../../common/CustomButton';
import successIcon from '../../../../../../assets/img/organizer/donation/Container.svg';

type ConfettiPiece = {
  id: number;
  left: number;
  delay: number;
  duration: number;
  color: string;
  rotation: number;
};

const PartyPopper: React.FC<{ isActive?: boolean }> = ({ isActive = false }) => {
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (isActive) {
      const pieces: ConfettiPiece[] = [];
      for (let i = 0; i < 50; i++) {
        pieces.push({
          id: i,
          left: Math.random() * 100,
          delay: Math.random() * 0.5,
          duration: 2 + Math.random() * 2,
          color: ['#ffd700', '#ff69b4', '#00ffff', '#ff4500', '#9370db'][
            Math.floor(Math.random() * 5)
          ],
          rotation: Math.random() * 360,
        });
      }
      setConfetti(pieces);
    } else {
      setConfetti([]);
    }
  }, [isActive]);

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {confetti.map((piece) => (
        <div
          key={piece.id}
          style={{
            position: 'absolute',
            left: `${piece.left}%`,
            top: '-10px',
            width: '10px',
            height: '10px',
            backgroundColor: piece.color,
            animation: `fall ${piece.duration}s ease-in forwards`,
            animationDelay: `${piece.delay}s`,
            transform: `rotate(${piece.rotation}deg)`,
          }}
        />
      ))}
      <style>{`
        @keyframes fall {
          to {
            transform: translateY(120vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export interface CampaignSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  showConfetti: boolean;
}

/**
 * Campaign Success Modal
 * Displayed after successfully publishing a campaign
 */
const CampaignSuccessModal: React.FC<CampaignSuccessModalProps> = ({
  isOpen,
  onClose,
  showConfetti,
}) => {
  const navigate = useNavigate();

  const handleClose = () => {
    onClose();
    navigate('/organizer/donation/manage-donation-module', {
      state: { refresh: true },
    });
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      isCentered
      size="md"
      closeOnOverlayClick={true}
      closeOnEsc={true}
    >
      <ModalOverlay bg="blackAlpha.700" onClick={handleOverlayClick} />
      <ModalContent
        position="relative"
        overflow="hidden"
        borderRadius="xl"
        mx={4}
        boxShadow="2xl"
      >
        <ModalCloseButton zIndex={10000} top={3} right={3} />
        <PartyPopper isActive={showConfetti} />

        <ModalBody p={8}>
          <VStack spacing={5} align="center">
            {/* Blue circle with checkmark */}
            <img src={successIcon} alt="success" width="99" height="99" />

            {/* Title */}
            <Text
              fontSize="2xl"
              fontWeight="bold"
              textAlign="center"
              color="black"
              lineHeight="1.2"
            >
              🎉 Congratulations! 🎉
            </Text>

            {/* Subtitle */}
            <Text
              fontSize="md"
              textAlign="center"
              color="black"
              mt={-2}
            >
              Your campaign is Published!
            </Text>

            {/* CustomButton replacing the plain Chakra Button */}
            <CustomButton
              variant="primary"
              size="lg"
              width={201}
              onClick={handleClose}
              _hover={{ bg: '#4a7de0' }}
              _active={{ bg: '#3a6dd0' }}
            >
              Awesome!
            </CustomButton>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default CampaignSuccessModal;