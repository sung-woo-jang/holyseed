import { Carousel, SectionCard } from '@components/ui';
import { useReviews } from '@hooks';
import { colors } from '@toss/tds-colors';
import { Dimensions } from 'react-native';

import { ReviewCard } from './ReviewCard';
import { ReviewCardSkeleton } from './ReviewCardSkeleton';

const SCREEN_WIDTH = Dimensions.get('window').width;

/**
 * 홈페이지 리뷰 섹션 - 서비스 후기
 * 고객 서비스 후기를 카드 형태로 표시
 */
export const HomeReviewsSection = () => {
  // 홈 페이지에서는 최신 5개만 표시
  const { data: reviewsResponse, isLoading } = useReviews({ limit: 5, page: 1 });

  const reviews = reviewsResponse?.data || [];
  const isEmpty = reviews.length === 0;

  return (
    <SectionCard title="입주민이 알려주는 이야기">
      <SectionCard.Loading isLoading={isLoading}>
        <ReviewCardSkeleton />
      </SectionCard.Loading>

      <SectionCard.Empty isEmpty={isEmpty} message="등록된 리뷰가 없습니다." />

      <SectionCard.Content>
        <Carousel
          data={reviews}
          renderItem={(review) => <ReviewCard review={review} />}
          itemWidth={SCREEN_WIDTH - 40}
          itemHeight={220}
          gap={16}
          showIndicator={true}
          dotColor={colors.blue500}
          inactiveDotColor={colors.grey300}
          autoPlay={true}
          autoPlayInterval={5000}
        />
      </SectionCard.Content>
    </SectionCard>
  );
};
