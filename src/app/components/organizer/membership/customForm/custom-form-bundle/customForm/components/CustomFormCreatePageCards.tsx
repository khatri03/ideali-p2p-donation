import type { ReactNode } from 'react';
import {
  Badge,
  Box,
  Button,
  Checkbox,
  Flex,
  Icon,
  IconButton,
  Input,
  HStack,
  Radio,
  RadioGroup,
  Select,
  Stack,
  Text,
  Textarea,
  Tooltip,
} from '@chakra-ui/react';
import { useDraggable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CircleHelp, Check } from 'lucide-react';
import { MdClose, MdDelete, MdDragIndicator } from 'react-icons/md';
import { MultiSelectInput } from '../shared/inputs/MultiSelectInput/MultiSelectInput';
import {
  CONTROL_ICON_MAP,
  getDefaultMultiSelectValues,
  getLayoutPresetLabel,
  type ActiveDragItem,
} from '../helpers/CustomFormCreatePage.helpers';
import type {
  CustomFormControl,
  CustomFormFieldDraft,
} from '../types/customForms';

export function getControlIcon(control: CustomFormControl) {
  return (
    CONTROL_ICON_MAP[control.controlType.trim().toLowerCase()] ?? CircleHelp
  );
}

export function PaletteCard({
  control,
  count,
  onDoubleClick,
}: {
  control: CustomFormControl;
  count: number;
  onDoubleClick: (control: CustomFormControl) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `palette-${control.id}`,
      data: { source: 'palette', control },
    });

  const IconComponent = getControlIcon(control);

  return (
    <Box
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onDoubleClick={() => onDoubleClick(control)}
      opacity={isDragging ? 0.55 : 1}
      borderWidth="1px"
      borderColor="gray.200"
      borderRadius="xl"
      bg="white"
      px={3}
      py={2.5}
      cursor="grab"
      boxShadow="none"
      _hover={{
        borderColor: 'blue.300',
        boxShadow: 'sm',
        transform: 'translateY(-1px)',
      }}
      style={
        transform ? { transform: CSS.Translate.toString(transform) } : undefined
      }
    >
      <HStack spacing={3} align="center" w="full">
        <Flex
          boxSize={8}
          align="center"
          justify="center"
          borderRadius="md"
          bg="blue.50"
          color="blue.600"
          flexShrink={0}
        >
          <Icon as={IconComponent} boxSize={4} />
        </Flex>
        <Box flex="1" minW={0}>
          <Text
            fontSize="xs"
            fontWeight="semibold"
            color="gray.800"
            whiteSpace="nowrap"
            overflow="hidden"
            textOverflow="ellipsis"
          >
            {control.name}
          </Text>
        </Box>
        <Badge
          colorScheme={count > 0 ? 'blue' : 'gray'}
          borderRadius="full"
          flexShrink={0}
          fontSize="9px"
          px={2}
        >
          {count}
        </Badge>
      </HStack>
    </Box>
  );
}

export function FieldCard({
  field,
  selected,
  span,
  layoutColumn,
  showDragHandle,
  onSelect,
  onOpenLayoutMenu,
  onClearLayout,
  onRemove,
}: {
  field: CustomFormFieldDraft;
  selected: boolean;
  span: number;
  layoutColumn: number;
  showDragHandle: boolean;
  onSelect: (id: string) => void;
  onOpenLayoutMenu: (
    fieldId: string,
    position: { x: number; y: number },
  ) => void;
  onClearLayout: (fieldId: string) => void;
  onRemove: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: field.id,
    data: { source: 'field' },
  });

  return (
    <Box
      ref={setNodeRef}
      w="full"
      gridColumn={{ base: '1 / -1', sm: `span ${span} / span ${span}` }}
      borderWidth="1px"
      borderColor={selected ? 'blue.400' : 'gray.200'}
      bg="white"
      borderRadius="2xl"
      p={3}
      boxShadow={selected ? '0 0 0 4px rgba(59, 130, 246, 0.12)' : 'sm'}
      opacity={isDragging ? 0.55 : 1}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      cursor="default"
      minH="12.5rem"
      overflow="hidden"
      onClick={() => onSelect(field.id)}
    >
      <Flex justify="space-between" align="flex-start" gap={3} direction="row">
        <Box minW={0} flex="1">
          <HStack spacing={2} mb={1}>
            {field.required ? (
              layoutColumn >= 3 ? (
                <Tooltip label="Required" placement="top" hasArrow>
                  <Box
                    as="span"
                    display="inline-flex"
                    alignItems="center"
                    justifyContent="center"
                    flexShrink={0}
                    w={4}
                    h={4}
                    lineHeight={1}
                  >
                    <Icon
                      as={Check}
                      boxSize={3}
                      color="red.500"
                      aria-label="Required"
                    />
                  </Box>
                </Tooltip>
              ) : (
                <Box
                  as="span"
                  px={2}
                  py={0.5}
                  borderRadius="full"
                  bg="red.50"
                  color="red.700"
                  fontSize="10px"
                  fontWeight="bold"
                  lineHeight={1.2}
                  textTransform="uppercase"
                  flexShrink={0}
                >
                  Required
                </Box>
              )
            ) : null}
            <Tooltip
              label={field.label}
              placement="top"
              hasArrow
              openDelay={300}
            >
              <Text
                fontSize="sm"
                fontWeight="semibold"
                color="gray.900"
                noOfLines={1}
                cursor="help"
                minW={0}
                flex="1"
              >
                {field.label}
              </Text>
            </Tooltip>
          </HStack>
        </Box>

        <HStack spacing={1.5} flexShrink={0} flexWrap="nowrap">
          {showDragHandle ? (
            <IconButton
              aria-label="Drag to reorder"
              icon={<Icon as={MdDragIndicator} />}
              size="xs"
              variant="ghost"
              cursor="grab"
              {...attributes}
              {...listeners}
            />
          ) : null}
          <Button
            size="xs"
            variant="outline"
            colorScheme="blue"
            onClick={(event) => {
              event.stopPropagation();
              const rect = event.currentTarget.getBoundingClientRect();
              onOpenLayoutMenu(field.id, { x: rect.right, y: rect.bottom + 8 });
            }}
            px={2.5}
            minW="3.25rem"
          >
            {getLayoutPresetLabel(layoutColumn)}
          </Button>
          {field.layoutColumn !== null ? (
            <IconButton
              aria-label="Remove layout override"
              icon={<Icon as={MdClose} />}
              size="xs"
              variant="ghost"
              colorScheme="red"
              onClick={(event) => {
                event.stopPropagation();
                onClearLayout(field.id);
              }}
            />
          ) : null}
          <IconButton
            aria-label="Remove field"
            icon={<Icon as={MdDelete} />}
            size="xs"
            variant="ghost"
            colorScheme="red"
            onClick={(event) => {
              event.stopPropagation();
              onRemove(field.id);
            }}
          />
        </HStack>
      </Flex>

      <Box
        mt={3}
        p={3}
        borderWidth="1px"
        borderColor="gray.100"
        borderRadius="xl"
        bg="gray.50"
      >
        <FieldPreview field={field} />
      </Box>
    </Box>
  );
}

export function FieldPreview({ field }: { field: CustomFormFieldDraft }) {
  const controlType = field.controlType.toLowerCase();
  const defaultOptionValue =
    field.options.find((option) => option.isDefault)?.value ??
    field.defaultValue ??
    '';

  switch (controlType) {
    case 'textarea':
      return (
        <Textarea
          placeholder={field.placeholder || field.label}
          isReadOnly
          rows={4}
          bg="white"
        />
      );
    case 'select':
      return (
        <Select
          placeholder={field.placeholder || 'Select one'}
          isDisabled
          bg="white"
        >
          {field.options.map((option) => (
            <option key={option.id} value={option.value}>
              {option.displayText}
            </option>
          ))}
        </Select>
      );
    case 'multiselect':
      return (
        <MultiSelectInput
          value={getDefaultMultiSelectValues(field)}
          onChange={() => undefined}
          options={field.options.map((option) => ({
            label: option.displayText,
            value: option.value,
          }))}
          placeholder={field.placeholder || 'Select one or more'}
        />
      );
    case 'checkbox':
      return (
        <Checkbox
          isChecked={defaultOptionValue === 'true'}
          pointerEvents="none"
        >
          {field.label}
        </Checkbox>
      );
    case 'radio':
      return (
        <RadioGroup value={defaultOptionValue}>
          <Stack spacing={2}>
            {field.options.map((option) => (
              <Radio key={option.id} value={option.value} pointerEvents="none">
                {option.displayText}
              </Radio>
            ))}
          </Stack>
        </RadioGroup>
      );
    case 'file':
      return (
        <Input
          type="file"
          isReadOnly
          bg="white"
          borderRadius="xl"
          borderColor="gray.200"
          borderWidth="1px"
          px={4}
          py={3}
          minH="56px"
          lineHeight="none"
        />
      );
    default:
      return (
        <Input
          placeholder={field.placeholder || field.label}
          isReadOnly
          bg="white"
        />
      );
  }
}

export function SectionCard({
  title,
  actions,
  titleVisible = true,
  compactHeader = false,
  children,
}: {
  title: string;
  actions?: ReactNode;
  titleVisible?: boolean;
  compactHeader?: boolean;
  children: ReactNode;
}) {
  return (
    <Box
      borderWidth="1px"
      borderColor="gray.200"
      bg="white"
      borderRadius="2xl"
      p={4}
      boxShadow="sm"
    >
      <Flex
        align="center"
        justify="space-between"
        gap={compactHeader ? 2 : 3}
        mb={compactHeader ? 2 : 3}
        w="full"
      >
        {titleVisible ? (
          <Text
            fontSize="sm"
            fontWeight="semibold"
            color="gray.900"
            lineHeight={1.2}
            flexShrink={0}
          >
            {title}
          </Text>
        ) : (
          <Box flex="1" />
        )}
        {actions ? (
          <Box flexShrink={0} ml={compactHeader ? 0 : 'auto'}>
            {actions}
          </Box>
        ) : null}
      </Flex>
      {children}
    </Box>
  );
}

export function DragGhost({ item }: { item: ActiveDragItem }) {
  if (!item) {
    return null;
  }

  if (item.kind === 'palette') {
    const IconComponent = getControlIcon(item.control);

    return (
      <Box
        px={4}
        py={3}
        borderRadius="xl"
        bg="white"
        borderWidth="1px"
        borderColor="blue.200"
        boxShadow="xl"
        minW="240px"
      >
        <HStack spacing={3}>
          <Flex
            boxSize={8}
            align="center"
            justify="center"
            borderRadius="md"
            bg="blue.50"
            color="blue.600"
            flexShrink={0}
          >
            <Icon as={IconComponent} boxSize={4} />
          </Flex>
          <Text fontSize="sm" fontWeight="semibold">
            {item.control.name}
          </Text>
        </HStack>
      </Box>
    );
  }

  return (
    <Box
      px={4}
      py={3}
      borderRadius="xl"
      bg="white"
      borderWidth="1px"
      borderColor="blue.200"
      boxShadow="xl"
      minW="240px"
    >
      <Text fontSize="sm" fontWeight="semibold">
        {item.field.label}
      </Text>
    </Box>
  );
}
