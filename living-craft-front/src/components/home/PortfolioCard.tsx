import { Portfolio } from '@api/types';
import { Image } from '@granite-js/react-native';
import { colors } from '@toss/tds-colors';
import { Badge } from '@toss/tds-react-native';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface PortfolioCardProps {
  /** 포트폴리오 데이터 */
  portfolio: Portfolio;
  /** 클릭 핸들러 */
  onPress: (portfolioId: number) => void;
}

/**
 * 포트폴리오 카드 컴포넌트
 * TDS Shadow를 적용하여 깊이감 있는 디자인
 */
export const PortfolioCard = ({ portfolio, onPress }: PortfolioCardProps) => {
  const imageUrl = portfolio.images[0];

  // 디버깅을 위한 로그
  console.log('PortfolioCard:', {
    id: portfolio.id,
    imageUrl,
    imagesLength: portfolio.images.length
  });

  return (
    <TouchableOpacity onPress={() => onPress(portfolio.id)} activeOpacity={0.8}>
      <View style={styles.card}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            resizeMode="cover"
            onError={() => {
              console.warn(`Failed to load home portfolio image: ${portfolio.id}`);
            }}
            onLoad={() => {
              console.log(`Image loaded successfully: ${portfolio.id}`);
            }}
          />
        ) : (
          <View style={[styles.image, styles.placeholderImage]}>
            <Text style={styles.placeholderText}>이미지 없음</Text>
          </View>
        )}
        <View style={styles.content}>
          <Badge type="blue" size="small" badgeStyle="weak">
            {portfolio.category}
          </Badge>
          <Text style={styles.title}>{portfolio.projectName}</Text>
          <Text style={styles.description} numberOfLines={2}>
            {portfolio.description}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.grey200,
    // iOS shadow
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  image: {
    width: '100%',
    height: 180,
    backgroundColor: colors.grey100,
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 14,
    color: colors.grey500,
  },
  content: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.grey900,
    marginTop: 8,
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    color: colors.grey500,
    lineHeight: 20,
  },
});
