import { colors } from '@toss/tds-colors';
import { Skeleton } from '@toss/tds-react-native';
import { StyleSheet, View } from 'react-native';

/**
 * 리뷰 카드 로딩 스켈레톤
 */
export const ReviewCardSkeleton = () => {
  return (
    <>
      <View style={styles.card}>
        <View style={styles.header}>
          <Skeleton width={48} height={48} borderRadius={24} />
          <View style={styles.authorInfo}>
            <Skeleton width="50%" height={17} borderRadius={4} />
            <View style={styles.spacing} />
            <Skeleton width="30%" height={13} borderRadius={4} />
          </View>
        </View>
        <View style={styles.stars}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} width={24} height={24} borderRadius={4} />
          ))}
        </View>
        <Skeleton width="100%" height={15} borderRadius={4} />
        <View style={styles.spacingSmall} />
        <Skeleton width="80%" height={15} borderRadius={4} />
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
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorInfo: {
    flex: 1,
  },
  stars: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 12,
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
    height: 4,
  },
  spacingSmall: {
    height: 6,
  },
});
