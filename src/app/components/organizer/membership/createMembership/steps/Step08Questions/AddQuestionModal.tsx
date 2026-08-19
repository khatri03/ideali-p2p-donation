import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalCloseButton,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  Icon,
  Input,
  Select,
  Spinner,
  Switch,
  Text,
  IconButton,
  useToast,
} from '@chakra-ui/react';
import { MdAdd, MdDelete } from 'react-icons/md';
import { CustomQuestion } from './useStep08';
import membershipWizardService from '../../../services/membershipWizardService';

type FormControl = {
  id: number;
  name: string;
  controlType: string;
  iconClass: string;
  defaultLabel: string;
  hasOptions: boolean;
  canHavePlaceHolder: boolean;
  canHaveMinLength: boolean;
  canHaveMaxLength: boolean;
  acceptedFileTypes: Array<{ text: string; value: string }> | null;
};

type QuestionPayload = Omit<CustomQuestion, 'id' | 'displayOrder'>;

interface AddQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (question: QuestionPayload) => void;
  initialData?: CustomQuestion | null;
}

interface OptionRow {
  displayText: string;
  value: string;
  isDefault: boolean;
}

const inputStyle = {
  fontSize: 'sm' as const,
  bg: 'white',
  borderColor: 'gray.300',
  borderRadius: 'lg' as const,
  _focus: { borderColor: '#044bd9', boxShadow: '0 0 0 1px #044bd9' },
  _hover: { borderColor: 'gray.400' },
};

export default function AddQuestionModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: AddQuestionModalProps) {
  const toast = useToast();
  const isEditing = !!initialData;

  const [controls, setControls] = useState<FormControl[]>([]);
  const [loadingControls, setLoadingControls] = useState(false);
  const [selectedControlId, setSelectedControlId] = useState<number>(1);

  const [label, setLabel] = useState('');
  const [placeholder, setPlaceholder] = useState('');
  const [tooltip, setTooltip] = useState('');
  const [required, setRequired] = useState(false);
  const [requiredMessage, setRequiredMessage] = useState('');
  const [defaultValue, setDefaultValue] = useState('');
  const [minLength, setMinLength] = useState('');
  const [maxLength, setMaxLength] = useState('');
  const [acceptedFileTypes, setAcceptedFileTypes] = useState('');
  const [options, setOptions] = useState<OptionRow[]>([
    { displayText: '', value: '', isDefault: false },
  ]);

  // Fetch controls once
  useEffect(() => {
    setLoadingControls(true);
    membershipWizardService
      .getCustomFormControls()
      .then((res) => {
        if (res.data?.data) setControls(res.data.data);
      })
      .catch(() => {})
      .finally(() => setLoadingControls(false));
  }, []);

  // Sync form when modal opens
  useEffect(() => {
    if (!isOpen) return;
    if (initialData) {
      setSelectedControlId(initialData.controlId);
      setLabel(initialData.label);
      setPlaceholder(initialData.placeHolder);
      setTooltip(initialData.tooltip);
      setRequired(initialData.required);
      setRequiredMessage(initialData.requiredMessage);
      setDefaultValue(initialData.defaultValue);
      setMinLength(initialData.minLength);
      setMaxLength(initialData.maxLength);
      setAcceptedFileTypes(initialData.acceptedFileTypes);
      setOptions(
        initialData.options.length > 0
          ? initialData.options.map((o) => ({
              displayText: o.displayText,
              value: o.value,
              isDefault: o.isDefault,
            }))
          : [{ displayText: '', value: '', isDefault: false }],
      );
    } else {
      setSelectedControlId(controls[0]?.id ?? 1);
      setLabel('');
      setPlaceholder('');
      setTooltip('');
      setRequired(false);
      setRequiredMessage('');
      setDefaultValue('');
      setMinLength('');
      setMaxLength('');
      setAcceptedFileTypes('');
      setOptions([{ displayText: '', value: '', isDefault: false }]);
    }
  }, [isOpen, initialData]);

  const selected = controls.find((c) => c.id === selectedControlId);
  const showOptions = selected?.hasOptions ?? false;
  const showPlaceholder = selected?.canHavePlaceHolder ?? true;
  const showMinMax =
    (selected?.canHaveMinLength || selected?.canHaveMaxLength) ?? false;
  const showFileTypes =
    selected?.acceptedFileTypes != null &&
    selected.acceptedFileTypes.length > 0;

  const addOption = () =>
    setOptions((prev) => [
      ...prev,
      { displayText: '', value: '', isDefault: false },
    ]);

  const removeOption = (i: number) =>
    setOptions((prev) => prev.filter((_, idx) => idx !== i));

  const updateOption = (i: number, patch: Partial<OptionRow>) =>
    setOptions((prev) =>
      prev.map((o, idx) => (idx === i ? { ...o, ...patch } : o)),
    );

  const handleSave = (keepOpen: boolean) => {
    if (!label.trim()) {
      toast({
        title: 'Label is required',
        status: 'error',
        position: 'top-right',
      });
      return;
    }
    if (showOptions && options.some((o) => !o.displayText.trim())) {
      toast({
        title: 'All option labels are required',
        status: 'error',
        position: 'top-right',
      });
      return;
    }

    onSave({
      uniqueId: initialData?.uniqueId,
      controlId: selected?.id ?? selectedControlId,
      controlName: selected?.name ?? '',
      controlType: selected?.controlType ?? '',
      iconClass: selected?.iconClass ?? '',
      label: label.trim(),
      placeHolder: placeholder.trim(),
      tooltip: tooltip.trim(),
      required,
      requiredMessage: requiredMessage.trim(),
      acceptedFileTypes: acceptedFileTypes.trim(),
      minLength: minLength.trim(),
      maxLength: maxLength.trim(),
      defaultValue: defaultValue.trim(),
      options: showOptions
        ? options.map((o) => ({
            displayText: o.displayText.trim(),
            value:
              o.value.trim() ||
              o.displayText.trim().toLowerCase().replace(/\s+/g, '_'),
            isDefault: o.isDefault,
          }))
        : [],
    });

    if (keepOpen && !isEditing) {
      setSelectedControlId(controls[0]?.id ?? 1);
      setLabel('');
      setPlaceholder('');
      setTooltip('');
      setRequired(false);
      setRequiredMessage('');
      setDefaultValue('');
      setMinLength('');
      setMaxLength('');
      setAcceptedFileTypes('');
      setOptions([{ displayText: '', value: '', isDefault: false }]);
    } else {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      isCentered
      size="xl"
      scrollBehavior="inside"
    >
      <ModalOverlay bg="blackAlpha.500" />
      <ModalContent borderRadius="2xl" mx={4} overflow="hidden" maxH="90vh">
        <Box
          px={6}
          pt={5}
          pb={4}
          borderBottom="1px solid"
          borderColor="gray.100"
        >
          <Text fontSize="lg" fontWeight="bold" color="gray.900">
            {isEditing ? 'Edit Question' : 'Add Custom Question'}
          </Text>
          <Text fontSize="xs" color="gray.400" mt={0.5}>
            {isEditing ? (
              'Update the question details below.'
            ) : (
              <>
                Fill in the question details. Fields marked with{' '}
                <Text as="span" color="red.500">
                  *
                </Text>{' '}
                are required.
              </>
            )}
          </Text>
        </Box>
        <ModalCloseButton top={4} right={4} size="sm" />

        <Box
          px={6}
          py={5}
          overflowY="auto"
          display="flex"
          flexDirection="column"
          gap={4}
        >
          {/* Control Type */}
          <FormControl>
            <FormLabel
              fontSize="sm"
              fontWeight="medium"
              color="gray.700"
              mb={1}
            >
              Question Type{' '}
              <Text as="span" color="red.500">
                *
              </Text>
            </FormLabel>
            {loadingControls ? (
              <Flex align="center" gap={2} h="38px">
                <Spinner size="sm" color="blue.400" />
                <Text fontSize="sm" color="gray.400">
                  Loading types...
                </Text>
              </Flex>
            ) : (
              <Select
                value={selectedControlId}
                onChange={(e) => {
                  setSelectedControlId(Number(e.target.value));
                  setOptions([
                    { displayText: '', value: '', isDefault: false },
                  ]);
                }}
                {...inputStyle}
              >
                {controls.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            )}
          </FormControl>

          {/* Label + Placeholder */}
          <Grid templateColumns={showPlaceholder ? '1fr 1fr' : '1fr'} gap={3}>
            <FormControl>
              <FormLabel
                fontSize="sm"
                fontWeight="medium"
                color="gray.700"
                mb={1}
              >
                Label{' '}
                <Text as="span" color="red.500">
                  *
                </Text>
              </FormLabel>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="input text"
                maxLength={100}
                {...inputStyle}
              />
            </FormControl>
            {showPlaceholder && (
              <FormControl>
                <FormLabel
                  fontSize="sm"
                  fontWeight="medium"
                  color="gray.700"
                  mb={1}
                >
                  Placeholder
                </FormLabel>
                <Input
                  value={placeholder}
                  onChange={(e) => setPlaceholder(e.target.value)}
                  placeholder="placeholder text"
                  maxLength={100}
                  {...inputStyle}
                />
              </FormControl>
            )}
          </Grid>

          {/* Tooltip + Default Value */}
          <Grid templateColumns={!showOptions ? '1fr 1fr' : '1fr'} gap={3}>
            <FormControl>
              <FormLabel
                fontSize="sm"
                fontWeight="medium"
                color="gray.700"
                mb={1}
              >
                Tooltip
              </FormLabel>
              <Input
                value={tooltip}
                onChange={(e) => setTooltip(e.target.value)}
                placeholder="Helper hint text"
                maxLength={200}
                {...inputStyle}
              />
            </FormControl>
            {!showOptions && (
              <FormControl>
                <FormLabel
                  fontSize="sm"
                  fontWeight="medium"
                  color="gray.700"
                  mb={1}
                >
                  Default Value
                </FormLabel>
                <Input
                  value={defaultValue}
                  onChange={(e) => setDefaultValue(e.target.value)}
                  placeholder="Pre-filled value"
                  maxLength={200}
                  {...inputStyle}
                />
              </FormControl>
            )}
          </Grid>

          {/* Min / Max length */}
          {showMinMax && (
            <Grid templateColumns="1fr 1fr" gap={3}>
              {selected?.canHaveMinLength && (
                <FormControl>
                  <FormLabel
                    fontSize="sm"
                    fontWeight="medium"
                    color="gray.700"
                    mb={1}
                  >
                    Min Length
                  </FormLabel>
                  <Input
                    type="number"
                    min="0"
                    value={minLength}
                    onChange={(e) => {
                      if (e.target.value.replace('-', '').length <= 4)
                        setMinLength(e.target.value);
                    }}
                    placeholder="0"
                    {...inputStyle}
                  />
                </FormControl>
              )}
              {selected?.canHaveMaxLength && (
                <FormControl>
                  <FormLabel
                    fontSize="sm"
                    fontWeight="medium"
                    color="gray.700"
                    mb={1}
                  >
                    Max Length
                  </FormLabel>
                  <Input
                    type="number"
                    min="0"
                    value={maxLength}
                    onChange={(e) => {
                      if (e.target.value.replace('-', '').length <= 4)
                        setMaxLength(e.target.value);
                    }}
                    placeholder="500"
                    {...inputStyle}
                  />
                </FormControl>
              )}
            </Grid>
          )}

          {/* Accepted file types */}
          {showFileTypes && (
            <FormControl>
              <FormLabel
                fontSize="sm"
                fontWeight="medium"
                color="gray.700"
                mb={1}
              >
                Accepted File Types
              </FormLabel>
              <Select
                value={acceptedFileTypes}
                onChange={(e) => setAcceptedFileTypes(e.target.value)}
                {...inputStyle}
              >
                <option value="">Any file type</option>
                {selected!.acceptedFileTypes!.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.text}
                  </option>
                ))}
              </Select>
            </FormControl>
          )}

          {/* Required toggle */}
          <Flex
            border="1px solid"
            borderColor="gray.200"
            borderRadius="xl"
            px={4}
            py={3}
            align="center"
            justify="space-between"
          >
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="gray.700">
                Required
              </Text>
              <Text fontSize="xs" color="gray.400">
                Members must answer this question
              </Text>
            </Box>
            <Switch
              isChecked={required}
              onChange={(e) => setRequired(e.target.checked)}
              colorScheme="blue"
              size="md"
            />
          </Flex>

          {required && (
            <FormControl>
              <FormLabel
                fontSize="sm"
                fontWeight="medium"
                color="gray.700"
                mb={1}
              >
                Required Error Message
              </FormLabel>
              <Input
                value={requiredMessage}
                onChange={(e) => setRequiredMessage(e.target.value)}
                placeholder="This field is required."
                maxLength={200}
                {...inputStyle}
              />
            </FormControl>
          )}

          {/* Options */}
          {showOptions && (
            <Box>
              <Flex justify="space-between" align="center" mb={2}>
                <Text fontSize="sm" fontWeight="medium" color="gray.700">
                  Options{' '}
                  <Text as="span" color="red.500">
                    *
                  </Text>
                </Text>
                <Button
                  size="xs"
                  variant="ghost"
                  color="blue.500"
                  leftIcon={<Icon as={MdAdd} boxSize={3} />}
                  onClick={addOption}
                  _hover={{ bg: 'blue.50' }}
                  fontWeight="normal"
                >
                  Add Option
                </Button>
              </Flex>
              <Box
                border="1px solid"
                borderColor="gray.200"
                borderRadius="xl"
                overflow="hidden"
              >
                {options.map((opt, i) => (
                  <Flex
                    key={i}
                    align="center"
                    px={3}
                    py={2.5}
                    gap={2}
                    borderBottom={i < options.length - 1 ? '1px solid' : 'none'}
                    borderColor="gray.100"
                  >
                    <Input
                      flex={1}
                      placeholder={`Option ${i + 1} label`}
                      value={opt.displayText}
                      onChange={(e) =>
                        updateOption(i, { displayText: e.target.value })
                      }
                      maxLength={100}
                      size="sm"
                      bg="white"
                      borderColor="gray.200"
                      borderRadius="md"
                      _focus={{ borderColor: '#044bd9' }}
                    />
                    <Flex align="center" gap={1} flexShrink={0}>
                      <Text fontSize="xs" color="gray.400">
                        Default
                      </Text>
                      <Switch
                        size="sm"
                        isChecked={opt.isDefault}
                        onChange={(e) =>
                          updateOption(i, { isDefault: e.target.checked })
                        }
                        colorScheme="blue"
                      />
                    </Flex>
                    <IconButton
                      aria-label="Remove option"
                      icon={<Icon as={MdDelete} boxSize={3.5} />}
                      size="xs"
                      variant="ghost"
                      color="red.400"
                      borderRadius="md"
                      onClick={() => removeOption(i)}
                      isDisabled={options.length === 1}
                    />
                  </Flex>
                ))}
              </Box>
            </Box>
          )}
        </Box>

        <Flex
          px={6}
          py={4}
          borderTop="1px solid"
          borderColor="gray.100"
          justify="space-between"
          align="center"
        >
          <Button
            size="sm"
            variant="ghost"
            color="gray.600"
            borderRadius="lg"
            onClick={onClose}
            _hover={{ bg: 'gray.100' }}
          >
            Close
          </Button>
          <Button
            size="sm"
            bg="#044bd9"
            color="white"
            borderRadius="lg"
            px={5}
            onClick={() => handleSave(false)}
            _hover={{ bg: 'blue.500' }}
            _active={{ bg: '#0235a0' }}
          >
            {isEditing ? 'Save Changes' : 'Add & Close'}
          </Button>
        </Flex>
      </ModalContent>
    </Modal>
  );
}
