import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '@/shared/api/axios';
import { ZC_API } from '@/shared/api/endpoints';
import type { Category, CreateUnifiedCategoryDto, UpdateUnifiedCategoryDto } from '@/features/categories/types';

const invalidateTree = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: ['unified-categories'] });
};

export function useCreateUnifiedCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateUnifiedCategoryDto) =>
      axiosInstance.post(ZC_API.CATEGORIES.CREATE, dto).then((r) => r.data),
    onSuccess: () => invalidateTree(qc),
  });
}

export function useUpdateUnifiedCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateUnifiedCategoryDto }) =>
      axiosInstance.post(ZC_API.CATEGORIES.UPDATE(id), dto).then((r) => r.data),
    onSuccess: () => invalidateTree(qc),
  });
}

export function useDeleteUnifiedCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      axiosInstance.post(ZC_API.CATEGORIES.DELETE(id)).then((r) => r.data),
    onSuccess: () => invalidateTree(qc),
  });
}

export function useFetchCategoryMappings(categoryId: string | null) {
  return useQuery({
    queryKey: ['unified-categories', 'mappings', categoryId],
    queryFn: async () => {
      const response = await axiosInstance.get<Category[]>(ZC_API.CATEGORIES.MAPPINGS(categoryId!));
      return response.data;
    },
    enabled: !!categoryId,
  });
}

export function useAssignMappings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ categoryId, siteCategoryIds }: { categoryId: string; siteCategoryIds: string[] }) =>
      axiosInstance.post(ZC_API.CATEGORIES.MAPPINGS(categoryId), { siteCategoryIds }).then((r) => r.data),
    onSuccess: (_, { categoryId }) => {
      qc.invalidateQueries({ queryKey: ['unified-categories', 'mappings', categoryId] });
      qc.invalidateQueries({ queryKey: ['unified-categories'] });
    },
  });
}

export function useRemoveMappings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ categoryId, siteCategoryIds }: { categoryId: string; siteCategoryIds: string[] }) =>
      axiosInstance.post(ZC_API.CATEGORIES.MAPPINGS_REMOVE(categoryId), { siteCategoryIds }).then((r) => r.data),
    onSuccess: (_, { categoryId }) => {
      qc.invalidateQueries({ queryKey: ['unified-categories', 'mappings', categoryId] });
      qc.invalidateQueries({ queryKey: ['unified-categories'] });
    },
  });
}
