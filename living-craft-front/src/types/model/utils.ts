import type { StoreApi } from 'zustand';
import { shallow } from 'zustand/shallow';
import type { UseBoundStoreWithEqualityFn } from 'zustand/traditional';

/**
 * store의 특정 키들만 선택적으로 구독할 수 있는 유틸리티 타입.
 * @template T - Store의 상태 타입
 * @template K - T의 키 타입들
 */
export type StoreWithShallow<T> = <K extends keyof T>(keys: K[], withEqualityFn?: boolean) => Pick<T, K>;

/**
 * useStoreWithShallow는 Zustand store에서 특정 키들만 선택하여 구독하는 유틸리티 함수.
 * shallow equality 비교를 통해 불필요한 리렌더링을 방지.
 *
 * @template T - Store의 상태 타입
 * @template K - 선택할 상태의 키 타입
 * @param storeWithEqualityFn - Zustand store
 * @param keys - 구독할 상태의 키 배열
 * @param withEqualityFn - shallow equality 비교 사용 여부 (기본값: true)
 * @returns 선택된 상태들의 객체
 */
export const useStoreWithShallow = <T, K extends keyof T>(
  storeWithEqualityFn: UseBoundStoreWithEqualityFn<StoreApi<T>>,
  keys: K[],
  withEqualityFn = true,
): Pick<T, K> =>
  storeWithEqualityFn<T>(
    (state) =>
      keys.reduce(
        (prev, key) => ({
          ...prev,
          [key]: state[key],
        }),
        {} as T,
      ),

    withEqualityFn ? shallow : undefined,
  );
