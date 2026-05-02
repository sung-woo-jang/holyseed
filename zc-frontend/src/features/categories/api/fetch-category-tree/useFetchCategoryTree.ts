import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from '@/shared/api/axios';
import { ZC_API } from '@/shared/api/endpoints';
import { type CategoryTreeItem } from '@/features/categories/types';

interface UseFetchCategoryTreeOptions {
  siteCode?: string;
}

export function useFetchCategoryTree(options?: UseFetchCategoryTreeOptions) {
  const { siteCode } = options || {};

  return useQuery({
    queryKey: ['site-categories', 'tree', siteCode],
    queryFn: async () => {
      const url = siteCode
        ? `${ZC_API.SITE_CATEGORIES.TREE}?siteCode=${siteCode}`
        : ZC_API.SITE_CATEGORIES.TREE;
      const response = await axiosInstance.get<CategoryTreeItem[]>(url);
      return response.data;
    },
  });
}
