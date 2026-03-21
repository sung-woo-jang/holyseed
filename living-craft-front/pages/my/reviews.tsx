import { EmptyState } from '@components/ui/empty-state';
import { createRoute } from '@granite-js/react-native';
import { useBottomNavHeight, useMyReviews, useRefresh } from '@hooks';
import { colors } from '@toss/tds-colors';
import { Asset, Skeleton } from '@toss/tds-react-native';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export const Route = createRoute('/my/reviews', {
  component: Page,
});

/**
 * 내 리뷰 페이지
 */
function Page() {
  const navigation = Route.useNavigation();
  const bottomNavHeight = useBottomNavHeight();
  const myReviewsQuery = useMyReviews();
  const { data: myReviews, isLoading } = myReviewsQuery;
  const { refreshing, onRefresh } = useRefresh(myReviewsQuery);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>내 리뷰</Text>
          <Text style={styles.subtitle}>작성한 리뷰를 확인하세요</Text>
        </View>
        <View style={styles.list}>
          {Array.from({ length: 3 }).map((_, index) => (
            <View key={index} style={styles.reviewCard}>
              <Skeleton width="40%" height={16} borderRadius={4} />
              <View style={{ height: 8 }} />
              <View style={{ flexDirection: 'row', gap: 4, marginBottom: 12 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} width={24} height={24} borderRadius={4} />
                ))}
              </View>
              <Skeleton width="100%" height={15} borderRadius={4} />
              <View style={{ height: 6 }} />
              <Skeleton width="70%" height={15} borderRadius={4} />
              <View style={{ height: 12 }} />
              <Skeleton width={80} height={13} borderRadius={4} />
            </View>
          ))}
        </View>
      </View>
    );
  }

  const reviews = myReviews || [];

  if (reviews.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>내 리뷰</Text>
          <Text style={styles.subtitle}>작성한 리뷰를 확인하세요</Text>
        </View>
        <EmptyState
          iconName="icon-star-mono"
          iconColor={colors.yellow500}
          title="작성한 리뷰가 없습니다"
          description="서비스 이용 후 리뷰를 작성해주세요"
          actionLabel="내 예약 보기"
          onActionPress={() => navigation.navigate('/my/reservations')}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.title}>내 리뷰</Text>
        <Text style={styles.subtitle}>총 {reviews.length}개의 리뷰를 작성했습니다</Text>
      </View>

      {/* 리뷰 목록 */}
      <FlatList
        data={reviews}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[styles.list, { paddingBottom: bottomNavHeight, paddingTop: 10 }]}
        renderItem={({ item }) => (
          <View style={styles.reviewCard}>
            {/* 서비스 정보 */}
            <TouchableOpacity>
              <Text style={styles.serviceName}>{item.service.title}</Text>
            </TouchableOpacity>

            {/* 평점 */}
            <View style={styles.ratingContainer}>
              {Array.from({ length: 5 }).map((_, index) => (
                <Asset.Icon
                  key={index}
                  name="icon-star-mono"
                  color={index < item.rating ? colors.yellow500 : colors.grey300}
                  frameShape={Asset.frameShape.CleanW24}
                />
              ))}
              <Text style={styles.ratingText}>{item.rating}.0</Text>
            </View>

            {/* 리뷰 내용 */}
            <Text style={styles.comment}>{item.comment}</Text>

            {/* 작성일 */}
            <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString('ko-KR')}</Text>
          </View>
        )}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.grey200,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.grey900,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.grey600,
  },
  list: {
    padding: 16,
  },
  reviewCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.blue600,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 2,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.grey700,
    marginLeft: 6,
  },
  comment: {
    fontSize: 15,
    color: colors.grey800,
    lineHeight: 22,
    marginBottom: 12,
  },
  date: {
    fontSize: 13,
    color: colors.grey500,
  },
});
