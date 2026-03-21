import { Card } from '@components/ui';
import { useReservationStore } from '@store';
import { colors } from '@toss/tds-colors';
import { Asset, Button, TextField } from '@toss/tds-react-native';
import type { AddressSearchResult } from '@types';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
  selectedAddress: AddressSearchResult | null;
  detailAddress: string;
  onOpenSearchDrawer: () => void;
  onClearAddress: () => void;
  onDetailAddressChange: (value: string) => void;
}

export function AddressSelectionSection({
  selectedAddress,
  detailAddress,
  onOpenSearchDrawer,
  onClearAddress,
  onDetailAddressChange,
}: Props) {
  const { addressSelection, addressEstimateInfo, update, resetRegionSelection } = useReservationStore([
    'addressSelection',
    'addressEstimateInfo',
    'update',
    'resetRegionSelection',
  ]);

  const handleOpenRegionSheet = () => {
    update({ isRegionBottomSheetOpen: true });
  };

  const handleChangeRegion = () => {
    resetRegionSelection();
    onClearAddress();
    update({ isRegionBottomSheetOpen: true });
  };

  // 선택된 주소에서 시/도 + 구/군 부분 제외하고 표시
  // 예: "인천광역시 남동구 숙골로 456" → "숙골로 456"
  const displayAddress = useMemo(() => {
    if (!selectedAddress) return '';

    const { region, city } = addressSelection;
    if (!region || !city) return selectedAddress.roadAddress;

    let address = selectedAddress.roadAddress;

    // 시/도 이름 제거
    address = address.replace(region.name, '').trim();
    // 구/군 이름 제거
    address = address.replace(city.name, '').trim();

    return address;
  }, [selectedAddress, addressSelection]);

  // 지역 미선택 시: 시/도 선택 버튼
  if (!addressSelection.region || !addressSelection.city) {
    return (
      <View style={styles.selectRegionContainer}>
        <View style={styles.buttonContainer}>
          <Button onPress={handleOpenRegionSheet}>시/도 선택하기</Button>
        </View>
      </View>
    );
  }

  // 시/도 + 구/군 모두 선택된 경우
  return (
    <>
      {/* 서비스 지역 */}
      <TextField.Button
        variant="box"
        label="서비스 지역 *"
        value={`${addressSelection.region.name} ${addressSelection.city.name}`}
        onPress={handleChangeRegion}
        placeholder="지역을 선택하세요"
      />

      {/* 주소 검색 버튼 - 선택된 주소가 있으면 value에 표시 */}
      <TextField.Button
        variant="box"
        label="서비스 주소 *"
        value={displayAddress}
        onPress={onOpenSearchDrawer}
        placeholder="주소 검색하기"
      />

      {/* 상세 주소 입력 (주소 선택 후에만 표시) */}
      {selectedAddress && (
        <TextField
          variant="box"
          label="상세 주소 (선택)"
          labelOption="sustain"
          placeholder="동, 호수 입력"
          value={detailAddress}
          onChangeText={onDetailAddressChange}
        />
      )}

      {/* 견적 비용 안내 */}
      {selectedAddress && addressEstimateInfo?.hasEstimateFee && (
        <Card>
          <View style={styles.estimateContainer}>
            <View style={styles.iconWrapper}>
              <Asset.Icon name="icon-warning-circle-fill" frameShape={Asset.frameShape.CleanW20} />
            </View>
            <View style={styles.estimateTextContainer}>
              <Text style={styles.estimateTitle}>도서/원거리 지역</Text>
              <Text style={styles.estimateDescription}>
                추가비용 {addressEstimateInfo.estimateFee?.toLocaleString()}원이 발생할 수 있습니다
              </Text>
            </View>
          </View>
        </Card>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  selectRegionContainer: {
    alignItems: 'center',
  },
  buttonContainer: {
    alignItems: 'center',
  },
  estimateContainer: {
    flexDirection: 'row',
    backgroundColor: colors.yellow50,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    alignItems: 'flex-start',
  },
  iconWrapper: {
    marginRight: 12,
    marginTop: 2,
  },
  estimateTextContainer: {
    flex: 1,
  },
  estimateTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.orange900,
    marginBottom: 4,
  },
  estimateDescription: {
    fontSize: 14,
    color: colors.orange800,
    lineHeight: 20,
  },
});
