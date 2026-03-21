import type { Promotion } from '@api/types';
import { Card } from '@components/ui/card';
import { Carousel } from '@components/ui/carousel';
import { createRoute } from '@granite-js/react-native';
import { useIncrementPromotionClick, usePromotions } from '@hooks';
import { Dimensions, Linking, StyleSheet } from 'react-native';

import { PromoItem } from './PromoItem';
import { PromoItemSkeleton } from './PromoItemSkeleton';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_HORIZONTAL_MARGIN = 10;
const CARD_HORIZONTAL_PADDING = 8;
const CAROUSEL_WIDTH = SCREEN_WIDTH - (CARD_HORIZONTAL_MARGIN * 2) - (CARD_HORIZONTAL_PADDING * 2);

// 네비게이션 훅 사용을 위한 임시 라우트
const TempRoute = createRoute('/_layout' as any, { component: () => null });

export const HomePromoCarouselSection = () => {
  const navigation = TempRoute.useNavigation();
  const { data: promotions, isLoading } = usePromotions();
  const { mutate: incrementClick } = useIncrementPromotionClick();

  // 프로모션 배너가 없으면 렌더링하지 않음
  if (!isLoading && (!promotions || promotions.length === 0)) {
    return null;
  }

  const handlePromoPress = async (item: Promotion) => {
    // 1. 클릭 통계 API 호출 (비동기, 에러 무시)
    incrementClick(item.id);

    // 2. 링크 타입에 따른 이동
    if (!item.linkUrl) return;

    if (item.linkType === 'external') {
      try {
        await Linking.openURL(item.linkUrl);
      } catch (error) {
        console.error('외부 링크 열기 실패:', error);
      }
    } else if (item.linkType === 'internal') {
      // linkUrl에서 경로와 쿼리 스트링 분리
      // 예: '/reservation/service?serviceId=1' -> path: '/reservation/service', params: { serviceId: '1' }
      const [path, queryString] = item.linkUrl.split('?');
      const params = queryString
        ? Object.fromEntries(new URLSearchParams(queryString))
        : undefined;

      navigation.navigate(path as any, params);
    }
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <Card>
        <PromoItemSkeleton />
      </Card>
    );
  }

  return (
    <Card>
      <Carousel
        data={promotions ?? []}
        renderItem={(item) => <PromoItem promotion={item} onPress={handlePromoPress} />}
        itemWidth={CAROUSEL_WIDTH}
        itemHeight={80}
        autoPlay
        autoPlayInterval={4000}
        containerStyle={styles.carouselContainer}
      />
    </Card>
  );
};

const styles = StyleSheet.create({
  carouselContainer: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    overflow: 'hidden',
  },
});
