import { colors } from '@toss/tds-colors';
import { Skeleton } from '@toss/tds-react-native';
import { StyleSheet, View } from 'react-native';

/**
 * 포트폴리오 카드 로딩 스켈레톤
 */
export const PortfolioCardSkeleton = () => {
  return (
    <>
      <View style={styles.card}>
        <Skeleton width="100%" height={180} borderRadius={0} />
        <View style={styles.content}>
          <Skeleton width={60} height={20} borderRadius={4} />
          <View style={styles.spacing} />
          <Skeleton width="70%" height={17} borderRadius={4} />
          <View style={styles.spacingSmall} />
          <Skeleton width="90%" height={14} borderRadius={4} />
        </View>
      </View>
      <View style={styles.indicator}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} width={8} height={8} borderRadius={4} style={styles.dot} />
        ))}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.grey100,
    backgroundColor: colors.white,
  },
  content: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  indicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  dot: {
    marginHorizontal: 4,
  },
  spacing: {
    height: 8,
  },
  spacingSmall: {
    height: 6,
  },
});
