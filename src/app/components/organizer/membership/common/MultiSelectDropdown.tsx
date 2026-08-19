import React, { useRef } from 'react';
import {
  Box, Checkbox, Flex, Icon, Tag, TagCloseButton, TagLabel,
  Text, useDisclosure, useOutsideClick,
} from '@chakra-ui/react';
import { MdKeyboardArrowDown, MdFilterListOff } from 'react-icons/md';

export interface SelectOption {
  value: string;
  text: string;
}

interface Props {
  options: SelectOption[];
  selected: string[];
  onToggle: (value: string) => void;
  onClear: () => void;
  placeholder?: string;
  onOpen?: () => void;
}

export default function MultiSelectDropdown({
  options, selected, onToggle, onClear, placeholder = 'All', onOpen: onOpenProp,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isOpen, onOpen, onClose, onToggle: toggle } = useDisclosure();

  useOutsideClick({ ref: containerRef, handler: onClose });

  const handleTriggerClick = () => {
    if (!isOpen && onOpenProp) onOpenProp();
    toggle();
  };

  return (
    <Box ref={containerRef} position="relative" w="full">
      {/* Trigger */}
      <Flex
        bg="gray.50"
        border="1px solid"
        borderColor={isOpen ? '#044bd9' : 'gray.200'}
        boxShadow={isOpen ? '0 0 0 1px #044bd9' : 'none'}
        borderRadius="lg"
        px={3} py={1.5} minH="40px"
        align="center" gap={1.5} flexWrap="wrap"
        cursor="pointer" w="full"
        onClick={handleTriggerClick}
        _hover={{ borderColor: isOpen ? '#044bd9' : 'gray.300' }}
        transition="border-color 0.15s, box-shadow 0.15s"
        userSelect="none"
      >
        {selected.length === 0 && (
          <Text fontSize="sm" color="gray.400" flex={1}>{placeholder}</Text>
        )}

        {selected.map((v) => {
          const opt = options.find((o) => o.value === v);
          return (
            <Tag key={v} size="sm" borderRadius="md" bg="teal.50" color="teal.700"
              border="1px solid" borderColor="teal.200" flexShrink={0}
            >
              <TagLabel fontSize="11px" fontWeight="medium">{opt?.text ?? v}</TagLabel>
              <TagCloseButton
                color="teal.600"
                onClick={(e) => { e.stopPropagation(); onToggle(v); }}
              />
            </Tag>
          );
        })}

        {selected.length > 0 && (
          <Icon
            as={MdFilterListOff} boxSize={3.5} color="gray.400"
            ml="auto" flexShrink={0} cursor="pointer"
            onClick={(e) => { e.stopPropagation(); onClear(); }}
            _hover={{ color: 'red.500' }}
          />
        )}

        <Icon
          as={MdKeyboardArrowDown} boxSize={4} color="gray.500" flexShrink={0}
          ml={selected.length > 0 ? 1 : 'auto'}
          transform={isOpen ? 'rotate(180deg)' : 'none'}
          transition="transform 0.2s"
        />
      </Flex>

      {/* Dropdown */}
      {isOpen && (
        <Box
          position="absolute"
          top="calc(100% + 4px)"
          left={0} right={0}
          zIndex={1400}
          bg="white"
          shadow="xl"
          borderRadius="xl"
          border="1px solid"
          borderColor="gray.200"
          py={1}
          maxH="240px"
          overflowY="auto"
        >
          {options.length === 0 ? (
            <Text fontSize="sm" color="gray.400" px={4} py={3}>No options available</Text>
          ) : (
            options.map((o) => {
              const checked = selected.includes(o.value);
              return (
                <Flex
                  key={o.value}
                  px={3} py={2.5} align="center" gap={3}
                  cursor="pointer"
                  bg={checked ? 'teal.50' : 'white'}
                  _hover={{ bg: checked ? 'teal.100' : 'gray.50' }}
                  onClick={(e) => { e.stopPropagation(); onToggle(o.value); }}
                  transition="background 0.1s"
                >
                  <Checkbox
                    isChecked={checked}
                    colorScheme="teal"
                    pointerEvents="none"
                    size="md"
                  />
                  <Text fontSize="sm" color={checked ? 'teal.700' : 'gray.700'} fontWeight={checked ? 'medium' : 'normal'}>
                    {o.text}
                  </Text>
                </Flex>
              );
            })
          )}
        </Box>
      )}
    </Box>
  );
}
