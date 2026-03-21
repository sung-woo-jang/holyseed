import { createRoute } from '@granite-js/react-native';
import { useBottomNavHeight } from '@hooks';
import { colors } from '@toss/tds-colors';
import { Asset, TextField } from '@toss/tds-react-native';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export const Route = createRoute('/reviews/write/:reservationId', {
  validateParams: (params) => params as { reservationId: string },
  component: Page,
});

interface ReservationInfo {
  id: string;
  serviceName: string;
  date: string;
}

// Mock 데이터
const MOCK_RESERVATION: Record<string, ReservationInfo> = {
  '1': {
    id: '1',
    serviceName: '아파트 전체 리모델링',
    date: '2024-12-01',
  },
  '2': {
    id: '2',
    serviceName: '주방 리모델링',
    date: '2024-11-25',
  },
};

/**
 * 리뷰 작성 페이지
 *
 * 필요한 API 연결:
 * 1. GET /api/reservations/{id} - 예약 정보 조회
 * 2. POST /api/reviews - 리뷰 작성
 */
function Page() {
  const navigation = Route.useNavigation();
  const params = Route.useParams();
  const bottomNavHeight = useBottomNavHeight();
  const reservation = MOCK_RESERVATION[params?.reservationId || '1'];

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!reservation) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>예약 정보를 찾을 수 없습니다.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>돌아가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('알림', '별점을 선택해주세요.');
      return;
    }

    if (comment.trim().length < 10) {
      Alert.alert('알림', '리뷰 내용을 10자 이상 입력해주세요.');
      return;
    }

    setIsSubmitting(true);

    // API 호출 시뮬레이션
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert('완료', '리뷰가 등록되었습니다.', [
        {
          text: '확인',
          onPress: () => navigation.goBack(),
        },
      ]);
    }, 1000);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: bottomNavHeight, paddingTop: 10 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.title}>리뷰 작성</Text>
          <Text style={styles.subtitle}>서비스 이용 경험을 공유해주세요</Text>
        </View>

        {/* 서비스 정보 */}
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceLabel}>서비스</Text>
          <Text style={styles.serviceName}>{reservation.serviceName}</Text>
          <Text style={styles.serviceDate}>이용일: {reservation.date}</Text>
        </View>

        {/* 별점 선택 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            별점 선택 <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.ratingContainer}>
            {Array.from({ length: 5 }).map((_, index) => (
              <TouchableOpacity key={index} onPress={() => setRating(index + 1)} style={styles.starButton}>
                <Asset.Icon
                  name="icon-star-mono"
                  color={index < rating ? colors.yellow500 : colors.grey300}
                  frameShape={Asset.frameShape.CleanW40}
                />
              </TouchableOpacity>
            ))}
          </View>
          {rating > 0 && (
            <Text style={styles.ratingText}>
              {rating === 1 && '별로예요'}
              {rating === 2 && '그저 그래요'}
              {rating === 3 && '보통이에요'}
              {rating === 4 && '만족해요'}
              {rating === 5 && '아주 좋아요'}
            </Text>
          )}
        </View>

        {/* 리뷰 내용 */}
        <View style={styles.section}>
          <TextField
            variant="box"
            label="리뷰 내용 *"
            placeholder="서비스 이용 경험을 자세히 작성해주세요 (최소 10자)"
            multiline
            numberOfLines={6}
            value={comment}
            onChangeText={setComment}
            maxLength={500}
          />
          <Text style={styles.charCount}>{comment.length} / 500자</Text>
        </View>

        {/* 안내 사항 */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>💡 리뷰 작성 안내</Text>
          <Text style={styles.infoText}>• 작성된 리뷰는 서비스 품질 향상에 활용됩니다.</Text>
          <Text style={styles.infoText}>• 욕설, 비방 등 부적절한 내용은 관리자에 의해 삭제될 수 있습니다.</Text>
          <Text style={styles.infoText}>• 리뷰 작성 후에는 수정이 불가능합니다.</Text>
        </View>
      </ScrollView>

      {/* 제출 버튼 */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, (rating === 0 || comment.trim().length < 10) && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting || rating === 0 || comment.trim().length < 10}
        >
          <Text style={styles.submitButtonText}>{isSubmitting ? '제출 중...' : '리뷰 등록'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
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
  serviceInfo: {
    backgroundColor: 'white',
    padding: 20,
    marginTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.grey200,
  },
  serviceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.grey500,
    marginBottom: 6,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.grey900,
    marginBottom: 4,
  },
  serviceDate: {
    fontSize: 14,
    color: colors.grey600,
  },
  section: {
    backgroundColor: 'white',
    padding: 20,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.grey900,
    marginBottom: 16,
  },
  required: {
    color: colors.red500,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.grey700,
    textAlign: 'center',
  },
  charCount: {
    fontSize: 12,
    color: colors.grey500,
    textAlign: 'right',
    marginTop: 8,
  },
  infoBox: {
    backgroundColor: colors.blue50,
    borderRadius: 12,
    padding: 16,
    margin: 20,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.grey900,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: colors.grey700,
    lineHeight: 20,
    marginBottom: 4,
  },
  footer: {
    padding: 16,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: colors.grey200,
  },
  submitButton: {
    backgroundColor: colors.blue500,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: colors.grey300,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.background,
  },
  errorText: {
    fontSize: 16,
    color: colors.grey700,
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: colors.blue500,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
