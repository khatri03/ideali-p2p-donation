import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Flex,
  Text,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  Icon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  VStack,
  Grid,
  GridItem,
  Badge,
  Skeleton,
  useToast,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
} from '@chakra-ui/react';
import {
  MdSearch,
  MdAdd,
  MdAutoAwesome,
  MdMoreVert,
  MdEdit,
  MdDelete,
} from 'react-icons/md';
import { fetchCustomForms } from '../services/customForms';
import type { CustomFormSummary } from '../types/customForms';
import { CUSTOM_FORM_PATHS, buildCustomFormEditPath } from '../paths';
import Pagination from 'app/components/organizer/donation/organizerDonationComponents/Pagination';
import PermissionGate from 'app/components/common/PermissionGate';
import { hasPermission } from 'app/service/organizer/rolesPermissions/permissionsService';

export function CustomFormsPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [forms, setForms] = useState<CustomFormSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');

  const PAGE_SIZE = 10;
  const [pageNo, setPageNo] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);

  useEffect(() => {
    let mounted = true;

    const loadForms = async () => {
      setIsLoading(true);

      try {
        const result = await fetchCustomForms(pageNo, PAGE_SIZE, appliedSearch);
        if (mounted) {
          setForms(result.pageData);
          setTotalRecords(result.totalRecordsCount);
          setPageCount(result.pageCount);
        }
      } catch (err: any) {
        if (mounted) {
          toast({
            title: 'Failed to load custom forms',
            description: err?.message ?? 'Please try again.',
            status: 'error',
            position: 'top-right',
          });
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadForms();

    return () => {
      mounted = false;
    };
  }, [pageNo, appliedSearch, toast]);

  // ── Debounce search: auto-apply search text after the user stops typing ───
  useEffect(() => {
    if (search === appliedSearch) return;

    const timer = setTimeout(() => {
      setPageNo(1);
      setAppliedSearch(search);
    }, 400);

    return () => clearTimeout(timer);
  }, [search, appliedSearch]);

  const handleCreate = () => navigate(CUSTOM_FORM_PATHS.create);
  const handleEdit = (uniqueId: string) =>
    navigate(buildCustomFormEditPath(uniqueId));
  const canCreate = hasPermission('customform:create');
  const canEdit = hasPermission('customform:edit');
  const canDelete = hasPermission('customform:delete');
  const canShowActions = canEdit || canDelete;

  return (
    <PermissionGate permission="customform:view" showAccessDenied>
    <Box minH="100vh" bg="gray.50" pt={16}>
      <Box
        bgGradient="linear(135deg, #3b4fcf 0%, #5b6ef5 60%, #7c8cf8 100%)"
        px={{ base: 4, md: 8 }}
        pt={{ base: 4, md: 6 }}
        pb={{ base: 5, md: 8 }}
        borderRadius="xl"
        mx={{ base: 2, md: 4 }}
        mt={2}
        boxShadow="0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06)"
        position="relative"
        overflow="hidden"
      >
        <Box
          position="absolute"
          top="-30px"
          right="120px"
          w="180px"
          h="180px"
          borderRadius="full"
          bg="whiteAlpha.100"
        />
        <Box
          position="absolute"
          bottom="-40px"
          right="-20px"
          w="220px"
          h="220px"
          borderRadius="full"
          bg="whiteAlpha.100"
        />

        <Flex
          justify="space-between"
          align={{ base: 'flex-start', md: 'flex-start' }}
          flexDirection={{ base: 'column', md: 'row' }}
          gap={{ base: 4, md: 0 }}
          position="relative"
        >
          <Box>
            <Text
              fontSize="xs"
              fontWeight="semibold"
              color="whiteAlpha.700"
              letterSpacing="widest"
              textTransform="uppercase"
              mb={2}
            >
              Custom Forms
            </Text>
            <Text
              fontSize={{ base: 'xl', md: '2xl' }}
              fontWeight="bold"
              color="white"
              mb={2}
            >
              Reusable form templates
            </Text>
            <Text
              fontSize="sm"
              color="whiteAlpha.800"
              maxW="400px"
              lineHeight="tall"
            >
              Keep organizer forms organized and ready to reuse whenever you
              need a new intake flow.
            </Text>
          </Box>

          {canCreate && (
            <Button
              leftIcon={<Icon as={MdAdd} />}
              bg="white"
              color="blue.600"
              fontWeight="semibold"
              size="md"
              borderRadius="lg"
              boxShadow="md"
              w={{ base: 'full', md: 'auto' }}
              _hover={{
                bg: 'blue.50',
                transform: 'translateY(-1px)',
                boxShadow: 'lg',
              }}
              transition="all 0.2s"
              onClick={handleCreate}
              mt={{ base: 0, md: 1 }}
            >
              Create form
            </Button>
          )}
        </Flex>
      </Box>

      <Box
        mx={{ base: 2, md: 4 }}
        mt={4}
        bg="white"
        borderRadius="xl"
        boxShadow="0 4px 24px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04)"
        overflow="hidden"
      >
        <Flex px={4} py={3} align="center" borderBottomWidth="1px" borderColor="gray.100">
          <InputGroup size="sm">
            <InputLeftElement pointerEvents="none">
              <Icon as={MdSearch} color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Search custom forms..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              borderRadius="lg"
              bg="gray.50"
              borderColor="gray.200"
              _focus={{ borderColor: 'blue.400', bg: 'white' }}
            />
          </InputGroup>
        </Flex>

        {isLoading ? (
          <Box p="4">
            <Skeleton h="56px" mb="3" borderRadius="xl" />
            <Skeleton h="56px" mb="3" borderRadius="xl" />
            <Skeleton h="56px" borderRadius="xl" />
          </Box>
        ) : forms.length === 0 ? (
          appliedSearch.trim() ? (
            <NoResultsState query={appliedSearch} />
          ) : (
            <EmptyState onCreateClick={handleCreate} canCreate={canCreate} />
          )
        ) : (
          <>
            <Box display={{ base: 'none', md: 'block' }}>
              <TableContainer>
                <Table variant="simple" size="md">
                  <Thead bg="gray.200">
                    <Tr>
                      <Th
                        color="gray.800"
                        fontWeight="bold"
                        fontSize="sm"
                        textTransform="uppercase"
                        w="70px"
                      >
                        Actions
                      </Th>
                      <Th
                        color="gray.800"
                        fontWeight="bold"
                        fontSize="sm"
                        textTransform="uppercase"
                      >
                        Form
                      </Th>
                      <Th
                        color="gray.800"
                        fontWeight="bold"
                        fontSize="sm"
                        textTransform="uppercase"
                      >
                        Header text
                      </Th>
                      <Th
                        color="gray.800"
                        fontWeight="bold"
                        fontSize="sm"
                        textTransform="uppercase"
                        textAlign="right"
                      >
                        Fields
                      </Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {forms.map((form, index) => (
                      <Tr
                        key={form.uniqueId}
                        bg={
                          index % 2 === 1
                            ? 'rgba(226, 232, 240, 0.44)'
                            : 'white'
                        }
                      >
                        <Td>
                          {canShowActions && (
                            <Menu>
                              <MenuButton
                                as={IconButton}
                                icon={<Icon as={MdMoreVert} />}
                                variant="ghost"
                                size="sm"
                                borderRadius="full"
                                aria-label={`Actions for ${form.name}`}
                              />
                              <MenuList
                                minW="140px"
                                shadow="lg"
                                borderRadius="lg"
                              >
                                {canEdit && (
                                  <MenuItem
                                    icon={<Icon as={MdEdit} />}
                                    fontSize="sm"
                                    onClick={() => handleEdit(form.uniqueId)}
                                  >
                                    Edit
                                  </MenuItem>
                                )}
                                {canDelete && (
                                  <MenuItem
                                    icon={<Icon as={MdDelete} />}
                                    fontSize="sm"
                                    color="red.500"
                                    isDisabled
                                  >
                                    Delete
                                  </MenuItem>
                                )}
                              </MenuList>
                            </Menu>
                          )}
                        </Td>
                        <Td>
                          <Text
                            fontWeight="semibold"
                            fontSize="sm"
                            color="gray.800"
                            mb={1}
                          >
                            {form.name}
                          </Text>
                          {form.description ? (
                            <Text
                              fontSize="xs"
                              color="gray.500"
                              lineHeight="tall"
                            >
                              {form.description}
                            </Text>
                          ) : null}
                        </Td>
                        <Td>
                          <Text
                            fontSize="sm"
                            color="gray.700"
                            fontWeight="medium"
                          >
                            {form.headerText}
                          </Text>
                        </Td>
                        <Td textAlign="right">
                          <Badge
                            bg="blue.600"
                            color="white"
                            borderRadius="full"
                            fontSize="11px"
                            fontWeight="semibold"
                            px={3}
                            py={1}
                            display="inline-flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            {form.totalFields}
                          </Badge>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            </Box>

            <Box display={{ base: 'block', md: 'none' }}>
              <VStack
                spacing={0}
                divider={<Box h="1px" bg="gray.100" w="full" />}
              >
                {forms.map((form) => (
                  <Box key={form.uniqueId} px={4} py={4} w="full">
                    <Flex justify="space-between" align="flex-start">
                      <Box flex="1" minW={0} mr={2}>
                        <Text
                          fontWeight="semibold"
                          fontSize="sm"
                          color="gray.800"
                          mb={1}
                          noOfLines={1}
                        >
                          {form.name}
                        </Text>
                        {form.description ? (
                          <Text
                            fontSize="xs"
                            color="gray.500"
                            lineHeight="tall"
                            mb={2}
                          >
                            {form.description}
                          </Text>
                        ) : null}
                        <Flex gap={4} flexWrap="wrap">
                          <Box>
                            <Text
                              fontSize="10px"
                              color="gray.400"
                              textTransform="uppercase"
                              fontWeight="bold"
                              mb={0.5}
                            >
                              Header
                            </Text>
                            <Text
                              fontSize="xs"
                              color="gray.700"
                              fontWeight="medium"
                            >
                              {form.headerText}
                            </Text>
                          </Box>
                          <Box>
                            <Text
                              fontSize="10px"
                              color="gray.400"
                              textTransform="uppercase"
                              fontWeight="bold"
                              mb={0.5}
                            >
                              Fields
                            </Text>
                            <Badge
                              bg="blue.600"
                              color="white"
                              borderRadius="full"
                              px={2.5}
                              py={0.5}
                              fontSize="11px"
                              fontWeight="semibold"
                            >
                              {form.totalFields}
                            </Badge>
                          </Box>
                        </Flex>
                      </Box>
                      {canShowActions && (
                        <Menu>
                          <MenuButton
                            as={IconButton}
                            icon={<Icon as={MdMoreVert} />}
                            variant="ghost"
                            size="sm"
                            borderRadius="full"
                            aria-label={`Actions for ${form.name}`}
                            flexShrink={0}
                          />
                          <MenuList minW="140px" shadow="lg" borderRadius="lg">
                            {canEdit && (
                              <MenuItem
                                icon={<Icon as={MdEdit} />}
                                fontSize="sm"
                                onClick={() => handleEdit(form.uniqueId)}
                              >
                                Edit
                              </MenuItem>
                            )}
                            {canDelete && (
                              <MenuItem
                                icon={<Icon as={MdDelete} />}
                                fontSize="sm"
                                color="red.500"
                                isDisabled
                              >
                                Delete
                              </MenuItem>
                            )}
                          </MenuList>
                        </Menu>
                      )}
                    </Flex>
                  </Box>
                ))}
              </VStack>
            </Box>
          </>
        )}

        {!isLoading && totalRecords > 0 && (
          <Pagination
            currentPage={pageNo}
            totalRecords={totalRecords}
            entriesPerPage={PAGE_SIZE}
            onPageChange={setPageNo}
            displayedItemsCount={forms.length}
          />
        )}
      </Box>
    </Box>
    </PermissionGate>
  );
}

function EmptyState({
  onCreateClick,
  canCreate = true,
}: {
  onCreateClick: () => void;
  canCreate?: boolean;
}) {
  return (
    <VStack spacing={6} py={12} px={6} align="center" w="full">
      <Flex
        w="56px"
        h="56px"
        borderRadius="xl"
        bg="blue.50"
        align="center"
        justify="center"
      >
        <Icon as={MdAutoAwesome} boxSize={7} color="blue.400" />
      </Flex>

      <VStack spacing={4} align="center" maxW="500px" textAlign="center">
        <Text
          fontSize="lg"
          fontWeight="bold"
          color="gray.800"
          textAlign="center"
        >
          Create your first custom form
        </Text>
        <Text
          fontSize="sm"
          color="gray.500"
          maxW="500px"
          lineHeight="tall"
          textAlign="center"
          mx="auto"
        >
          Custom forms let you reuse field layouts across membership types.
          Build one once, then edit it whenever the intake flow changes.
        </Text>
      </VStack>

      <Grid
        templateColumns={{ base: '1fr', sm: 'repeat(3, 1fr)' }}
        gap={4}
        maxW="800px"
        w="full"
      >
        {[
          {
            n: 1,
            title: 'Set the basics',
            desc: 'Name the form and add the header text.',
          },
          {
            n: 2,
            title: 'Add fields',
            desc: 'Drag controls into the form builder.',
          },
          {
            n: 3,
            title: 'Reuse it anywhere',
            desc: 'Attach the form to membership questions.',
          },
        ].map(({ n, title, desc }) => (
          <GridItem
            key={n}
            bg="gray.200"
            borderRadius="xl"
            p={4}
            textAlign="left"
            borderWidth="1px"
            borderColor="gray.100"
          >
            <Flex
              w="26px"
              h="26px"
              borderRadius="full"
              bg="blue.500"
              color="white"
              align="center"
              justify="center"
              fontSize="xs"
              fontWeight="bold"
              mb={3}
            >
              {n}
            </Flex>
            <Text fontSize="sm" fontWeight="semibold" color="gray.700" mb={1}>
              {title}
            </Text>
            <Text fontSize="xs" color="gray.500" lineHeight="tall">
              {desc}
            </Text>
          </GridItem>
        ))}
      </Grid>

      {canCreate && (
      <VStack spacing={1}>
        <Button
          leftIcon={<Icon as={MdAdd} />}
          colorScheme="blue"
          size="md"
          borderRadius="lg"
          px={8}
          onClick={onCreateClick}
          _hover={{ transform: 'translateY(-1px)', boxShadow: 'md' }}
          transition="all 0.2s"
        >
          Create your first form
        </Button>
        <Text fontSize="xs" color="gray.400" mt={1}>
          Takes about 2 minutes - you can save and exit at any step.
        </Text>
      </VStack>
      )}
    </VStack>
  );
}

function NoResultsState({ query }: { query: string }) {
  return (
    <VStack spacing={6} py={12} px={6} align="center" w="full">
      <Flex
        w="56px"
        h="56px"
        borderRadius="xl"
        bg="gray.100"
        align="center"
        justify="center"
      >
        <Icon as={MdSearch} boxSize={7} color="gray.400" />
      </Flex>

      <VStack spacing={4} align="center" maxW="500px" textAlign="center">
        <Text
          fontSize="lg"
          fontWeight="bold"
          color="gray.800"
          textAlign="center"
        >
          No custom forms found
        </Text>
        <Text
          fontSize="sm"
          color="gray.500"
          maxW="500px"
          lineHeight="tall"
          textAlign="center"
          mx="auto"
        >
          We couldn't find any forms matching "{query}". Try a different search
          term or clear the filter to see all custom forms.
        </Text>
      </VStack>
    </VStack>
  );
}

export default CustomFormsPage;
