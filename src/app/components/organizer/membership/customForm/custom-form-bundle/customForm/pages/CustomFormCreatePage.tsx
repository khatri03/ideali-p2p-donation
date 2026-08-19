import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import {
  Badge,
  Box,
  Button,
  Checkbox,
  Container,
  Flex,
  Heading,
  HStack,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  Tooltip,
  useToast,
} from '@chakra-ui/react';
import { closestCenter, DndContext, DragOverlay } from '@dnd-kit/core';
import { rectSortingStrategy, SortableContext } from '@dnd-kit/sortable';
import { Link } from 'react-router-dom';
import {
  MdAdd,
  MdChevronLeft,
  MdChevronRight,
  MdDelete,
  MdStar,
} from 'react-icons/md';
import {
  getPreviewColumnSpan,
  normalizeLayoutColumn,
  toggleAcceptedFileType,
} from '../helpers/CustomFormCreatePage.helpers';
import { useCustomFormCreatePage } from '../hooks/useCustomFormCreatePage';
import { CUSTOM_FORM_PATHS } from '../paths';
import {
  PaletteCard,
  FieldCard,
  SectionCard,
  DragGhost,
} from '../components/CustomFormCreatePageCards';
import {
  PreviewModal,
  FieldLayoutModal,
  RemoveFieldModal,
  RemoveOptionModal,
  ClearCanvasModal,
} from '../components/CustomFormCreatePageModals';
import PermissionGate from 'app/components/common/PermissionGate';

export function CustomFormCreatePage() {
  const toast = useToast();
  const [isPaletteExpanded, setIsPaletteExpanded] = useState(true);
  const {
    isLoadingControls,
    controlsError,
    controlSearch,
    setControlSearch,
    draft,
    setDraft,
    fields,
    selectedFieldId,
    selectedFieldValidation,
    selectField,
    activeDragItem,
    isCanvasTargeted,
    isClearConfirmOpen,
    setIsClearConfirmOpen,
    isPreviewOpen,
    fieldLayoutMenu,
    isSavingForm,
    isLoadingForm,
    loadError,
    saveError,
    isEditMode,
    isCompactViewport,
    selectedField,
    selectedControl,
    fieldToRemove,
    optionToRemove,
    selectedOption,
    previewColumnCount,
    controlUsageCounts,
    filteredControls,
    nameError,
    headerTextError,
    layoutColumnError,
    canvasFieldError,
    sensors,
    canvasRestrictModifier,
    setCanvasRef,
    isCanvasOver,
    canvasDropRef,
    inspectorLabelRef,
    handleSaveForm,
    onDragStart,
    onDragMove,
    onDragOver,
    onDragEnd,
    onDragCancel,
    appendFieldToCanvas,
    openPreview,
    closePreview,
    openFieldLayoutMenu,
    closeFieldLayoutMenu,
    setFieldLayoutPreset,
    clearFieldLayoutPreset,
    removeField,
    confirmRemoveField,
    cancelRemoveField,
    addOption,
    selectOption,
    setDefaultOption,
    removeOption,
    confirmRemoveOption,
    cancelRemoveOption,
    clearAllCanvasFields,
    updateSelectedField,
    updateOption,
  } = useCustomFormCreatePage();

  function handleSelectField(fieldId: string) {
    if (!selectField(fieldId)) {
      toast({
        title: 'Finish this field first',
        description:
          'Label and option text cannot be empty before selecting another field.',
        status: 'warning',
        position: 'top-right',
      });
    }
  }

  useEffect(() => {
    if (loadError) {
      toast({
        title: 'Unable to load form',
        description: loadError,
        status: 'error',
        position: 'top-right',
      });
    }
  }, [loadError, toast]);

  useEffect(() => {
    if (saveError) {
      toast({
        title: 'Form save error',
        description: saveError,
        status: 'error',
        position: 'top-right',
      });
    }
  }, [saveError, toast]);

  const statusText = loadError
    ? loadError
    : saveError
      ? saveError
      : 'Ready to save.';

  return (
    <PermissionGate
      permission={isEditMode ? 'customform:edit' : 'customform:create'}
      showAccessDenied
    >
    <Box
      bg="gray.50"
      minH="100vh"
      px={{ base: 2, md: 4 }}
      py={{ base: 4, md: 5 }}
      w="full"
    >
      <Container maxW="full" px={0} w="full">
        <Box
          borderWidth="1px"
          borderColor="gray.200"
          bg="white"
          borderRadius="2xl"
          p={{ base: 4, md: 5 }}
          mb={4}
          mt={10}
          boxShadow="sm"
        >
          <Flex
            direction={{ base: 'column', lg: 'row' }}
            gap={4}
            justify="space-between"
            align="start"
          >
            <Box maxW="3xl">
              <Text
                fontSize="xs"
                fontWeight="bold"
                letterSpacing="widest"
                textTransform="uppercase"
                color="blue.600"
              >
                Custom Forms
              </Text>
              <Heading
                as="h1"
                size={{ base: 'md', md: 'lg' }}
                mt={2}
                color="gray.900"
              >
                {isEditMode ? 'Edit custom form' : 'Build a new custom form'}
              </Heading>
              <Text mt={1} fontSize="sm" color="gray.600">
                Drag field types from the palette, arrange them on the canvas,
                and tune the constraints in the inspector.
              </Text>
            </Box>

            <HStack
              spacing={3}
              flexWrap="wrap"
              justify={{ base: 'stretch', lg: 'flex-end' }}
              w={{ base: 'full', lg: 'auto' }}
            >
              <Button
                as={Link}
                to={CUSTOM_FORM_PATHS.list}
                variant="outline"
                borderColor="gray.200"
                size="sm"
                w={{ base: 'full', sm: 'auto' }}
              >
                Back to forms
              </Button>
              <Button
                onClick={handleSaveForm}
                isLoading={isSavingForm || isLoadingForm}
                loadingText={isEditMode ? 'Saving' : 'Creating'}
                colorScheme="blue"
                size="sm"
                w={{ base: 'full', sm: 'auto' }}
              >
                {isEditMode ? 'Save changes' : 'Create'}
              </Button>
            </HStack>
          </Flex>

          <Text
            mt={3}
            fontSize="sm"
            color={loadError || saveError ? 'red.500' : 'gray.500'}
          >
            {statusText}
          </Text>

          <SimpleGrid mt={5} columns={{ base: 1, md: 2, xl: 4 }} spacing={4}>
            <Box>
              <Text mb={2} fontSize="sm" fontWeight="medium">
                Name{' '}
                <Text as="span" color="red.500">
                  *
                </Text>
              </Text>
              <Input
                value={draft.name}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="Volunteer Intake"
                borderRadius="xl"
                maxLength={50}
              />
              {nameError ? (
                <Text mt={2} fontSize="xs" color="red.500">
                  {nameError}
                </Text>
              ) : null}
            </Box>
            <Box>
              <Text mb={2} fontSize="sm" fontWeight="medium">
                Header Text{' '}
                <Text as="span" color="red.500">
                  *
                </Text>
              </Text>
              <Input
                value={draft.headerText}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    headerText: event.target.value,
                  }))
                }
                placeholder="Show above the form"
                borderRadius="xl"
                maxLength={50}
              />
              {headerTextError ? (
                <Text mt={2} fontSize="xs" color="red.500">
                  {headerTextError}
                </Text>
              ) : null}
            </Box>
            <Box>
              <Text mb={2} fontSize="sm" fontWeight="medium">
                Description
              </Text>
              <Input
                value={draft.description}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                placeholder="Optional context"
                borderRadius="xl"
                maxLength={100}
              />
            </Box>
            <Box>
              <Text mb={2} fontSize="sm" fontWeight="medium">
                Layout Columns
              </Text>
              <Select
                value={draft.layoutColumn}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    layoutColumn: Number(event.target.value),
                  }))
                }
                borderRadius="xl"
              >
                {[1, 2, 3, 4].map((value) => (
                  <option key={value} value={value}>
                    {value} column{value > 1 ? 's' : ''}
                  </option>
                ))}
              </Select>
              {layoutColumnError ? (
                <Text mt={2} fontSize="xs" color="red.500">
                  {layoutColumnError}
                </Text>
              ) : null}
            </Box>
          </SimpleGrid>
        </Box>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={onDragStart}
          onDragMove={onDragMove}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
          onDragCancel={onDragCancel}
        >
          <Box
            display="grid"
            gridTemplateColumns={{
              base: '1fr',
              xl: isPaletteExpanded
                ? '250px minmax(0, 1fr) 260px'
                : '52px minmax(0, 1fr) 260px',
              '2xl': isPaletteExpanded
                ? '300px minmax(0, 1fr) 340px'
                : '52px minmax(0, 1fr) 340px',
            }}
            gap={{ base: 4, xl: 4, '2xl': 6 }}
            alignItems="start"
            w="full"
          >
            <Box
              w="full"
              minW={0}
              position={{ base: 'static', xl: 'sticky' }}
              top={{ xl: 6 }}
              alignSelf="start"
            >
              {isPaletteExpanded ? (
                <SectionCard
                  title="Field palette"
                  compactHeader
                  actions={
                    <Tooltip
                      label="Collapse field palette"
                      hasArrow
                      placement="top"
                    >
                      <IconButton
                        aria-label="Collapse field palette"
                        onClick={() => setIsPaletteExpanded(false)}
                        icon={<Icon as={MdChevronLeft} boxSize={4} />}
                        variant="ghost"
                        colorScheme="gray"
                        w="auto"
                        h="auto"
                        minW="auto"
                        p={0}
                        m={0}
                        borderRadius="full"
                        lineHeight={1}
                        _hover={{ bg: 'transparent' }}
                        _active={{ bg: 'transparent' }}
                      />
                    </Tooltip>
                  }
                >
                  <Text
                    fontSize="xs"
                    fontWeight="bold"
                    letterSpacing="widest"
                    textTransform="uppercase"
                    color="gray.500"
                    mb={2}
                  >
                    Search field types
                  </Text>
                  <InputGroup mb={3}>
                    <InputLeftElement pointerEvents="none">
                      <Text as="span" color="gray.400" fontWeight="medium">
                        /
                      </Text>
                    </InputLeftElement>
                    <Input
                      value={controlSearch}
                      onChange={(event) => setControlSearch(event.target.value)}
                      placeholder="Search by name or type"
                      borderRadius="xl"
                      size="sm"
                    />
                  </InputGroup>

                  <Stack
                    spacing={3}
                    maxH={{ base: 'auto', lg: '70vh' }}
                    overflowY="auto"
                    pr={1}
                  >
                    {isLoadingControls ? (
                      <Text fontSize="sm" color="gray.500">
                        Loading controls...
                      </Text>
                    ) : controlsError ? (
                      <Text fontSize="sm" color="red.500">
                        {controlsError}
                      </Text>
                    ) : filteredControls.length > 0 ? (
                      filteredControls.map((control) => (
                        <PaletteCard
                          key={control.id}
                          control={control}
                          count={controlUsageCounts.get(control.id) ?? 0}
                          onDoubleClick={appendFieldToCanvas}
                        />
                      ))
                    ) : (
                      <Text fontSize="sm" color="gray.500">
                        No controls match your search.
                      </Text>
                    )}
                  </Stack>
                </SectionCard>
              ) : (
                <Box
                  w="full"
                  minW={0}
                  position={{ base: 'static', xl: 'sticky' }}
                  top={{ xl: 6 }}
                  alignSelf="start"
                  display="flex"
                  alignItems="flex-start"
                  justifyContent="flex-end"
                >
                  <Tooltip
                    label="Expand field palette"
                    hasArrow
                    placement="top"
                  >
                    <IconButton
                      aria-label="Expand field palette"
                      onClick={() => setIsPaletteExpanded(true)}
                      icon={<Icon as={MdChevronRight} boxSize={4} />}
                      variant="solid"
                      colorScheme="gray"
                      bg="white"
                      color="gray.700"
                      borderWidth="1px"
                      borderColor="gray.200"
                      w={8}
                      h={8}
                      minW={8}
                      p={0}
                      m={0}
                      borderRadius="full"
                      lineHeight={1}
                      boxShadow="sm"
                      _hover={{ bg: 'white', boxShadow: 'md' }}
                      _active={{ bg: 'gray.50' }}
                    />
                  </Tooltip>
                </Box>
              )}
            </Box>

            <Box w="full" minW={0}>
              <SectionCard title="Form canvas">
                <Flex
                  mb={3}
                  gap={2}
                  wrap="wrap"
                  align="center"
                  justify="space-between"
                >
                  <HStack spacing={2}>
                    <Badge
                      colorScheme="blue"
                      borderRadius="full"
                      px={2}
                      py={0.5}
                      fontSize="10px"
                    >
                      {fields.length} field{fields.length === 1 ? '' : 's'}
                    </Badge>
                    <Badge
                      colorScheme={
                        isCanvasOver || isCanvasTargeted ? 'blue' : 'gray'
                      }
                      borderRadius="full"
                      px={2}
                      py={0.5}
                      fontSize="10px"
                    >
                      {isCanvasOver || isCanvasTargeted
                        ? 'Drop here'
                        : 'Canvas ready'}
                    </Badge>
                  </HStack>
                  <Stack
                    direction={{ base: 'column', sm: 'row' }}
                    spacing={2}
                    w={{ base: 'full', sm: 'auto' }}
                  >
                    <Button
                      size="sm"
                      variant="outline"
                      colorScheme="blue"
                      onClick={openPreview}
                      isDisabled={fields.length === 0}
                      w={{ base: 'full', sm: 'auto' }}
                    >
                      Preview
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      colorScheme="red"
                      onClick={() => setIsClearConfirmOpen(true)}
                      isDisabled={fields.length === 0}
                      w={{ base: 'full', sm: 'auto' }}
                    >
                      Clear all
                    </Button>
                  </Stack>
                </Flex>

                <Box
                  ref={(node) => {
                    setCanvasRef(node);
                    canvasDropRef.current = node;
                  }}
                  minH={{ base: '18rem', md: '24rem', lg: '30rem' }}
                  p={{ base: 3, md: 4 }}
                  borderWidth="1px"
                  borderStyle="dashed"
                  borderColor={
                    isCanvasOver || isCanvasTargeted ? 'blue.400' : 'gray.200'
                  }
                  bg={isCanvasOver || isCanvasTargeted ? 'blue.50' : 'gray.50'}
                  borderRadius="2xl"
                  overflowX={{ base: 'auto', md: 'hidden' }}
                  overflowY="hidden"
                >
                  {canvasFieldError ? (
                    <Box
                      mb={3}
                      p={3}
                      borderRadius="lg"
                      bg="red.50"
                      color="red.700"
                    >
                      <Text fontSize="sm">{canvasFieldError}</Text>
                    </Box>
                  ) : null}

                  <SortableContext
                    items={fields.map((field) => field.id)}
                    strategy={rectSortingStrategy}
                  >
                    {isCompactViewport ? (
                      <Flex
                        gap={3}
                        wrap="nowrap"
                        align="stretch"
                        minW="max-content"
                        pb={fields.length > 0 ? 2 : 0}
                      >
                        {fields.length > 0 ? (
                          fields.map((field) => (
                            <Box
                              key={field.id}
                              flex="0 0 auto"
                              w="18rem"
                              minW="18rem"
                            >
                              <FieldCard
                                field={field}
                                selected={field.id === selectedFieldId}
                                span={getPreviewColumnSpan(
                                  field,
                                  previewColumnCount,
                                )}
                                layoutColumn={normalizeLayoutColumn(
                                  field.layoutColumn ?? previewColumnCount,
                                )}
                                showDragHandle={fields.length > 1}
                                onSelect={handleSelectField}
                                onOpenLayoutMenu={openFieldLayoutMenu}
                                onClearLayout={clearFieldLayoutPreset}
                                onRemove={removeField}
                              />
                            </Box>
                          ))
                        ) : (
                          <Box
                            w="full"
                            minW="18rem"
                            minH={{ base: '12rem', sm: '20rem' }}
                            px={{ base: 4, sm: 6 }}
                            py={{ base: 8, sm: 10 }}
                            textAlign="center"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            bg="white"
                            borderRadius="2xl"
                            borderWidth="1px"
                            borderColor="gray.200"
                          >
                            <Box w="full" maxW="md">
                              <Text
                                fontSize={{ base: 'sm', sm: 'md' }}
                                fontWeight="semibold"
                                color="gray.800"
                              >
                                Drop your first field here
                              </Text>
                              <Text
                                mt={2}
                                fontSize={{ base: 'xs', sm: 'sm' }}
                                color="gray.500"
                              >
                                Double-click a control from the left palette to
                                add it to the form.
                              </Text>
                            </Box>
                          </Box>
                        )}
                      </Flex>
                    ) : (
                      <SimpleGrid columns={{ base: 1, sm: 12 }} spacing={3}>
                        {fields.length > 0 ? (
                          fields.map((field) => (
                            <FieldCard
                              key={field.id}
                              field={field}
                              selected={field.id === selectedFieldId}
                              span={getPreviewColumnSpan(
                                field,
                                previewColumnCount,
                              )}
                              layoutColumn={normalizeLayoutColumn(
                                field.layoutColumn ?? previewColumnCount,
                              )}
                              showDragHandle={fields.length > 1}
                              onSelect={handleSelectField}
                              onOpenLayoutMenu={openFieldLayoutMenu}
                              onClearLayout={clearFieldLayoutPreset}
                              onRemove={removeField}
                            />
                          ))
                        ) : (
                          <Box
                            gridColumn="1 / -1"
                            w="full"
                            minH={{ base: '12rem', sm: '20rem' }}
                            px={{ base: 4, sm: 6 }}
                            py={{ base: 8, sm: 10 }}
                            textAlign="center"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            bg="white"
                            borderRadius="2xl"
                            borderWidth="1px"
                            borderColor="gray.200"
                          >
                            <Box w="full" maxW="md">
                              <Text
                                fontSize={{ base: 'sm', sm: 'md' }}
                                fontWeight="semibold"
                                color="gray.800"
                              >
                                Drop your first field here
                              </Text>
                              <Text
                                mt={2}
                                fontSize={{ base: 'xs', sm: 'sm' }}
                                color="gray.500"
                              >
                                Double-click a control from the left palette to
                                add it to the form.
                              </Text>
                            </Box>
                          </Box>
                        )}
                      </SimpleGrid>
                    )}
                  </SortableContext>
                </Box>
              </SectionCard>
            </Box>

            <Box
              w="full"
              minW={0}
              position={{ base: 'static', xl: 'sticky' }}
              top={{ xl: 6 }}
              alignSelf="start"
            >
              <SectionCard title="Field inspector">
                {selectedField ? (
                  <Stack spacing={3}>
                    <Box>
                      <Text mb={2} fontSize="sm" fontWeight="medium">
                        Label
                      </Text>
                      <Input
                        ref={inspectorLabelRef}
                        value={selectedField.label}
                        onChange={(event) =>
                          updateSelectedField((field) => ({
                            ...field,
                            label: event.target.value,
                          }))
                        }
                        borderRadius="xl"
                        borderColor={
                          selectedFieldValidation?.labelError
                            ? 'red.300'
                            : undefined
                        }
                      />
                      {selectedFieldValidation?.labelError ? (
                        <Text mt={2} fontSize="xs" color="red.500">
                          {selectedFieldValidation.labelError}
                        </Text>
                      ) : null}
                    </Box>

                    {selectedControl?.canHavePlaceHolder ? (
                      <Box>
                        <Text mb={2} fontSize="sm" fontWeight="medium">
                          Placeholder
                        </Text>
                        <Input
                          value={selectedField.placeholder}
                          onChange={(event) =>
                            updateSelectedField((field) => ({
                              ...field,
                              placeholder: event.target.value,
                            }))
                          }
                          borderRadius="xl"
                        />
                      </Box>
                    ) : null}

                    <Box>
                      <Text mb={2} fontSize="sm" fontWeight="medium">
                        Tooltip
                      </Text>
                      <Input
                        value={selectedField.tooltip}
                        onChange={(event) =>
                          updateSelectedField((field) => ({
                            ...field,
                            tooltip: event.target.value,
                          }))
                        }
                        placeholder="Optional helper text"
                        borderRadius="xl"
                      />
                    </Box>

                    {selectedControl?.canBeRequired ? (
                      <HStack
                        justify="space-between"
                        p={3}
                        borderWidth="1px"
                        borderColor="gray.200"
                        borderRadius="xl"
                      >
                        <Text fontSize="sm" fontWeight="medium">
                          Required
                        </Text>
                        <Switch
                          isChecked={selectedField.required}
                          onChange={(event) =>
                            updateSelectedField((field) => ({
                              ...field,
                              required: event.target.checked,
                            }))
                          }
                          colorScheme="blue"
                        />
                      </HStack>
                    ) : null}

                    {selectedControl?.canHaveMinLength ? (
                      <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
                        <Box>
                          <Text mb={2} fontSize="sm" fontWeight="medium">
                            Min length
                          </Text>
                          <Input
                            type="number"
                            value={selectedField.minLength}
                            onChange={(event) =>
                              updateSelectedField((field) => ({
                                ...field,
                                minLength: event.target.value,
                              }))
                            }
                            borderRadius="xl"
                          />
                        </Box>
                        <Box>
                          <Text mb={2} fontSize="sm" fontWeight="medium">
                            Max length
                          </Text>
                          <Input
                            type="number"
                            value={selectedField.maxLength}
                            onChange={(event) =>
                              updateSelectedField((field) => ({
                                ...field,
                                maxLength: event.target.value,
                              }))
                            }
                            borderRadius="xl"
                          />
                        </Box>
                      </SimpleGrid>
                    ) : null}

                    {selectedControl?.hasOptions ? (
                      <Box>
                        <HStack justify="space-between" mb={3}>
                          <Text fontSize="sm" fontWeight="medium">
                            Options
                          </Text>
                          <Button
                            size="xs"
                            colorScheme="blue"
                            onClick={addOption}
                          >
                            <Icon as={MdAdd} mr={1} />
                            Add
                          </Button>
                        </HStack>
                        <Stack spacing={2}>
                          {selectedField.options.map((option, index) => {
                            const optionError =
                              selectedFieldValidation?.optionErrors[
                                option.id
                              ];

                            return (
                              <Stack
                                key={option.id}
                                spacing={2}
                                p={3}
                                borderWidth="1px"
                                borderColor={
                                  optionError
                                    ? 'red.300'
                                    : selectedOption?.id === option.id
                                      ? 'blue.300'
                                      : 'gray.200'
                                }
                                borderRadius="lg"
                                bg="gray.50"
                              >
                                <HStack spacing={2}>
                                  <Badge colorScheme="gray">{index + 1}</Badge>
                                  <Input
                                    size="sm"
                                    value={option.displayText}
                                    onChange={(event) =>
                                      updateOption(
                                        option.id,
                                        'displayText',
                                        event.target.value,
                                      )
                                    }
                                    borderRadius="lg"
                                    borderColor={
                                      optionError?.displayTextError
                                        ? 'red.300'
                                        : undefined
                                    }
                                  />
                                </HStack>
                                {optionError?.displayTextError ? (
                                  <Text fontSize="xs" color="red.500">
                                    {optionError.displayTextError}
                                  </Text>
                                ) : null}
                                <HStack spacing={2}>
                                  <Input
                                    size="sm"
                                    value={option.value}
                                    onChange={(event) =>
                                      updateOption(
                                        option.id,
                                        'value',
                                        event.target.value,
                                      )
                                    }
                                    borderRadius="lg"
                                    borderColor={
                                      optionError?.valueError
                                        ? 'red.300'
                                        : undefined
                                    }
                                  />
                                  <Tooltip
                                    label={option.isDefault ? 'Default option' : 'Make default'}
                                    openDelay={200}
                                  >
                                    <IconButton
                                      aria-label="Default option"
                                      icon={<Icon as={MdStar} />}
                                      size="sm"
                                      variant={option.isDefault ? 'solid' : 'ghost'}
                                      colorScheme="yellow"
                                      onClick={() => setDefaultOption(option.id)}
                                    />
                                  </Tooltip>
                                  <IconButton
                                    aria-label="Remove option"
                                    icon={<Icon as={MdDelete} />}
                                    size="sm"
                                    variant="ghost"
                                    colorScheme="red"
                                    onClick={() => removeOption(option.id)}
                                  />
                                </HStack>
                                {optionError?.valueError ? (
                                  <Text fontSize="xs" color="red.500">
                                    {optionError.valueError}
                                  </Text>
                                ) : null}
                              </Stack>
                            );
                          })}
                        </Stack>
                      </Box>
                    ) : null}

                    {selectedControl?.acceptedFileTypes?.length ? (
                      <Box>
                        <Text mb={2} fontSize="sm" fontWeight="medium">
                          Accepted file types
                        </Text>
                        <Stack spacing={2}>
                          {selectedControl.acceptedFileTypes.map((item) => (
                            <Checkbox
                              key={item.value}
                              isChecked={selectedField.acceptedFileTypes.includes(
                                item.value,
                              )}
                              onChange={(
                                event: ChangeEvent<HTMLInputElement>,
                              ) =>
                                updateSelectedField((field) => ({
                                  ...field,
                                  acceptedFileTypes: toggleAcceptedFileType(
                                    field.acceptedFileTypes,
                                    item.value,
                                    event.target.checked,
                                  ),
                                }))
                              }
                            >
                              {item.text}
                            </Checkbox>
                          ))}
                        </Stack>
                      </Box>
                    ) : null}
                  </Stack>
                ) : (
                  <Box
                    p={4}
                    borderWidth="1px"
                    borderStyle="dashed"
                    borderColor="gray.200"
                    borderRadius="xl"
                    bg="gray.50"
                  >
                    <Text fontSize="sm" color="gray.500">
                      Select a field on the canvas to edit its label,
                      placeholder, options, and validation settings.
                    </Text>
                  </Box>
                )}
              </SectionCard>
            </Box>
          </Box>

          <DragOverlay
            dropAnimation={null}
            modifiers={[canvasRestrictModifier]}
          >
            {activeDragItem ? <DragGhost item={activeDragItem} /> : null}
          </DragOverlay>
        </DndContext>
      </Container>

      <PreviewModal
        isOpen={isPreviewOpen}
        onClose={closePreview}
        draftHeaderText={draft.headerText}
        fields={fields}
        previewColumnCount={previewColumnCount}
      />
      <FieldLayoutModal
        isOpen={Boolean(fieldLayoutMenu)}
        onClose={closeFieldLayoutMenu}
        fieldId={fieldLayoutMenu?.fieldId ?? null}
        fields={fields}
        previewColumnCount={previewColumnCount}
        onSelectPreset={setFieldLayoutPreset}
        onClearOverride={clearFieldLayoutPreset}
      />
      <RemoveFieldModal
        isOpen={Boolean(fieldToRemove)}
        onClose={cancelRemoveField}
        fieldLabel={fieldToRemove?.label ?? null}
        onConfirm={confirmRemoveField}
      />
      <RemoveOptionModal
        isOpen={Boolean(optionToRemove)}
        onClose={cancelRemoveOption}
        optionLabel={optionToRemove?.displayText ?? null}
        onConfirm={confirmRemoveOption}
      />
      <ClearCanvasModal
        isOpen={isClearConfirmOpen}
        onClose={() => setIsClearConfirmOpen(false)}
        onConfirm={clearAllCanvasFields}
      />
    </Box>
    </PermissionGate>
  );
}

export default CustomFormCreatePage;
