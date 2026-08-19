import React from 'react'; // eslint-disable-line
import {
  Box, Flex, Icon, Input, InputGroup, InputLeftElement, SimpleGrid, Skeleton, Text, useToast,
} from '@chakra-ui/react';
import { MdArrowForward, MdDescription, MdFolder, MdSearch } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import memberDocumentService, { MemberDocumentCategory } from '../services/memberDocumentService';

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export default function MemberDocumentsPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [categories, setCategories] = React.useState<MemberDocumentCategory[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');

  React.useEffect(() => {
    memberDocumentService.getCategories()
      .then(setCategories)
      .catch((err: any) => {
        toast({
          title: 'Failed to load documents',
          description: err?.response?.data?.message ?? err?.message ?? 'Please try again.',
          status: 'error',
          position: 'top-right',
        });
      })
      .finally(() => setIsLoading(false));
  }, [toast]);

  const filtered = categories.filter((category) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return category.name.toLowerCase().includes(term)
      || (category.description ?? '').toLowerCase().includes(term);
  });

  const handleOpenCategory = (category: MemberDocumentCategory) => {
    navigate(`/member/documents/${category.uniqueId}`);
  };

  return (
    <Box minH="100vh" bg="gray.50" pt={16} pb={8}>
      <Box mx={{ base: 2, md: 4 }} mt={4}>
        {/* Header */}
        <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="xl" boxShadow="sm" p={5} mb={4}>
          <Flex align="center" gap={3}>
            <Flex w="44px" h="44px" borderRadius="lg" bg="#044bd9" align="center" justify="center" flexShrink={0}>
              <Icon as={MdFolder} boxSize={5} color="white" />
            </Flex>
            <Box>
              <Text fontSize="11px" fontWeight="700" color="#044bd9" textTransform="uppercase" letterSpacing="wider" mb={0.5}>
                Documents
              </Text>
              <Text fontSize="xl" fontWeight="800" color="gray.900" mb={0.5}>Documents</Text>
              <Text fontSize="sm" color="gray.500">
                Browse categories to view the files your organizer has shared with your membership.
              </Text>
            </Box>
          </Flex>
        </Box>

        {/* Search */}
        <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="xl" boxShadow="sm" p={4} mb={4}>
          <InputGroup size="md">
            <InputLeftElement pointerEvents="none">
              <Icon as={MdSearch} color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Search categories"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              bg="gray.50" borderColor="gray.200" borderRadius="lg"
              _focus={{ borderColor: '#044bd9', boxShadow: '0 0 0 1px #044bd9', bg: 'white' }}
            />
          </InputGroup>
        </Box>

        {/* Cards */}
        {isLoading ? (
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Box key={i} bg="white" border="1px solid" borderColor="gray.200" borderRadius="xl" boxShadow="sm" p={5}>
                <Skeleton h="44px" w="44px" borderRadius="lg" mb={3} />
                <Skeleton h="16px" w="60%" mb={2} />
                <Skeleton h="12px" w="80%" />
              </Box>
            ))}
          </SimpleGrid>
        ) : filtered.length === 0 ? (
          <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="xl" boxShadow="sm" py={14}>
            <Flex direction="column" align="center" gap={2}>
              <Icon as={MdDescription} boxSize={8} color="gray.300" />
              <Text fontSize="sm" fontWeight="semibold" color="gray.600">
                {search.trim() ? 'No categories found' : 'No documents shared yet'}
              </Text>
              <Text fontSize="xs" color="gray.400">
                {search.trim()
                  ? `No categories match "${search}"`
                  : 'Documents your organizer shares will appear here.'}
              </Text>
            </Flex>
          </Box>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            {filtered.map((category) => (
              <Box
                key={category.uniqueId}
                bg="white" border="1px solid" borderColor="gray.200" borderRadius="xl" boxShadow="sm"
                p={5} cursor="pointer"
                onClick={() => handleOpenCategory(category)}
                _hover={{ borderColor: 'blue.200', boxShadow: 'md', transform: 'translateY(-1px)' }}
                transition="all 0.15s"
              >
                <Flex align="center" gap={3} mb={2}>
                  <Flex w="44px" h="44px" borderRadius="lg" bg="#044bd9" align="center" justify="center" flexShrink={0}>
                    <Text color="white" fontSize="sm" fontWeight="800">{getInitials(category.name)}</Text>
                  </Flex>
                  <Box flex="1" minW={0}>
                    <Flex align="center" gap={1.5}>
                      <Text fontSize="md" fontWeight="700" color="gray.900" noOfLines={1}>
                        {category.name}
                      </Text>
                      <Icon as={MdArrowForward} boxSize={3.5} color="blue.400" />
                    </Flex>
                    {category.description && (
                      <Text fontSize="xs" color="gray.500" noOfLines={1}>{category.description}</Text>
                    )}
                  </Box>
                </Flex>
                <Flex align="center" gap={1.5} mt={2}>
                  <Icon as={MdDescription} boxSize={3.5} color="blue.500" />
                  <Text fontSize="xs" color="blue.600" fontWeight="600">
                    {category.documentCount} document{category.documentCount === 1 ? '' : 's'}
                  </Text>
                </Flex>
              </Box>
            ))}
          </SimpleGrid>
        )}
      </Box>
    </Box>
  );
}
