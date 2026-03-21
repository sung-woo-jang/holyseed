import { InlineEmptyState, ListSeparator, SectionHeader } from '@components/ui';
import { colors } from '@toss/tds-colors';
import type { RegionData } from '@types';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import RBSheet from 'react-native-raw-bottom-sheet';

interface RBSheetRef {
  open: () => void;
  close: () => void;
}

interface Props {
  isOpen: boolean;
  regions: RegionData[];
  isLoading: boolean;
  onClose: () => void;
  onSelect: (region: RegionData) => void;
}

export function RegionSelectBottomSheet({ isOpen, regions, isLoading, onClose, onSelect }: Props) {
  const sheetRef = useRef<RBSheetRef>(null);

  useEffect(() => {
    if (isOpen) {
      sheetRef.current?.open();
    } else {
      sheetRef.current?.close();
    }
  }, [isOpen]);

  const handleSelect = (region: RegionData) => {
    onSelect(region);
  };

  return (
    <RBSheet
      ref={sheetRef}
      onClose={onClose}
      height={450}
      openDuration={250}
      closeDuration={200}
      draggable
      customStyles={{
        container: styles.sheetContainer,
        draggableIcon: styles.draggableIcon,
      }}
    >
      <SectionHeader title="시/도 선택" subtitle="서비스를 받으실 시/도를 선택해주세요" showBorder />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.blue500} />
            <Text style={styles.loadingText}>지역 정보를 불러오는 중...</Text>
          </View>
        ) : regions.length === 0 ? (
          <InlineEmptyState message="사용 가능한 지역이 없습니다." />
        ) : (
          regions.map((item, index) => (
            <View key={item.id}>
              <TouchableOpacity style={styles.regionItem} onPress={() => handleSelect(item)}>
                <Text style={styles.regionText}>{item.name}</Text>
              </TouchableOpacity>
              {index < regions.length - 1 && <ListSeparator />}
            </View>
          ))
        )}
      </ScrollView>
    </RBSheet>
  );
}

const styles = StyleSheet.create({
  sheetContainer: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  draggableIcon: {
    backgroundColor: colors.grey300,
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  regionItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: colors.white,
  },
  regionText: {
    fontSize: 16,
    color: colors.grey900,
    fontWeight: '500',
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: colors.grey600,
  },
});
