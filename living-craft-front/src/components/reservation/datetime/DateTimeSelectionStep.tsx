import { Card } from '@components/ui';
import { CalendarBottomSheet } from '@components/ui/calendar-bottom-sheet';
import { formatDateToString, parseStringToDate } from '@components/ui/calendar-bottom-sheet/utils';
import { useAvailableDates, useAvailableTimes } from '@hooks';
import { useReservationStore } from '@store';
import { colors } from '@toss/tds-colors';
import { Asset, Skeleton } from '@toss/tds-react-native';
import { ReservationFormData } from '@types';
import { useMemo, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface DateTimeSelectionStepProps {
  /**
   * ScrollView로 감쌀지 여부 (기존 페이지 호환용)
   * @default true
   */
  withScrollView?: boolean;
}

/**
 * 날짜/시간 선택 단계
 *
 * 고객은 견적 문의 날짜/시간만 선택합니다.
 * 시공 일정은 견적 방문 후 관리자가 백오피스에서 지정합니다.
 */

export function DateTimeSelectionStep({ withScrollView = true }: DateTimeSelectionStepProps) {
  const { watch, setValue } = useFormContext<ReservationFormData>();
  const { isEstimateCalendarVisible, update } = useReservationStore(['isEstimateCalendarVisible', 'update']);

  const selectedService = watch('service');
  // 견적 날짜/시간
  const estimateDate = watch('estimateDate');
  const estimateTimeSlot = watch('estimateTimeSlot');

  // 캘린더에서 현재 보고 있는 월 상태
  const [estimateCalendarMonth, setEstimateCalendarMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });

  // 월별 예약 가능 날짜 조회 (캘린더에서 불가 날짜 표시용)
  const { data: estimateDatesData } = useAvailableDates(
    selectedService?.id ?? 0,
    estimateCalendarMonth.year,
    estimateCalendarMonth.month,
    'estimate',
    !!selectedService?.id && isEstimateCalendarVisible
  );

  // 불가 날짜를 Date[] 형식으로 변환 (캘린더 컴포넌트용)
  // 주의: new Date("YYYY-MM-DD")는 UTC 기준으로 파싱되어 시간대 문제 발생
  //       parseStringToDate를 사용하면 로컬 시간대 기준으로 파싱됨
  const estimateDisabledDates = useMemo(() => {
    if (!estimateDatesData?.unavailableDates) return [];
    return estimateDatesData.unavailableDates
      .map((d) => parseStringToDate(d.date))
      .filter((d): d is Date => d !== null);
  }, [estimateDatesData]);

  // 예약 가능 최대 날짜 (로컬 시간대 기준으로 파싱)
  const estimateMaxDate = useMemo(() => {
    if (!estimateDatesData?.maxDate) return undefined;
    return parseStringToDate(estimateDatesData.maxDate) ?? undefined;
  }, [estimateDatesData]);

  // API로 예약 가능 시간 조회
  const { data: estimateTimesResponse, isLoading: isLoadingEstimateTimes } = useAvailableTimes(
    selectedService?.id ?? 0,
    estimateDate,
    'estimate',
    !!selectedService?.id && !!estimateDate
  );

  // 견적 날짜 선택 핸들러
  const handleEstimateDateConfirm = (date: Date) => {
    const dateString = formatDateToString(date);
    setValue('estimateDate', dateString);
    setValue('estimateTimeSlot', null);
    update({ isEstimateCalendarVisible: false });
  };

  const content = (
    // 견적 희망 날짜/시간 섹션
    <Card>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>견적 희망 날짜/시간</Text>
        <Text style={styles.sectionSubtitle}>견적을 받고 싶은 날짜와 시간을 선택해주세요</Text>
      </View>

      {/* 견적 날짜 선택 */}
      <TouchableOpacity style={styles.dateInputButton} onPress={() => update({ isEstimateCalendarVisible: true })}>
        <Text style={estimateDate ? styles.dateInputTextSelected : styles.dateInputText}>
          {estimateDate || '날짜를 선택해주세요'}
        </Text>
      </TouchableOpacity>

      {/* 견적 시간 선택 */}
      {estimateDate && (
        <View style={styles.timeSlotSection}>
          <Text style={styles.timeSlotLabel}>시간 선택</Text>
          {isLoadingEstimateTimes ? (
            <View style={styles.timeSlotGrid}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} width={72} height={44} />
              ))}
            </View>
          ) : estimateTimesResponse?.isAvailable === false ? (
            <View style={styles.unavailableNotice}>
              <Text style={styles.unavailableText}>
                {estimateTimesResponse?.reason || '예약이 불가능한 날짜입니다.'}
              </Text>
            </View>
          ) : (
            <View style={styles.timeSlotGrid}>
              {estimateTimesResponse?.times?.map((slot) => (
                <TouchableOpacity
                  key={slot.time}
                  style={[
                    styles.timeSlot,
                    estimateTimeSlot?.time === slot.time && styles.timeSlotSelected,
                    !slot.available && styles.timeSlotDisabled,
                  ]}
                  onPress={() => slot.available && setValue('estimateTimeSlot', slot)}
                  disabled={!slot.available}
                >
                  <Text
                    style={[
                      styles.timeSlotText,
                      estimateTimeSlot?.time === slot.time && styles.timeSlotTextSelected,
                      !slot.available && styles.timeSlotTextDisabled,
                    ]}
                  >
                    {slot.time}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}

      {/* 시공 일정 안내 */}
      {estimateTimeSlot && (
        <View style={styles.constructionNotice}>
          <View style={styles.constructionNoticeIconWrapper}>
            <Asset.Icon name="icon-info-circle-fill" color={colors.blue600} frameShape={Asset.frameShape.CleanW24} />
          </View>
          <View style={styles.constructionNoticeTextContainer}>
            <Text style={styles.constructionNoticeTitle}>시공 일정 안내</Text>
            <Text style={styles.constructionNoticeDescription}>
              시공 일정은 견적 방문 후 상담을 통해 확정됩니다.{'\n'}
              견적 방문 시 작업 범위와 일정을 함께 조율해 드립니다.
            </Text>
          </View>
        </View>
      )}
    </Card>
  );

  return (
    <>
      {withScrollView ? (
        <ScrollView style={styles.stepContent} contentContainerStyle={styles.scrollContent}>
          {content}
        </ScrollView>
      ) : (
        <View style={styles.stepContentNoScroll}>{content}</View>
      )}

      {/* 견적 캘린더 */}
      <CalendarBottomSheet
        visible={isEstimateCalendarVisible}
        selectedDate={parseStringToDate(estimateDate)}
        minDate={new Date()} // 오늘 이후만 선택 가능
        maxDate={estimateMaxDate}
        disabledDates={estimateDisabledDates}
        title="견적 희망 날짜 선택"
        confirmButtonText="날짜 선택"
        onConfirm={handleEstimateDateConfirm}
        onClose={() => update({ isEstimateCalendarVisible: false })}
        onMonthChange={(year, month) => setEstimateCalendarMonth({ year, month })}
      />
    </>
  );
}

const styles = StyleSheet.create({
  stepContent: {
    flex: 1,
  },
  stepContentNoScroll: {
    paddingVertical: 10,
  },
  scrollContent: {
    paddingVertical: 10,
  },
  sectionHeader: {
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.grey900,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.grey600,
  },
  dateInputButton: {
    backgroundColor: colors.grey50,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 8,
    marginBottom: 8,
  },
  dateInputText: {
    fontSize: 15,
    color: colors.grey400,
  },
  dateInputTextSelected: {
    fontSize: 15,
    color: colors.grey900,
  },
  timeSlotSection: {
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  timeSlotLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.grey700,
    marginBottom: 8,
  },
  timeSlotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlot: {
    width: '31%',
    backgroundColor: colors.grey50,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  timeSlotSelected: {
    backgroundColor: colors.blue500,
  },
  timeSlotDisabled: {
    backgroundColor: colors.grey100,
  },
  timeSlotText: {
    fontSize: 14,
    color: colors.grey900,
    fontWeight: '500',
  },
  timeSlotTextSelected: {
    color: colors.white,
  },
  timeSlotTextDisabled: {
    color: colors.grey400,
  },
  unavailableNotice: {
    backgroundColor: colors.grey100,
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  unavailableText: {
    fontSize: 14,
    color: colors.grey500,
  },
  constructionNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: colors.blue50,
    marginHorizontal: 8,
    marginVertical: 8,
    borderRadius: 8,
  },
  constructionNoticeIconWrapper: {
    marginTop: 2,
  },
  constructionNoticeTextContainer: {
    flex: 1,
  },
  constructionNoticeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.blue900,
    marginBottom: 4,
  },
  constructionNoticeDescription: {
    fontSize: 14,
    color: colors.blue800,
    lineHeight: 20,
  },
});
