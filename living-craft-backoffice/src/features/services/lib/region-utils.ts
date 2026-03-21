import type {
  District,
  GroupedServiceRegion,
  ServiceRegionInput,
} from '@/shared/types/api'

/**
 * regions 배열을 시/도별로 그룹화
 * @param regions - 폼의 regions 배열 [{ districtId, estimateFee }]
 * @param allDistricts - 전체 지역 목록 (District[])
 * @returns 시/도별로 그룹화된 배열
 */
export function groupRegionsBySido(
  regions: ServiceRegionInput[],
  allDistricts: District[]
): GroupedServiceRegion[] {
  const sidoMap = new Map<number, GroupedServiceRegion>()

  for (const region of regions) {
    const district = allDistricts.find((d) => d.id === region.districtId)
    if (!district) continue

    if (district.level === 'SIDO') {
      // 시/도 레벨 레코드
      const existing = sidoMap.get(district.id)
      if (existing) {
        existing.sidoEstimateFee = region.estimateFee
      } else {
        sidoMap.set(district.id, {
          sidoId: district.id,
          sidoName: district.name,
          sidoEstimateFee: region.estimateFee,
          sigungus: [],
        })
      }
    } else if (district.level === 'SIGUNGU' && district.parentId) {
      // 시/군/구 레벨 레코드
      let group = sidoMap.get(district.parentId)
      if (!group) {
        const sido = allDistricts.find((d) => d.id === district.parentId)
        group = {
          sidoId: district.parentId,
          sidoName: sido?.name ?? '',
          sidoEstimateFee: null,
          sigungus: [],
        }
        sidoMap.set(district.parentId, group)
      }
      group.sigungus.push({
        districtId: region.districtId,
        districtName: district.name,
        estimateFee: region.estimateFee,
      })
    }
  }

  // 시/도 이름 순으로 정렬, 각 시/도 내 구/군도 이름 순으로 정렬
  return Array.from(sidoMap.values())
    .sort((a, b) => a.sidoName.localeCompare(b.sidoName, 'ko'))
    .map((group) => ({
      ...group,
      sigungus: group.sigungus.sort((a, b) =>
        a.districtName.localeCompare(b.districtName, 'ko')
      ),
    }))
}

/**
 * 그룹화된 구조를 regions 배열로 평탄화
 * @param grouped - 시/도별 그룹화된 배열
 * @returns 폼용 regions 배열
 */
export function flattenToRegions(
  grouped: GroupedServiceRegion[]
): ServiceRegionInput[] {
  const regions: ServiceRegionInput[] = []

  for (const group of grouped) {
    // 시/도 기본 출장비가 있으면 SIDO 레코드 추가
    if (group.sidoEstimateFee !== null) {
      regions.push({
        districtId: group.sidoId,
        estimateFee: group.sidoEstimateFee,
      })
    }

    // 구/군별 레코드 추가
    for (const sigungu of group.sigungus) {
      regions.push({
        districtId: sigungu.districtId,
        estimateFee: sigungu.estimateFee,
      })
    }
  }

  return regions
}

/**
 * 특정 시/도의 구/군 개수 반환
 */
export function getSigunguCount(group: GroupedServiceRegion): number {
  return group.sigungus.length
}

/**
 * 시/도 기본 출장비와 다른 예외 출장비가 있는 구/군 개수 반환
 */
export function getExceptionCount(group: GroupedServiceRegion): number {
  if (group.sidoEstimateFee === null) {
    return 0
  }
  return group.sigungus.filter((s) => s.estimateFee !== group.sidoEstimateFee)
    .length
}
