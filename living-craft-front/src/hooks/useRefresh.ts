/**
 * Living Craft Pull-to-Refresh 훅
 */

import type { UseQueryResult } from '@tanstack/react-query';
import { useState } from 'react';

/**
 * Pull-to-Refresh 기능을 위한 커스텀 훅
 *
 * @description
 * React Native의 RefreshControl/FlatList와 TanStack Query를 통합합니다.
 * 단일 또는 다중 쿼리를 동시에 새로고침할 수 있습니다.
 *
 * @param queries - 새로고침할 쿼리 (단일 또는 배열)
 * @returns refreshing 상태와 onRefresh 콜백
 *
 * @example
 * // 단일 쿼리 (FlatList)
 * const reviewsQuery = useReviews();
 * const { refreshing, onRefresh } = useRefresh(reviewsQuery);
 *
 * <FlatList
 *   data={data}
 *   refreshing={refreshing}
 *   onRefresh={onRefresh}
 * />
 *
 * @example
 * // 다중 쿼리 (ScrollView - 홈페이지)
 * const promosQuery = usePromotions();
 * const servicesQuery = useServices();
 * const { refreshing, onRefresh } = useRefresh([promosQuery, servicesQuery]);
 *
 * <ScrollView
 *   refreshControl={
 *     <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
 *   }
 * />
 */
export function useRefresh(queries: UseQueryResult | UseQueryResult[]) {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);

    try {
      const queryArray = Array.isArray(queries) ? queries : [queries];

      // 모든 쿼리를 병렬로 refetch
      await Promise.all(queryArray.map((query) => query.refetch()));
    } catch (error) {
      console.error('Refresh failed:', error);
      // 에러 발생해도 리프레시 상태는 종료
      // 사용자는 기존 캐시된 데이터를 계속 볼 수 있음
    } finally {
      setRefreshing(false);
    }
  };

  return { refreshing, onRefresh };
}
