import {
  Box,
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Stack,
  Text,
} from '@chakra-ui/react';
import { FieldPreview } from './CustomFormCreatePageCards';
import {
  getLayoutPresetLabel,
  getPreviewColumnSpan,
  normalizeLayoutColumn,
} from '../helpers/CustomFormCreatePage.helpers';
import type { CustomFormFieldDraft } from '../types/customForms';

export function PreviewModal({
  isOpen,
  onClose,
  draftHeaderText,
  fields,
  previewColumnCount,
}: {
  isOpen: boolean;
  onClose: () => void;
  draftHeaderText: string;
  fields: CustomFormFieldDraft[];
  previewColumnCount: number;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Preview</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Box
            p={4}
            borderWidth="1px"
            borderColor="gray.200"
            borderRadius="xl"
            bg="gray.50"
          >
            <Text fontSize="lg" fontWeight="semibold" mb={2}>
              {draftHeaderText || 'Untitled header'}
            </Text>
            {fields.length > 0 ? (
              <SimpleGrid columns={{ base: 1, sm: 12 }} spacing={4}>
                {fields.map((field) => (
                  <Box
                    key={field.id}
                    gridColumn={{
                      base: '1 / -1',
                      sm: `span ${getPreviewColumnSpan(field, previewColumnCount)} / span ${getPreviewColumnSpan(field, previewColumnCount)}`,
                    }}
                    bg="white"
                    borderWidth="1px"
                    borderColor="gray.200"
                    borderRadius="xl"
                    p={4}
                  >
                    <Text mb={2} fontSize="sm" fontWeight="medium">
                      {field.label}
                      {field.required ? (
                        <Box as="span" ml={1} color="rose.600" fontWeight="bold">
                          *
                        </Box>
                      ) : null}
                    </Text>
                    <FieldPreview field={field} />
                  </Box>
                ))}
              </SimpleGrid>
            ) : (
              <Text fontSize="sm" color="gray.500">
                Add fields to preview the form.
              </Text>
            )}
          </Box>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export function FieldLayoutModal({
  isOpen,
  onClose,
  fieldId,
  fields,
  previewColumnCount,
  onSelectPreset,
  onClearOverride,
}: {
  isOpen: boolean;
  onClose: () => void;
  fieldId: string | null;
  fields: CustomFormFieldDraft[];
  previewColumnCount: number;
  onSelectPreset: (fieldId: string, value: number) => void;
  onClearOverride: (fieldId: string) => void;
}) {
  const activeField = fieldId
    ? fields.find((field) => field.id === fieldId) ?? null
    : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Layout</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Stack spacing={2}>
            {[1, 2, 3, 4].map((value) => (
              <Button
                key={value}
                variant="outline"
                justifyContent="space-between"
                onClick={() => fieldId && onSelectPreset(fieldId, value)}
              >
                <span>{getLayoutPresetLabel(value)}</span>
                {activeField &&
                normalizeLayoutColumn(activeField.layoutColumn ?? previewColumnCount) === value ? (
                  <span>✓</span>
                ) : null}
              </Button>
            ))}
            {fieldId ? (
              <Button variant="ghost" colorScheme="red" onClick={() => onClearOverride(fieldId)}>
                Clear layout override
              </Button>
            ) : null}
          </Stack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

export function RemoveFieldModal({
  isOpen,
  fieldLabel,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  fieldLabel: string | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Remove field</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text>
            {fieldLabel ? `Remove "${fieldLabel}" from the canvas?` : 'Remove this field?'}
          </Text>
        </ModalBody>
        <ModalFooter gap={3}>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme="red" onClick={onConfirm}>
            Remove
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export function RemoveOptionModal({
  isOpen,
  optionLabel,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  optionLabel: string | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Remove option</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text>
            {optionLabel ? `Remove "${optionLabel}"?` : 'Remove this option?'}
          </Text>
        </ModalBody>
        <ModalFooter gap={3}>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme="red" onClick={onConfirm}>
            Remove
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export function ClearCanvasModal({
  isOpen,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Clear canvas</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text>Remove every field from the canvas?</Text>
        </ModalBody>
        <ModalFooter gap={3}>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme="red" onClick={onConfirm}>
            Clear canvas
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

