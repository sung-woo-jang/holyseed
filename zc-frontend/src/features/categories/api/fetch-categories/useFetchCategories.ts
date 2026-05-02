import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from '@/shared/api/axios';
import { ZC_API } from '@/shared/api/endpoints';
import { type Category } from '@/features/categories/types';

// 사이트별 크롤링 카테고리 전체 목록
export function useFetchSiteCategories(siteCode?: string) {
  return useQuery({
    queryKey: ['site-categories', siteCode],
    queryFn: async () => {
      const url = siteCode
        ? `${ZC_API.SITE_CATEGORIES.LIST}?siteCode=${siteCode}`
        : ZC_API.SITE_CATEGORIES.LIST;
      const response = await axiosInstance.get<Category[]>(url);
      return response.data;
    },
  });
}

// 하위 호환성 유지
export function useFetchCategories() {
  return useFetchSiteCategories();
}
