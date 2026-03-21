import { colors } from '@toss/tds-colors';
import { useRef, useState } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { Dimensions, FlatList, StyleSheet, View } from 'react-native';

import { CarouselIndicator } from './carousel-indicator';
import type { CarouselItem, CarouselProps } from './types';
import { useAutoPlay } from './utils';

const SCREEN_WIDTH = Dimensions.get('window').width;

/**
 * 캐러셀 컴포넌트
 * FlatList 기반 수평 스크롤 캐러셀
 */
export const Carousel = <T extends CarouselItem>({
  data,
  renderItem,
  itemWidth = SCREEN_WIDTH,
  itemHeight = 200,
  gap = 0,
  containerStyle,
  showIndicator = true,
  dotColor = colors.blue500,
  inactiveDotColor = colors.grey300,
  initialIndex = 0,
  autoPlay = false,
  autoPlayInterval = 3000,
  onIndexChange,
}: CarouselProps<T>) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const flatListRef = useRef<FlatList>(null);

  // gap이 있을 경우 실제 아이템 너비 계산
  const actualItemWidth = itemWidth - gap;

  // 스크롤 핸들러
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / itemWidth);

    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < data.length) {
      setCurrentIndex(newIndex);
      onIndexChange?.(newIndex);
    }
  };

  // 프로그래매틱 스크롤
  const scrollToIndex = (index: number) => {
    flatListRef.current?.scrollToIndex({
      index,
      animated: true,
    });
  };

  // 자동 스크롤 훅
  useAutoPlay(autoPlay, autoPlayInterval, currentIndex, data.length, scrollToIndex);

  // 아이템 렌더러
  const renderCarouselItem = ({ item, index }: { item: T; index: number }) => {
    return (
      <View
        style={[
          styles.itemContainer,
          {
            width: itemWidth,
            height: itemHeight,
            paddingHorizontal: gap / 2,
          },
        ]}
      >
        <View style={{ width: actualItemWidth, height: itemHeight }}>{renderItem(item, index)}</View>
      </View>
    );
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <FlatList
        ref={flatListRef}
        data={data}
        renderItem={renderCarouselItem}
        keyExtractor={(item) => String(item.id)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={itemWidth}
        decelerationRate="fast"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        getItemLayout={(_, index) => ({
          length: itemWidth,
          offset: itemWidth * index,
          index,
        })}
      />

      {showIndicator && (
        <CarouselIndicator
          totalCount={data.length}
          currentIndex={currentIndex}
          dotColor={dotColor}
          inactiveDotColor={inactiveDotColor}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
  },
  itemContainer: {
    overflow: 'hidden',
  },
});
