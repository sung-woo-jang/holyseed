import { Portfolio } from '@api/types';
import { Image } from '@granite-js/react-native';
import { colors } from '@toss/tds-colors';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface PortfolioListItemProps {
  /** 포트폴리오 데이터 */
  portfolio: Portfolio;
  /** 클릭 핸들러 */
  onPress: (portfolioId: number) => void;
  /** 하단 보더 표시 여부 */
  showBorder?: boolean;
}

/**
 * 포트폴리오 리스트 아이템
 * 썸네일, 카테고리, 프로젝트명, 설명, 작업기간 등을 표시
 */
export const PortfolioListItem = ({ portfolio, onPress, showBorder = false }: PortfolioListItemProps) => {
  return (
    <TouchableOpacity style={[styles.container, showBorder && styles.containerBorder]} onPress={() => onPress(portfolio.id)}>
      <Image
        source={{ uri: portfolio.images[0] || undefined }}
        style={styles.thumbnail}
        onError={() => {
          console.warn(`Failed to load portfolio thumbnail: ${portfolio.id}`);
        }}
      />

      <View style={styles.info}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{portfolio.category}</Text>
        </View>
        <Text style={styles.title}>{portfolio.projectName}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {portfolio.description}
        </Text>
        {portfolio.duration ? <Text style={styles.duration}>{portfolio.duration}</Text> : null}
      </View>

      <View style={styles.arrowIcon}>
        <Text style={styles.arrowText}>›</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  containerBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.grey100,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: colors.grey200,
    marginRight: 16,
  },
  info: {
    flex: 1,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.blue50,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 6,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.blue600,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.grey900,
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: colors.grey600,
    lineHeight: 18,
    marginBottom: 4,
  },
  duration: {
    fontSize: 12,
    color: colors.grey400,
  },
  arrowIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    fontSize: 20,
    color: colors.grey400,
  },
});
