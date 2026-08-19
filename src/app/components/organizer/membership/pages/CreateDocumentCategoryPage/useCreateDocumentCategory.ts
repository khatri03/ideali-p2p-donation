import { useCallback, useEffect, useMemo, useState } from 'react';
import { useToast } from '@chakra-ui/react';
import { useNavigate, useParams } from 'react-router-dom';
import documentCategoryService, {
  DocumentCategoryDocument,
  DocumentCategoryMembershipTypeOption,
} from '../../services/documentCategoryService';

export const MAX_FILES = 5;
export const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export function useCreateDocumentCategory() {
  const toast = useToast();
  const navigate = useNavigate();
  const { documentCategoryId } = useParams<{ documentCategoryId?: string }>();
  const isEditMode = !!documentCategoryId;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const [membershipTypes, setMembershipTypes] = useState<DocumentCategoryMembershipTypeOption[]>([]);
  const [membershipTypesLoading, setMembershipTypesLoading] = useState(true);
  const [selectedMembershipTypeIds, setSelectedMembershipTypeIds] = useState<string[]>([]);

  const [existingDocuments, setExistingDocuments] = useState<DocumentCategoryDocument[]>([]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    documentCategoryService.getMembershipTypeOptions()
      .then((res) => setMembershipTypes(res.data?.data ?? []))
      .catch((err: any) => {
        toast({
          title: 'Failed to load membership types',
          description: err?.message ?? 'Please try again.',
          status: 'error',
          position: 'top-right',
        });
      })
      .finally(() => setMembershipTypesLoading(false));
  }, [toast]);

  useEffect(() => {
    if (!documentCategoryId) return;

    setIsDetailLoading(true);
    documentCategoryService.getById(documentCategoryId)
      .then((res) => {
        const detail = res.data?.data;
        if (!detail) return;

        setName(detail.name ?? '');
        setDescription(detail.description ?? '');
        setSelectedMembershipTypeIds(detail.membershipTypeUniqueIds ?? []);
        setExistingDocuments(detail.documents ?? []);
      })
      .catch((err: any) => {
        toast({
          title: 'Failed to load document category',
          description: err?.response?.data?.message ?? err?.message ?? 'Please try again.',
          status: 'error',
          position: 'top-right',
        });
      })
      .finally(() => setIsDetailLoading(false));
  }, [documentCategoryId, toast]);

  const membershipTypeOptions = useMemo(() => membershipTypes.map((type) => ({
    value: type.uniqueId,
    text: `${type.name} (${type.activeMemberCount})`,
  })), [membershipTypes]);

  const toggleMembershipTypeId = (value: string) =>
    setSelectedMembershipTypeIds((prev) =>
      prev.includes(value) ? prev.filter((id) => id !== value) : [...prev, value],
    );

  const clearMembershipTypeIds = () => setSelectedMembershipTypeIds([]);

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const incomingFiles = Array.from(incoming);

    setFiles((prev) => {
      const oversized = incomingFiles.filter((file) => file.size > MAX_FILE_SIZE_BYTES);
      const accepted = incomingFiles.filter((file) => file.size <= MAX_FILE_SIZE_BYTES);
      const merged = [...prev, ...accepted].filter(
        (file, index, arr) => arr.findIndex((f) => f.name === file.name && f.size === file.size) === index,
      );
      const limited = merged.slice(0, MAX_FILES);

      if (oversized.length > 0) {
        toast({
          title: `${oversized.length} file(s) skipped`,
          description: `Files must be ${MAX_FILE_SIZE_MB} MB or smaller.`,
          status: 'warning',
          position: 'top-right',
        });
      }
      if (merged.length > MAX_FILES) {
        toast({
          title: `Only ${MAX_FILES} files allowed`,
          description: 'Extra files were not added.',
          status: 'warning',
          position: 'top-right',
        });
      }

      return limited;
    });
  }, [toast]);

  const removeFile = (index: number) =>
    setFiles((prev) => prev.filter((_, i) => i !== index));

  const [downloadingDocId, setDownloadingDocId] = useState<string | null>(null);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);

  const handleDownloadDocument = async (doc: DocumentCategoryDocument) => {
    setDownloadingDocId(doc.uniqueId);
    try {
      await documentCategoryService.downloadDocument(doc.uniqueId, doc.fileName);
    } catch (err: any) {
      toast({
        title: 'Failed to download document',
        description: err?.response?.data?.message ?? err?.message ?? 'Please try again.',
        status: 'error',
        position: 'top-right',
      });
    } finally {
      setDownloadingDocId(null);
    }
  };

  const handleDeleteDocument = async (doc: DocumentCategoryDocument) => {
    if (!documentCategoryId) return;

    setDeletingDocId(doc.uniqueId);
    try {
      const response = await documentCategoryService.deleteDocuments(documentCategoryId, [doc.uniqueId]);
      setExistingDocuments((prev) => prev.filter((d) => d.uniqueId !== doc.uniqueId));
      toast({
        title: response.data?.message ?? 'Document removed.',
        status: 'success',
        position: 'top-right',
      });
    } catch (err: any) {
      toast({
        title: 'Failed to remove document',
        description: err?.response?.data?.message ?? err?.message ?? 'Please try again.',
        status: 'error',
        position: 'top-right',
      });
    } finally {
      setDeletingDocId(null);
    }
  };

  const canSubmit = name.trim().length > 0 && !isSubmitting && !isDetailLoading;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      let categoryUniqueId = documentCategoryId ?? null;
      let successMessage = 'Document category created.';

      if (isEditMode && documentCategoryId) {
        const updateResponse = await documentCategoryService.update(documentCategoryId, {
          name: name.trim(),
          description: description.trim() || undefined,
          allowDownload: true,
          membershipTypeUniqueIds: selectedMembershipTypeIds,
        });
        successMessage = updateResponse.data?.message ?? 'Document category updated.';
      } else {
        const createResponse = await documentCategoryService.create({
          name: name.trim(),
          description: description.trim() || undefined,
          allowDownload: true,
          membershipTypeUniqueIds: selectedMembershipTypeIds,
        });
        categoryUniqueId = createResponse.data?.data ?? null;
        successMessage = createResponse.data?.message ?? 'Document category created.';
      }

      if (categoryUniqueId && files.length > 0) {
        try {
          await documentCategoryService.uploadDocuments(categoryUniqueId, files);
        } catch (uploadErr: any) {
          toast({
            title: `Category ${isEditMode ? 'updated' : 'created'}, but document upload failed`,
            description: uploadErr?.response?.data?.message ?? uploadErr?.message ?? 'You can upload documents later.',
            status: 'warning',
            position: 'top-right',
          });
          navigate('/organizer/membership/documents');
          return;
        }
      }

      toast({
        title: successMessage,
        status: 'success',
        position: 'top-right',
      });
      navigate('/organizer/membership/documents');
    } catch (err: any) {
      toast({
        title: `Failed to ${isEditMode ? 'update' : 'create'} document category`,
        description: err?.response?.data?.message ?? err?.message ?? 'Please try again.',
        status: 'error',
        position: 'top-right',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isEditMode,
    isDetailLoading,
    name,
    setName,
    description,
    setDescription,
    membershipTypeOptions,
    membershipTypesLoading,
    selectedMembershipTypeIds,
    toggleMembershipTypeId,
    clearMembershipTypeIds,
    existingDocuments,
    downloadingDocId,
    deletingDocId,
    handleDownloadDocument,
    handleDeleteDocument,
    files,
    addFiles,
    removeFile,
    isSubmitting,
    canSubmit,
    handleSubmit,
  };
}
