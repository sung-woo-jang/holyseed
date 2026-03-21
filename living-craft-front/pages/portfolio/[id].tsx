import { Card, Carousel, SectionCard } from '@components/ui';
import { createRoute, Image } from '@granite-js/react-native';
import { useBottomNavHeight, usePortfolio } from '@hooks';
import { colors } from '@toss/tds-colors';
import { Skeleton } from '@toss/tds-react-native';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export const Route = createRoute('/portfolio/:id', {
  validateParams: (params) => params as { id: string },
  component: Page,
});

/**
 * 포트폴리오 상세 페이지 - 짐싸 스타일
 */
const SCREEN_WIDTH = Dimensions.get('window').width;
// HomePortfolioSection과 동일하게 설정
const CAROUSEL_ITEM_WIDTH = SCREEN_WIDTH - 40;

function Page() {
  const navigation = Route.useNavigation();
  const params = Route.useParams();
  const bottomNavHeight = useBottomNavHeight();

  const portfolioId = Number(params?.id) || 1;
  const { data: portfolio, isLoading: isLoadingPortfolio } = usePortfolio(portfolioId);

  const handleInquiryPress = () => {
    if (!portfolio) return;

    // 포트폴리오에 연결된 서비스 ID로 예약 페이지 이동
    if (portfolio.serviceId > 0) {
      navigation.navigate('/reservation' as any, { serviceId: String(portfolio.serviceId) });
    } else {
      navigation.navigate('/reservation' as any);
    }
  };

  if (isLoadingPortfolio) {
    return (
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomNavHeight, paddingTop: 10 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* 기본 정보 Skeleton */}
          <Card>
            <View style={styles.sectionHeader}>
              <Skeleton width={80} height={24} borderRadius={6} />
              <View style={{ height: 12 }} />
              <Skeleton width="70%" height={22} borderRadius={4} />
            </View>
            <View style={styles.metaList}>
              <View style={styles.metaRow}>
                <Skeleton width={60} height={14} borderRadius={4} />
                <Skeleton width={100} height={14} borderRadius={4} />
              </View>
              <View style={styles.metaRow}>
                <Skeleton width={60} height={14} borderRadius={4} />
                <Skeleton width={80} height={14} borderRadius={4} />
              </View>
            </View>
          </Card>

          {/* 프로젝트 소개 Skeleton */}
          <Card>
            <View style={styles.sectionHeader}>
              <Skeleton width={100} height={18} borderRadius={4} />
            </View>
            <View style={{ paddingHorizontal: 8, paddingBottom: 8, gap: 8 }}>
              <Skeleton width="100%" height={15} borderRadius={4} />
              <Skeleton width="90%" height={15} borderRadius={4} />
              <Skeleton width="70%" height={15} borderRadius={4} />
            </View>
          </Card>

          {/* 이미지 Skeleton */}
          <Card>
            <View style={styles.sectionHeader}>
              <Skeleton width={80} height={18} borderRadius={4} />
            </View>
            <Skeleton width="100%" height={200} borderRadius={12} style={{ marginHorizontal: 8 }} />
          </Card>
        </ScrollView>
      </View>
    );
  }

  if (!portfolio) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>📋</Text>
        <Text style={styles.errorText}>포트폴리오를 찾을 수 없습니다</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>돌아가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomNavHeight, paddingTop: 10 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* 기본 정보 카드 */}
        <Card>
          <View style={styles.sectionHeader}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{portfolio.category}</Text>
            </View>
            <Text style={styles.projectName}>{portfolio.projectName}</Text>
          </View>

          <View style={styles.metaList}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>클라이언트</Text>
              <Text style={styles.metaValue}>{portfolio.client}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>작업기간</Text>
              <Text style={styles.metaValue}>{portfolio.duration}</Text>
            </View>
          </View>
        </Card>

        {/* 프로젝트 소개 카드 */}
        <SectionCard title="프로젝트 소개">
          <SectionCard.Content>
            <Text style={styles.description}>{portfolio.detailedDescription}</Text>
          </SectionCard.Content>
          <SectionCard.Content>
            <View style={styles.tagsContainer}>
              {portfolio.tags.map((tag: string, index: number) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          </SectionCard.Content>
        </SectionCard>

        {/* 작업 이미지 카드 */}
        <Card>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>작업 이미지</Text>
          </View>
          <View style={styles.carouselWrapper}>
            <Carousel
              data={portfolio.images.slice(0, 10).map((image, index) => ({ id: index, url: image }))}
              renderItem={(item) => (
                <Image
                  source={{ uri: item.url }}
                  style={styles.galleryImage}
                  resizeMode="cover"
                  onError={() => {
                    console.warn(`Failed to load gallery image: ${item.url}`);
                  }}
                />
              )}
              itemWidth={CAROUSEL_ITEM_WIDTH}
              itemHeight={200}
              gap={16}
              autoPlay
              autoPlayInterval={4000}
            />
          </View>
        </Card>

        {/* 태그 카드 */}
        <SectionCard title="관련 태그">
          <SectionCard.Content>
            <View style={styles.tagsContainer}>
              {portfolio.tags.map((tag: string, index: number) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          </SectionCard.Content>
        </SectionCard>

        {/* 문의 버튼 카드 */}
        <Card>
          <TouchableOpacity style={styles.inquiryButton} onPress={handleInquiryPress}>
            <Text style={styles.inquiryButtonText}>견적받기</Text>
          </TouchableOpacity>
        </Card>
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

  // Section Header
  sectionHeader: {
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.grey900,
  },

  // Project Info
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.blue500,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },
  projectName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.grey900,
  },

  // Meta Info
  metaList: {
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.grey100,
  },
  metaLabel: {
    fontSize: 14,
    color: colors.grey600,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.grey900,
  },

  // Description
  description: {
    fontSize: 15,
    color: colors.grey700,
    lineHeight: 24,
    paddingHorizontal: 8,
    paddingBottom: 8,
  },

  // Carousel
  carouselWrapper: {
    marginHorizontal: 0, // Card padding(8px) 안쪽에 위치하여 양쪽 여백 생성
  },
  galleryImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: colors.grey200,
  },

  // Tags
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  tag: {
    backgroundColor: colors.blue50,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 13,
    color: colors.blue600,
    fontWeight: '500',
  },

  // Inquiry Button
  inquiryButton: {
    backgroundColor: colors.blue500,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 8,
    marginVertical: 8,
  },
  inquiryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },

  // Error State
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.greyBackground,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: colors.grey700,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: colors.blue500,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
});
