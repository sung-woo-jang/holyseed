import { colors } from '@toss/tds-colors';
import { StyleSheet, View } from 'react-native';

import type { CarouselIndicatorProps } from './types';

export const CarouselIndicator = ({
  totalCount,
  currentIndex,
  dotColor = colors.blue500,
  inactiveDotColor = colors.grey300,
  style,
}: CarouselIndicatorProps) => {
  return (
    <View style={[styles.container, style]}>
      {Array.from({ length: totalCount }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            {
              backgroundColor: index === currentIndex ? dotColor : inactiveDotColor,
              width: index === currentIndex ? 20 : 6,
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
});
