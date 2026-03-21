import { colors } from '@toss/tds-colors';
import { Skeleton } from '@toss/tds-react-native';
import { StyleSheet, View } from 'react-native';

/**
 * 프로모션 아이템 로딩 스켈레톤
 */
export const PromoItemSkeleton = () => {
  return (
    <View style={styles.container}>
      <Skeleton width={56} height={56} borderRadius={8} />
      <View style={styles.textContainer}>
        <Skeleton width="70%" height={16} borderRadius={4} />
        <View style={styles.spacing} />
        <Skeleton width="50%" height={14} borderRadius={4} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.grey50,
    borderRadius: 12,
    height: 80,
  },
  textContainer: {
    flex: 1,
    marginLeft: 16,
  },
  spacing: {
    height: 6,
  },
});
