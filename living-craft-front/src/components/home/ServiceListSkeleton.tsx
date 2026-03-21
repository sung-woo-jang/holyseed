import { colors } from '@toss/tds-colors';
import { Skeleton } from '@toss/tds-react-native';
import { StyleSheet, View } from 'react-native';

interface ServiceListSkeletonProps {
  /** 스켈레톤 아이템 개수 */
  count?: number;
}

/**
 * 서비스 리스트 로딩 스켈레톤
 */
export const ServiceListSkeleton = ({ count = 2 }: ServiceListSkeletonProps) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={[styles.row, index < count - 1 && styles.rowBorder]}>
          <Skeleton width={48} height={48} borderRadius={24} />
          <View style={styles.info}>
            <Skeleton width="60%" height={17} borderRadius={4} />
            <View style={styles.spacing} />
            <Skeleton width="80%" height={14} borderRadius={4} />
          </View>
          <Skeleton width={76} height={38} borderRadius={8} />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.grey100,
  },
  info: {
    flex: 1,
  },
  spacing: {
    height: 4,
  },
});
