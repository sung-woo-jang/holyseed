import { PortfolioListItem } from '@components/portfolio/PortfolioListItem';
import { SectionCard } from '@components/ui';
import { createRoute } from '@granite-js/react-native';
import { useBottomNavHeight, usePortfolios, useRefresh } from '@hooks';
import { colors } from '@toss/tds-colors';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

export const Route = createRoute('/portfolio', {
  component: Page,
});

/**
 * 포트폴리오 목록 페이지 - 짐싸 스타일
 */
function Page() {
  const navigation = Route.useNavigation();
  const bottomNavHeight = useBottomNavHeight();
  const portfoliosQuery = usePortfolios();
  const { data: portfoliosResponse, isLoading } = portfoliosQuery;
  const { refreshing, onRefresh } = useRefresh(portfoliosQuery);

  const handlePortfolioPress = (portfolioId: number) => {
    navigation.navigate('/portfolio/:id' as any, { id: String(portfolioId) });
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.blue500} />
          <Text style={styles.loadingText}>포트폴리오를 불러오는 중...</Text>
        </View>
      </View>
    );
  }

  const portfolios = portfoliosResponse?.data || [];
  const isEmpty = portfolios.length === 0;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomNavHeight, paddingTop: 10 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.blue500}
            colors={[colors.blue500]}
          />
        }
      >
        <SectionCard title="작업 사례" subtitle="다양한 작업 사례를 확인해보세요">
          <SectionCard.Empty isEmpty={isEmpty} message="등록된 포트폴리오가 없습니다." />

          <SectionCard.Content>
            {portfolios.map((portfolio, index) => (
              <PortfolioListItem
                key={portfolio.id}
                portfolio={portfolio}
                onPress={handlePortfolioPress}
                showBorder={index < portfolios.length - 1}
              />
            ))}
          </SectionCard.Content>
        </SectionCard>
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
  },
  scrollContent: {
    paddingVertical: 10,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    color: colors.grey600,
  },
});
