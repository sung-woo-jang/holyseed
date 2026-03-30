import { Card, SectionHeader } from '@components/ui';
import { useReservationStore } from '@store';
import { colors } from '@toss/tds-colors';
import { TextField } from '@toss/tds-react-native';
import type { AddressSearchResult, ReservationFormData } from '@types';
import { useCallback, useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AddressSearchDrawer } from './AddressSearchDrawer';

/**
 * 주소 관리 섹션
 *
 * 변경 사항 (Phase 3):
 * - 지역 선택 UI 완전 제거 (RegionSelectBottomSheet, CitySelectBottomSheet, AddressSelectionSection)
 * - 주소 검색(AddressSearchDrawer)만 유지
 * - 출장비 계산 로직 제거
 * - props 제거 (currentService, services, filteredRegions)
 */
export function AddressManagementSection() {
  const { setValue, watch } = useFormContext<ReservationFormData>();

  // ===== Store =====
  const { isAddressSearchDrawerOpen, update } = useReservationStore([
    'isAddressSearchDrawerOpen',
    'update',
  ]);

  // ===== React Hook Form 값 감시 =====
  const formAddress = watch('customerInfo.address');
  const formDetailAddress = watch('customerInfo.detailAddress');

  // ===== 로컬 상태 =====
  const [localSelectedAddress, setLocalSelectedAddress] = useState<AddressSearchResult | null>(null);
  const [detailAddress, setDetailAddress] = useState('');

  // ===== React Hook Form 값을 로컬 상태로 복원 =====
  useEffect(() => {
    // 주소가 있는데 로컬 상태가 비어있으면 복원
    if (formAddress && !localSelectedAddress) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalSelectedAddress({
        roadAddress: formAddress,
        jibunAddress: '',
        zipCode: '',
      });
    }

    // 상세주소 복원
    if (formDetailAddress && !detailAddress) {
      setDetailAddress(formDetailAddress);
    }
  }, [formAddress, formDetailAddress, localSelectedAddress, detailAddress]);

  // ===== 핸들러 =====
  const handleAddressSelect = useCallback(
    (address: AddressSearchResult) => {
      setLocalSelectedAddress(address);
      update({ isAddressSearchDrawerOpen: false });
      setValue('customerInfo.address', address.roadAddress);
    },
    [update, setValue]
  );

  const handleClearAddress = () => {
    setLocalSelectedAddress(null);
    setDetailAddress('');
    setValue('customerInfo.address', '');
    setValue('customerInfo.detailAddress', '');
  };

  const handleDetailAddressChange = (value: string) => {
    setDetailAddress(value);
    setValue('customerInfo.detailAddress', value);
  };

  const handleOpenSearchDrawer = () => {
    update({ isAddressSearchDrawerOpen: true });
  };

  return (
    <>
      <SectionHeader
        title="서비스 주소"
        subtitle="서비스를 받으실 주소를 입력해주세요"
        style={styles.sectionHeader}
      />

      <Card style={styles.card}>
        {/* 주소 검색 버튼 또는 선택된 주소 표시 */}
        {!localSelectedAddress ? (
          <Pressable style={styles.searchButton} onPress={handleOpenSearchDrawer}>
            <Text style={styles.searchButtonText}>주소 검색</Text>
          </Pressable>
        ) : (
          <View style={styles.addressContainer}>
            <View style={styles.addressHeader}>
              <Text style={styles.addressLabel}>도로명 주소</Text>
              <Pressable onPress={handleClearAddress}>
                <Text style={styles.clearButton}>변경</Text>
              </Pressable>
            </View>
            <Text style={styles.addressText}>{localSelectedAddress.roadAddress}</Text>

            {localSelectedAddress.jibunAddress && (
              <Text style={styles.jibunAddress}>지번: {localSelectedAddress.jibunAddress}</Text>
            )}

            {/* 상세주소 입력 */}
            <View style={styles.detailAddressContainer}>
              <TextField
                variant="box"
                label="상세주소"
                labelOption="sustain"
                placeholder="동/호수 등 상세주소를 입력해주세요"
                value={detailAddress}
                onChangeText={handleDetailAddressChange}
              />
            </View>
          </View>
        )}
      </Card>

      {/* 주소 검색 Drawer */}
      <AddressSearchDrawer
        isOpen={isAddressSearchDrawerOpen}
        regionPrefix="" // 전역 서비스이므로 지역 제한 없음
        onClose={() => update({ isAddressSearchDrawerOpen: false })}
        onSelect={handleAddressSelect}
      />
    </>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginHorizontal: 10,
    marginBottom: 10,
  },
  card: {
    marginHorizontal: 10,
    marginBottom: 16,
    padding: 16,
  },
  searchButton: {
    backgroundColor: colors.blue500,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  searchButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  addressContainer: {
    gap: 12,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.grey700,
  },
  clearButton: {
    fontSize: 14,
    color: colors.blue500,
    fontWeight: '500',
  },
  addressText: {
    fontSize: 16,
    color: colors.grey900,
    lineHeight: 22,
  },
  jibunAddress: {
    fontSize: 13,
    color: colors.grey600,
  },
  detailAddressContainer: {
    marginTop: 8,
  },
});
