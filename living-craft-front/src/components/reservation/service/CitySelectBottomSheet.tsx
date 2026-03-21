import { InlineEmptyState, ListSeparator, SectionHeader } from '@components/ui';
import { colors } from '@toss/tds-colors';
import { IconButton, Skeleton } from '@toss/tds-react-native';
import type { CityData, RegionData } from '@types';
import { useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import RBSheet from 'react-native-raw-bottom-sheet';

interface RBSheetRef {
  open: () => void;
  close: () => void;
}

interface Props {
  isOpen: boolean;
  selectedRegion: RegionData | null;
  cities: CityData[];
  isLoading: boolean;
  onClose: () => void;
  onSelect: (city: CityData) => void;
  onBackToRegion: () => void;
}

export function CitySelectBottomSheet({
  isOpen,
  selectedRegion,
  cities,
  isLoading,
  onClose,
  onSelect,
  onBackToRegion,
}: Props) {
  const sheetRef = useRef<RBSheetRef>(null);

  useEffect(() => {
    if (isOpen) {
      sheetRef.current?.open();
    } else {
      sheetRef.current?.close();
    }
  }, [isOpen]);

  const handleSelect = (city: CityData) => {
    onSelect(city);
  };

  const handleBackPress = () => {
    sheetRef.current?.close();
    setTimeout(() => {
      onBackToRegion();
    }, 300);
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
      <SectionHeader
        title="구/군 선택"
        subtitle={selectedRegion ? `${selectedRegion.name}의 구/군을 선택해주세요` : undefined}
        leftAction={
          <IconButton
            name="icon-arrow-back-ios-mono"
            onPress={handleBackPress}
            accessibilityLabel="시/도 재선택"
            style={{
              padding: 0,
              paddingRight: 10,
            }}
          />
        }
        showBorder
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            {Array.from({ length: 6 }).map((_, index) => (
              <View key={index} style={styles.skeletonItem}>
                <Skeleton width="50%" height={16} borderRadius={4} />
              </View>
            ))}
          </View>
        ) : cities.length === 0 ? (
          <InlineEmptyState message="해당 지역에 서비스 가능한 구/군이 없습니다." />
        ) : (
          cities.map((item, index) => (
            <View key={item.id}>
              <TouchableOpacity style={styles.cityItem} onPress={() => handleSelect(item)}>
                <Text style={styles.cityText}>{item.name}</Text>
              </TouchableOpacity>
              {index < cities.length - 1 && <ListSeparator />}
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
  cityItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: colors.white,
  },
  cityText: {
    fontSize: 16,
    color: colors.grey900,
    fontWeight: '500',
  },
  loadingContainer: {
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  skeletonItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.grey200,
  },
});
