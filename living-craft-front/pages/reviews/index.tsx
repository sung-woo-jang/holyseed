import { EmptyState } from '@components/ui/empty-state';
import { FilterOption, FilterTabs } from '@components/ui/filter-tabs';
import { createRoute } from '@granite-js/react-native';
import { useBottomNavHeight, useRefresh, useReviews } from '@hooks';
import { colors } from '@toss/tds-colors';
import { Asset, Skeleton } from '@toss/tds-react-native';
import { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export const Route = createRoute('/reviews', {
  component: Page,
});

const FILTER_OPTIONS: FilterOption[] = [
  { key: 'all', label: '전체' },
  { key: '5', label: '5점' },
  { key: '4', label: '4점' },
  { key: '3', label: '3점' },
];

/**
 * 리뷰 목록 페이지
 */
function Page() {
  const navigation = Route.useNavigation();
  const bottomNavHeight = useBottomNavHeight();
  const [activeFilter, setActiveFilter] = useState('all');

  const reviewsQuery = useReviews();
  const { data: reviewsResponse, isLoading } = reviewsQuery;
  const { refreshing, onRefresh } = useRefresh(reviewsQuery);

  const allReviews = reviewsResponse?.data || [];
  const filteredReviews = allReviews.filter((review) => {
    if (activeFilter === 'all') return true;
    return review.rating === parseInt(activeFilter);
  });

  const handleServicePress = (serviceId: number) => {
    navigation.navigate('/portfolio/:id', { id: String(serviceId) });
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>고객 리뷰</Text>
          <Text style={styles.subtitle}>실제 이용 고객님들의 솔직한 후기</Text>
        </View>
        <View style={styles.list}>
          {Array.from({ length: 4 }).map((_, index) => (
            <View key={index} style={styles.reviewCard}>
              <Skeleton width="40%" height={15} borderRadius={4} />
              <View style={{ height: 8 }} />
              <View style={{ flexDirection: 'row', gap: 4, marginBottom: 12 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} width={24} height={24} borderRadius={4} />
                ))}
              </View>
              <Skeleton width="100%" height={15} borderRadius={4} />
              <View style={{ height: 6 }} />
              <Skeleton width="80%" height={15} borderRadius={4} />
              <View style={{ height: 12 }} />
              <View style={[styles.footer, { borderTopWidth: 0 }]}>
                <Skeleton width={60} height={14} borderRadius={4} />
                <Skeleton width={80} height={13} borderRadius={4} />
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.title}>고객 리뷰</Text>
        <Text style={styles.subtitle}>실제 이용 고객님들의 솔직한 후기</Text>
      </View>

      {/* 필터 */}
      <FilterTabs options={FILTER_OPTIONS} activeKey={activeFilter} onFilterChange={setActiveFilter} />

      {/* 리뷰 목록 */}
      {filteredReviews.length === 0 ? (
        <EmptyState
          iconName="icon-chat-bubble-mono"
          title="리뷰가 없습니다"
          description="선택하신 평점에 해당하는 리뷰가 없습니다"
          actionLabel="전체 보기"
          onActionPress={() => setActiveFilter('all')}
        />
      ) : (
        <FlatList
          data={filteredReviews}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[styles.list, { paddingBottom: bottomNavHeight, paddingTop: 10 }]}
          renderItem={({ item }) => (
            <View style={styles.reviewCard}>
              {/* 서비스 정보 */}
              <TouchableOpacity onPress={() => handleServicePress(item.service.id)}>
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

              {/* 작성자 및 날짜 */}
              <View style={styles.footer}>
                <Text style={styles.userName}>{item.customer.name}</Text>
                <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString('ko-KR')}</Text>
              </View>
            </View>
          )}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      )}
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
    fontSize: 15,
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.grey100,
  },
  userName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.grey700,
  },
  date: {
    fontSize: 13,
    color: colors.grey500,
  },
});
