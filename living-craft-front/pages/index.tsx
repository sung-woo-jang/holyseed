import { HomePortfolioSection } from '@components/home/HomePortfolioSection';
import { HomePromoCarouselSection } from '@components/home/HomePromoCarouselSection';
import { HomeReviewsSection } from '@components/home/HomeReviewsSection';
import { HomeServicesSection } from '@components/home/HomeServicesSection';
import { createRoute } from '@granite-js/react-native';
import { useBottomNavHeight, usePortfolios, usePromotions, useRefresh, useReviews, useServices } from '@hooks';
import { colors } from '@toss/tds-colors';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

export const Route = createRoute('/', {
  component: Page,
});

/**
 * 홈페이지 - 생활 서비스 랜딩 페이지
 *
 * 구조:
 * 1. 프로모션 캐러셀 - 이벤트/혜택 안내
 * 2. 서비스 목록 - 인테리어 필름, 유리청소 등
 * 3. 작업 사례 - 포트폴리오 이미지
 * 4. 고객 후기 - 리뷰 캐러셀
 */
function Page() {
  const bottomNavHeight = useBottomNavHeight();

  // 각 섹션의 쿼리 수집
  const promosQuery = usePromotions();
  const servicesQuery = useServices();
  const portfoliosQuery = usePortfolios({ limit: 5, page: 1 });
  const reviewsQuery = useReviews({ limit: 5, page: 1 });

  // 모든 쿼리를 한 번에 새로고침
  const { refreshing, onRefresh } = useRefresh([promosQuery, servicesQuery, portfoliosQuery, reviewsQuery]);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomNavHeight, paddingTop: 10 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.blue500}
            colors={[colors.blue500]}
          />
        }
      >
        <HomePromoCarouselSection />
        <HomeServicesSection />
        <HomePortfolioSection />
        <HomeReviewsSection />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.greyBackground,
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.greyBackground,
  },
  scrollContent: {
    backgroundColor: colors.greyBackground,
    paddingHorizontal: 4,
  },
});
