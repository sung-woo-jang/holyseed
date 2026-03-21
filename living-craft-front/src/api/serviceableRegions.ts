import type { Service, ServiceRegion } from '@api/types';

import type { AddressEstimateInfo } from '../types';

/**
 * 특정 서비스에서 가능한 지역 목록 조회
 * @param services - 전체 서비스 목록
 * @param serviceId - 서비스 ID
 * @returns 해당 서비스의 지역 목록
 */
export function getServiceableRegionsForService(services: Service[], serviceId: number): ServiceRegion[] {
  const service = services.find((s) => s.id === serviceId);
  return service?.serviceableRegions ?? [];
}

/**
 * 주소 기반 견적 비용 조회
 * 선택된 지역/도시의 estimateFee를 기반으로 비용 계산
 * @param services - 전체 서비스 목록
 * @param serviceId - 서비스 ID
 * @param regionId - 시/도 ID
 * @param cityId - 시/군/구 ID
 * @returns 견적 비용 정보
 */
export function checkEstimateFeeByRegion(
  services: Service[],
  serviceId: number,
  regionId: string,
  cityId: string
): AddressEstimateInfo {
  const service = services.find((s) => s.id === serviceId);
  if (!service) {
    return { hasEstimateFee: false };
  }

  const region = service.serviceableRegions?.find((r: ServiceRegion) => r.id === regionId);
  if (!region) {
    return { hasEstimateFee: false };
  }

  const city = region.cities.find((c: { id: string; name: string; estimateFee: number | null }) => c.id === cityId);
  if (!city) {
    return { hasEstimateFee: false };
  }

  // 도시의 estimateFee가 있으면 그것 사용, 없으면 지역 기본 비용 사용
  const fee = city.estimateFee ?? region.estimateFee;

  if (fee > 0) {
    return {
      hasEstimateFee: true,
      estimateFee: fee,
      estimateFeeReason: city.estimateFee !== null && city.estimateFee > 0 ? '해당 지역 추가 출장비' : '지역 기본 출장비',
    };
  }

  return { hasEstimateFee: false };
}
