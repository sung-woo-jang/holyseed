import { ReservationStatus } from '@api/types';
import { EmptyState } from '@components/ui/empty-state';
import { createRoute } from '@granite-js/react-native';
import { useCancelReservation, useReservation } from '@hooks';
import { colors } from '@toss/tds-colors';
import { Asset, Skeleton } from '@toss/tds-react-native';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export const Route = createRoute('/my/reservations/:id' as any, {
  validateParams: (params: any) => params as { id: string },
  component: Page,
});

const STATUS_LABELS: Record<ReservationStatus, string> = {
  [ReservationStatus.PENDING]: '견적 대기',
  [ReservationStatus.CONFIRMED]: '견적 확정',
  [ReservationStatus.COMPLETED]: '시공 완료',
  [ReservationStatus.CANCELLED]: '예약 취소',
};

const STATUS_COLORS: Record<ReservationStatus, string> = {
  [ReservationStatus.PENDING]: colors.yellow500,
  [ReservationStatus.CONFIRMED]: colors.blue500,
  [ReservationStatus.COMPLETED]: colors.green500,
  [ReservationStatus.CANCELLED]: colors.grey400,
};

/**
 * 예약 상세보기 페이지
 */
function Page() {
  const navigation = Route.useNavigation();
  const params = Route.useParams() as { id: string } | undefined;
  const reservationId = Number(params?.id || 0);

  const { data: reservation, isLoading, error } = useReservation(reservationId);
  const cancelMutation = useCancelReservation();

  // 예약 취소 핸들러
  const handleCancel = () => {
    Alert.alert(
      '예약 취소',
      '예약을 취소하시겠습니까?\n취소된 예약은 복구할 수 없습니다.',
      [
        {
          text: '닫기',
          style: 'cancel',
        },
        {
          text: '취소하기',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelMutation.mutateAsync(reservationId);
              Alert.alert('예약 취소 완료', '예약이 취소되었습니다.', [
                {
                  text: '확인',
                  onPress: () => navigation.goBack(),
                },
              ]);
            } catch {
              Alert.alert('오류', '예약 취소 중 오류가 발생했습니다.');
            }
          },
        },
      ]
    );
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <View style={styles.container}>
        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Skeleton width={100} height={28} borderRadius={14} />
            <View style={{ height: 12 }} />
            <Skeleton width="60%" height={24} borderRadius={4} />
          </View>
          <View style={styles.section}>
            <Skeleton width={120} height={20} borderRadius={4} />
            <View style={{ height: 16 }} />
            {Array.from({ length: 5 }).map((_, i) => (
              <View key={i} style={styles.infoRow}>
                <Skeleton width={80} height={16} borderRadius={4} />
                <Skeleton width={120} height={16} borderRadius={4} />
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  // 에러 상태
  if (error || !reservation) {
    return (
      <View style={styles.container}>
        <EmptyState
          iconName="icon-alert-triangle"
          title="예약 정보를 불러올 수 없습니다"
          description="잠시 후 다시 시도해주세요"
          actionLabel="돌아가기"
          onActionPress={() => navigation.goBack()}
        />
      </View>
    );
  }

  const canCancel = reservation.status === ReservationStatus.CONFIRMED;
  const canReview =
    reservation.status === ReservationStatus.COMPLETED && !reservation.hasReview;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 상태 및 예약 번호 */}
        <View style={styles.section}>
          <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[reservation.status] }]}>
            <Text style={styles.statusText}>{STATUS_LABELS[reservation.status]}</Text>
          </View>
          <Text style={styles.reservationNumber}>예약번호: {reservation.reservationNumber}</Text>
        </View>

        {/* 서비스 정보 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>서비스 정보</Text>
          <View style={styles.serviceCard}>
            <Text style={styles.serviceName}>{reservation.service.title}</Text>
          </View>
        </View>

        {/* 견적 정보 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>견적 정보</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoLabel}>
                <Asset.Icon
                  name="icon-calendar-check-blue"
                  frameShape={Asset.frameShape.CleanW20}
                  color={colors.blue500}
                />
                <Text style={styles.infoLabelText}>견적 날짜</Text>
              </View>
              <Text style={styles.infoValue}>{reservation.estimateDate}</Text>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.infoLabel}>
                <Asset.Icon
                  name="icon-clock"
                  frameShape={Asset.frameShape.CleanW20}
                  color={colors.grey600}
                />
                <Text style={styles.infoLabelText}>견적 시간</Text>
              </View>
              <Text style={styles.infoValue}>{reservation.estimateTime}</Text>
            </View>
          </View>
        </View>

        {/* 시공 정보 (있는 경우) */}
        {reservation.constructionDate && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>시공 정보</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <View style={styles.infoLabel}>
                  <Asset.Icon
                    name="icon-calendar-check-blue"
                    frameShape={Asset.frameShape.CleanW20}
                    color={colors.green500}
                  />
                  <Text style={styles.infoLabelText}>시공 날짜</Text>
                </View>
                <Text style={styles.infoValue}>{reservation.constructionDate}</Text>
              </View>
              {reservation.constructionTime && (
                <View style={styles.infoRow}>
                  <View style={styles.infoLabel}>
                    <Asset.Icon
                      name="icon-clock"
                      frameShape={Asset.frameShape.CleanW20}
                      color={colors.grey600}
                    />
                    <Text style={styles.infoLabelText}>시공 시간</Text>
                  </View>
                  <Text style={styles.infoValue}>{reservation.constructionTime}</Text>
                </View>
              )}
              {!reservation.constructionTime && (
                <View style={styles.infoRow}>
                  <View style={styles.infoLabel}>
                    <Asset.Icon
                      name="icon-clock"
                      frameShape={Asset.frameShape.CleanW20}
                      color={colors.grey600}
                    />
                    <Text style={styles.infoLabelText}>시공 시간</Text>
                  </View>
                  <Text style={styles.infoValue}>하루 종일</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* 고객 정보 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>고객 정보</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoLabel}>
                <Asset.Icon
                  name="icon-user"
                  frameShape={Asset.frameShape.CleanW20}
                  color={colors.grey600}
                />
                <Text style={styles.infoLabelText}>이름</Text>
              </View>
              <Text style={styles.infoValue}>{reservation.customerName}</Text>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.infoLabel}>
                <Asset.Icon
                  name="icon-phone"
                  frameShape={Asset.frameShape.CleanW20}
                  color={colors.grey600}
                />
                <Text style={styles.infoLabelText}>연락처</Text>
              </View>
              <Text style={styles.infoValue}>{reservation.customerPhone}</Text>
            </View>
          </View>
        </View>

        {/* 주소 정보 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>주소 정보</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoLabel}>
                <Asset.Icon
                  name="icon-location"
                  frameShape={Asset.frameShape.CleanW20}
                  color={colors.grey600}
                />
                <Text style={styles.infoLabelText}>주소</Text>
              </View>
              <Text style={[styles.infoValue, styles.addressValue]}>{reservation.address}</Text>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.infoLabel}>
                <Asset.Icon
                  name="icon-location"
                  frameShape={Asset.frameShape.CleanW20}
                  color={colors.grey600}
                />
                <Text style={styles.infoLabelText}>상세주소</Text>
              </View>
              <Text style={styles.infoValue}>{reservation.detailAddress}</Text>
            </View>
          </View>
        </View>

        {/* 메모 (있는 경우) */}
        {reservation.memo && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>요청사항</Text>
            <View style={styles.memoCard}>
              <Text style={styles.memoText}>{reservation.memo}</Text>
            </View>
          </View>
        )}

        {/* 생성일 */}
        <View style={[styles.section, { borderBottomWidth: 0 }]}>
          <Text style={styles.createdAtText}>
            예약일: {new Date(reservation.createdAt).toLocaleDateString('ko-KR')}
          </Text>
        </View>
      </ScrollView>

      {/* 액션 버튼 */}
      <View style={styles.actionContainer}>
        {canCancel && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            disabled={cancelMutation.isPending}
          >
            <Text style={styles.cancelButtonText}>
              {cancelMutation.isPending ? '취소 중...' : '예약 취소'}
            </Text>
          </TouchableOpacity>
        )}
        {canReview && (
          <TouchableOpacity
            style={styles.reviewButton}
            onPress={() =>
              navigation.navigate('/reviews/write/:reservationId', {
                reservationId: String(reservationId),
              })
            }
          >
            <Text style={styles.reviewButtonText}>리뷰 작성</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.grey100,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginBottom: 8,
  },
  statusText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  reservationNumber: {
    fontSize: 16,
    color: colors.grey700,
    fontFamily: 'monospace',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.grey900,
    marginBottom: 16,
  },
  serviceCard: {
    backgroundColor: colors.blue50,
    borderRadius: 12,
    padding: 16,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.blue700,
  },
  infoCard: {
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  infoLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  infoLabelText: {
    fontSize: 15,
    color: colors.grey700,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.grey900,
    textAlign: 'right',
    flex: 1,
  },
  addressValue: {
    flex: 1.5,
  },
  memoCard: {
    backgroundColor: colors.grey50,
    borderRadius: 12,
    padding: 16,
  },
  memoText: {
    fontSize: 15,
    color: colors.grey800,
    lineHeight: 22,
  },
  createdAtText: {
    fontSize: 13,
    color: colors.grey500,
    textAlign: 'center',
  },
  actionContainer: {
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.grey200,
    gap: 12,
  },
  cancelButton: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.red500,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.red500,
    fontSize: 16,
    fontWeight: '600',
  },
  reviewButton: {
    backgroundColor: colors.blue500,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  reviewButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
