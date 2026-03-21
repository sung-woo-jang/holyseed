import type { AddressSelection } from '../types';

/**
 * 지역 prefix 생성 (주소 검색용)
 */
export function buildRegionPrefix(addressSelection: AddressSelection): string {
  if (!addressSelection.region) return '';
  if (!addressSelection.city) return addressSelection.region.name;
  return `${addressSelection.region.name} ${addressSelection.city.name}`;
}

/**
 * 주소 입력 완료 여부
 */
export function hasCompleteAddress(address: string): boolean {
  return address.trim() !== '';
}
