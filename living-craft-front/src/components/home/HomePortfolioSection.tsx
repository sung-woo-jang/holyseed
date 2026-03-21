import { Carousel, SectionCard } from '@components/ui';
import { createRoute } from '@granite-js/react-native';
import { usePortfolios } from '@hooks';
import { colors } from '@toss/tds-colors';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { PortfolioCard } from './PortfolioCard';
import { PortfolioCardSkeleton } from './PortfolioCardSkeleton';

const SCREEN_WIDTH = Dimensions.get('window').width;

// 임시 라우트 생성 (네비게이션 훅 사용을 위해)
const TempRoute = createRoute('/_layout' as any, { component: () => null });

/**
 * 홈페이지 포트폴리오 섹션 - 작업 사례
 * 다양한 서비스 작업 사례를 이미지 카드로 표시
 */
export const HomePortfolioSection = () => {
  const navigation = TempRoute.useNavigation();

  // 홈 페이지에서는 최신 5개만 표시
  const { data: portfoliosResponse, isLoading } = usePortfolios({ limit: 5, page: 1 });

  const portfolios = portfoliosResponse?.data || [];
  const isEmpty = portfolios.length === 0;

  const handlePortfolioPress = (portfolioId: number) => {
    navigation.navigate('/portfolio/:id' as any, { id: String(portfolioId) });
  };

  const handleViewAllPress = () => {
    navigation.navigate('/portfolio' as any);
  };

  return (
    <SectionCard title="작업 사례">
      <SectionCard.Loading isLoading={isLoading}>
        <PortfolioCardSkeleton />
      </SectionCard.Loading>

      <SectionCard.Empty isEmpty={isEmpty} message="등록된 작업 사례가 없습니다." />

      <SectionCard.Content>
        <Carousel
          data={portfolios}
          renderItem={(item) => <PortfolioCard portfolio={item} onPress={handlePortfolioPress} />}
          itemWidth={SCREEN_WIDTH - 40}
          itemHeight={320}
          gap={16}
          showIndicator={true}
          dotColor={colors.blue500}
          inactiveDotColor={colors.grey300}
          autoPlay={true}
          autoPlayInterval={4000}
        />

        <TouchableOpacity onPress={handleViewAllPress} style={styles.viewAllButton}>
          <View style={styles.viewAllButtonInner}>
            <Text style={styles.viewAllText}>모든 작업 사례 보기</Text>
          </View>
        </TouchableOpacity>
      </SectionCard.Content>
    </SectionCard>
  );
};

const styles = StyleSheet.create({
  viewAllButton: {
    marginTop: 32,
    alignItems: 'center',
  },
  viewAllButtonInner: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    backgroundColor: colors.blue50,
    borderRadius: 12,
  },
  viewAllText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.blue500,
    textAlign: 'center',
  },
});
