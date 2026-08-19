import React from 'react';
import {
  Box, Badge, Flex, Icon, IconButton, Text,
} from '@chakra-ui/react';
import {
  MdAdd, MdKeyboardArrowDown, MdEdit, MdDelete, MdDragIndicator, MdVisibility,
} from 'react-icons/md';
import FormPreviewModal from './FormPreviewModal';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useStep08, CustomQuestion } from './useStep08';
import AddQuestionModal from './AddQuestionModal';
import StepNavButtons from '../../shared/StepNavButtons';
import Loader from 'app/components/common/Loader';

interface Step08Props {
  membershipId: string | null;
  isEditMode?: boolean;
  onComplete: () => void;
  onPrev?: () => void;
  onSkip?: () => void;
  onSaveAndExit?: () => void;
  isSavingAndExiting?: boolean;
}

// ─── Sortable question card ───────────────────────────────────────────────────

function SortableQuestionCard({
  question,
  onEdit,
  onRemove,
}: {
  question: CustomQuestion;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      bg="white"
      border="1px solid"
      borderColor="blue.100"
      borderRadius="xl"
      px={4}
      py={3}
    >
      <Flex align="center" gap={3}>
        {/* Drag handle */}
        <Icon
          as={MdDragIndicator}
          color="gray.300"
          boxSize={5}
          cursor="grab"
          flexShrink={0}
          {...attributes}
          {...listeners}
        />

        {/* Content */}
        <Box flex={1} minW={0}>
          <Text fontSize="sm" fontWeight="bold" color="gray.800" mb={0.5}>
            {question.label}
          </Text>
          <Text fontSize="xs" color="gray.500" mb={1.5}>
            {question.controlName}
          </Text>
          <Flex gap={1.5} flexWrap="wrap">
            <Badge
              variant="outline"
              borderColor="gray.300"
              color="gray.500"
              borderRadius="full"
              fontSize="9px"
              px={2.5}
              py={2}
              fontWeight="medium"
            >
              {question.required ? 'Required' : 'Optional'}
            </Badge>
            {question.options.length > 0 && (
              <Badge
                bg="blue.50"
                color="blue.600"
                borderRadius="full"
                fontSize="9px"
                px={2.5}
                py={2}
                border="1px solid"
                borderColor="blue.200"
                fontWeight="medium"
              >
                {question.options.length} {question.options.length === 1 ? 'option' : 'options'}
              </Badge>
            )}
          </Flex>
        </Box>

        {/* Actions */}
        <Flex gap={1.5} flexShrink={0}>
          <IconButton
            aria-label="Edit question"
            icon={<Icon as={MdEdit} boxSize={3.5} />}
            size="sm"
            variant="outline"
            borderRadius="full"
            borderColor="blue.200"
            color="blue.400"
            _hover={{ bg: 'blue.50', borderColor: 'blue.400' }}
            onClick={onEdit}
          />
          <IconButton
            aria-label="Delete question"
            icon={<Icon as={MdDelete} boxSize={3.5} />}
            size="sm"
            variant="outline"
            borderRadius="full"
            borderColor="red.200"
            color="red.400"
            _hover={{ bg: 'red.50', borderColor: 'red.400' }}
            onClick={onRemove}
          />
        </Flex>
      </Flex>
    </Box>
  );
}

// ─── Sortable form card ───────────────────────────────────────────────────────

function SortableFormCard({
  form,
  onPreview,
  onRemove,
}: {
  form: { id: number; name: string; uniqueId?: string };
  onPreview: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: form.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      bg="white"
      border="1px solid"
      borderColor="teal.100"
      borderRadius="xl"
      px={4}
      py={3}
    >
      <Flex align="center" gap={3}>
        {/* Drag handle */}
        <Icon
          as={MdDragIndicator}
          color="gray.300"
          boxSize={5}
          cursor="grab"
          flexShrink={0}
          {...attributes}
          {...listeners}
        />

        <Box flex={1} minW={0}>
          <Text fontSize="sm" fontWeight="semibold" color="gray.800" noOfLines={1}>
            {form.name}
          </Text>
        </Box>

        <Flex gap={1.5} flexShrink={0} align="center">
          <IconButton
            aria-label="Preview form"
            icon={<Icon as={MdVisibility} boxSize={3.5} />}
            size="sm"
            variant="outline"
            borderRadius="full"
            borderColor="teal.200"
            color="teal.500"
            _hover={{ bg: 'teal.50', borderColor: 'teal.400' }}
            onClick={(event) => {
              event.stopPropagation();
              onPreview();
            }}
          />
          <IconButton
            aria-label="Remove form"
            icon={<Icon as={MdDelete} boxSize={3.5} />}
            size="sm"
            variant="outline"
            borderRadius="full"
            borderColor="red.200"
            color="red.400"
            _hover={{ bg: 'red.50', borderColor: 'red.400' }}
            onClick={(event) => {
              event.stopPropagation();
              onRemove();
            }}
          />
        </Flex>
      </Flex>
    </Box>
  );
}

// ─── Main step ────────────────────────────────────────────────────────────────

export default function Step08Questions({
  membershipId,
  isEditMode,
  onComplete,
  onPrev,
  onSkip,
  onSaveAndExit,
  isSavingAndExiting,
}: Step08Props) {
  const {
    availableForms,
    selectedForms, setSelectedForms, toggleForm, removeForm,
    customQuestions, setCustomQuestions,
    addQuestion, updateQuestion, removeQuestion,
    isLoading, isSubmitting, saveData, submit,
  } = useStep08({ membershipId, isEditMode, onComplete });

  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const [questionModalOpen, setQuestionModalOpen] = React.useState(false);
  const [editingQuestion, setEditingQuestion] = React.useState<CustomQuestion | null>(null);
  const [previewFormId, setPreviewFormId] = React.useState<string | null>(null);

  const openAdd = () => { setEditingQuestion(null); setQuestionModalOpen(true); };
  const openEdit = (q: CustomQuestion) => { setEditingQuestion(q); setQuestionModalOpen(true); };
  const closeModal = () => { setQuestionModalOpen(false); setEditingQuestion(null); };

  const handleSaveAndExit = async () => {
    try { await saveData(); } catch { /* navigate anyway */ }
    onSaveAndExit?.();
  };

  // DnD — shared sensors
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleFormDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = selectedForms.findIndex((f) => f.id === active.id);
      const newIndex = selectedForms.findIndex((f) => f.id === over.id);
      setSelectedForms(arrayMove(selectedForms, oldIndex, newIndex));
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = customQuestions.findIndex((q) => q.id === active.id);
      const newIndex = customQuestions.findIndex((q) => q.id === over.id);
      setCustomQuestions(arrayMove(customQuestions, oldIndex, newIndex));
    }
  };

  return (
    <Box
      bg="white"
      borderRadius="2xl"
      border="1px solid"
      borderColor="gray.200"
      boxShadow="0 4px 24px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04)"
      overflow="hidden"
    >
      <Box px={{ base: 3, md: 6 }} pt={6} pb={5}>
        {isLoading ? (
          <Loader message="Loading Questions" subtitle="Fetching saved questions..." />
        ) : (<>
        {/* Header */}
        <Text fontSize="xl" fontWeight="bold" color="gray.900" mb={1}>Questions</Text>
        <Text fontSize="sm" color="gray.400" mb={1}>
          Choose an optional custom form to attach to this membership type.
        </Text>
        <Text fontSize="sm" color="gray.400" mb={5}>
          You can skip this step if no questions are needed yet.
        </Text>

        {/* Custom Forms dropdown */}
        <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={2}>Custom Forms</Text>
        <Box position="relative" mb={5}>
          <Flex
            border="1px solid"
            borderColor={dropdownOpen ? '#044bd9' : 'gray.200'}
            borderRadius="lg"
            px={3}
            py={2}
            bg="gray.50"
            minH="42px"
            align="center"
            cursor="pointer"
            justify="space-between"
            onClick={() => setDropdownOpen((v) => !v)}
            _hover={{ borderColor: 'gray.300' }}
          >
            <Text fontSize="sm" color={selectedForms.length === 0 ? 'gray.400' : 'gray.700'}>
              {selectedForms.length === 0
                ? 'Select custom forms'
                : `${selectedForms.length} custom form${selectedForms.length > 1 ? 's' : ''} selected`}
            </Text>
            <Icon as={MdKeyboardArrowDown} color="gray.400" boxSize={5} ml={2} flexShrink={0} />
          </Flex>

          {dropdownOpen && (
            <Box
              position="absolute"
              top="calc(100% + 4px)"
              left={0}
              right={0}
              zIndex={10}
              bg="white"
              border="1px solid"
              borderColor="gray.200"
              borderRadius="xl"
              boxShadow="lg"
              overflow="hidden"
            >
              {availableForms.length === 0 ? (
                <Flex px={4} py={3} align="center" justify="center">
                  <Text fontSize="sm" color="gray.400">Nothing to show</Text>
                </Flex>
              ) : availableForms.map((form) => {
                const isSelected = !!selectedForms.find((f) => f.id === form.id);
                return (
                  <Flex
                    key={form.id}
                    px={4}
                    py={2.5}
                    align="center"
                    cursor="pointer"
                    bg={isSelected ? 'blue.50' : 'white'}
                    _hover={{ bg: isSelected ? 'blue.100' : 'gray.50' }}
                    onClick={() => {
                      toggleForm(form);
                      setDropdownOpen(false);
                    }}
                  >
                    <Text fontSize="sm" color={isSelected ? 'blue.600' : 'gray.700'}
                      fontWeight={isSelected ? 'medium' : 'normal'}>
                      {form.name}
                    </Text>
                  </Flex>
                );
              })}
            </Box>
          )}
        </Box>

        {/* Selected custom forms panel */}
        {selectedForms.length > 0 && (
          <Box
            bgGradient="linear(to-r, teal.50, cyan.50)"
            border="1.5px solid"
            borderColor="teal.100"
            borderRadius="2xl"
            px={4}
            pt={4}
            pb={4}
            mb={4}
          >
            <Flex justify="space-between" align="center" mb={3}>
              <Box>
                <Text fontSize="sm" fontWeight="bold" color="teal.700">Selected custom forms</Text>
                <Text fontSize="xs" color="gray.500" mt={0.5}>
                  Drag the cards to change their order.
                </Text>
              </Box>
              <Flex
                w="28px"
                h="28px"
                borderRadius="full"
                bg="white"
                border="1.5px solid"
                borderColor="teal.200"
                align="center"
                justify="center"
              >
                <Text fontSize="xs" fontWeight="bold" color="teal.600">
                  {selectedForms.length}
                </Text>
              </Flex>
            </Flex>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleFormDragEnd}>
              <SortableContext items={selectedForms.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                <Flex direction="column" gap={2}>
                  {selectedForms.map((form) => (
                    <SortableFormCard
                      key={form.id}
                      form={form}
                      onPreview={() => setPreviewFormId(form.uniqueId ?? null)}
                      onRemove={() => removeForm(form.id)}
                    />
                  ))}
                </Flex>
              </SortableContext>
            </DndContext>
          </Box>
        )}

        {/* Custom Questions card */}
        <Box
          bgGradient="linear(to-r, teal.50, cyan.50)"
          border="1.5px solid"
          borderColor="teal.100"
          borderRadius="2xl"
          px={4}
          pt={4}
          pb={customQuestions.length > 0 ? 4 : 4}
        >
          {/* Card header */}
          <Flex justify="space-between" align="center" mb={customQuestions.length > 0 ? 4 : 0}>
            <Box>
              <Text fontSize="sm" fontWeight="bold" color="blue.700">Custom Questions</Text>
              <Text fontSize="xs" color="gray.500" mt={0.5}>
                Add standalone questions directly on the membership type.
              </Text>
            </Box>
            <Flex align="center" gap={2}>
              <IconButton
                aria-label="Add question"
                icon={<Icon as={MdAdd} boxSize={4} />}
                size="sm"
                borderRadius="full"
                bg="white"
                border="1.5px solid"
                borderColor="blue.200"
                color="blue.600"
                _hover={{ bg: 'blue.100', borderColor: 'blue.400' }}
                onClick={openAdd}
              />
              {customQuestions.length > 0 && (
                <Flex
                  w="28px"
                  h="28px"
                  borderRadius="full"
                  bg="white"
                  border="1.5px solid"
                  borderColor="blue.200"
                  align="center"
                  justify="center"
                >
                  <Text fontSize="xs" fontWeight="bold" color="blue.600">
                    {customQuestions.length}
                  </Text>
                </Flex>
              )}
            </Flex>
          </Flex>

          {/* Sortable question list */}
          {customQuestions.length > 0 && (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext
                items={customQuestions.map((q) => q.id)}
                strategy={verticalListSortingStrategy}
              >
                <Flex direction="column" gap={2}>
                  {customQuestions.map((q) => (
                    <SortableQuestionCard
                      key={q.id}
                      question={q}
                      onEdit={() => openEdit(q)}
                      onRemove={() => removeQuestion(q.id)}
                    />
                  ))}
                </Flex>
              </SortableContext>
            </DndContext>
          )}
        </Box>
        </>)}
      </Box>

      <StepNavButtons
        onNext={submit}
        onPrev={onPrev}
        onSkip={onSkip}
        showSkip
        onSaveAndExit={onSaveAndExit ? handleSaveAndExit : undefined}
        isSavingAndExiting={isSavingAndExiting}
        isSubmitting={isSubmitting}
      />

      <FormPreviewModal
        isOpen={!!previewFormId}
        onClose={() => setPreviewFormId(null)}
        formUniqueId={previewFormId}
      />

      <AddQuestionModal
        isOpen={questionModalOpen}
        onClose={closeModal}
        initialData={editingQuestion}
        onSave={(q) => {
          if (editingQuestion) {
            updateQuestion(editingQuestion.id, q);
          } else {
            addQuestion(q);
          }
          closeModal();
        }}
      />
    </Box>
  );
}
