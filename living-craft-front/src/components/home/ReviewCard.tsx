import { Review } from '@api/types';
import { colors } from '@toss/tds-colors';
import { Asset } from '@toss/tds-react-native';
import { StyleSheet, Text, View } from 'react-native';

interface ReviewCardProps {
  /** 리뷰 데이터 */
  review: Review;
}

/**
 * 리뷰 카드 컴포넌트
 * 고객 정보, 별점, 리뷰 내용을 표시
 */
export const ReviewCard = ({ review }: ReviewCardProps) => {
  const renderStars = (rating: number) => {
    return (
      <View style={styles.stars}>
        {Array.from({ length: 5 }).map((_, index) => (
          <Asset.Icon
            key={index}
            name="icon-star-mono"
            color={index < rating ? colors.yellow500 : colors.grey300}
            frameShape={Asset.frameShape.CleanW24}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{review.customer.name[0]}</Text>
        </View>
        <View style={styles.authorInfo}>
          <Text style={styles.authorName}>{review.customer.name}</Text>
          <Text style={styles.service}>{review.service.title}</Text>
        </View>
      </View>
      {renderStars(review.rating)}
      <Text style={styles.content}>{review.comment}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.blue100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.blue500,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.grey900,
    marginBottom: 2,
  },
  service: {
    fontSize: 13,
    color: colors.grey600,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 12,
  },
  content: {
    fontSize: 15,
    color: colors.grey700,
    lineHeight: 22,
  },
});
