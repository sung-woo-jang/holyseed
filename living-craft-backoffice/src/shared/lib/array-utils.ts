/**
 * 배열에서 요소를 이동시킵니다.
 * @param array 원본 배열
 * @param fromIndex 이동할 요소의 현재 인덱스
 * @param toIndex 요소를 이동할 목표 인덱스
 * @returns 요소가 이동된 새로운 배열
 */
export function arrayMove<T>(
  array: T[],
  fromIndex: number,
  toIndex: number
): T[] {
  const newArray = [...array]
  const [movedItem] = newArray.splice(fromIndex, 1)
  newArray.splice(toIndex, 0, movedItem)
  return newArray
}
