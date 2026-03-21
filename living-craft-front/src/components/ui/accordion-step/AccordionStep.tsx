import { colors } from '@toss/tds-colors';
import { Button } from '@toss/tds-react-native';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, UIManager, View } from 'react-native';

import { Card } from '../card';
import { StatusIcon } from './StatusIcon';
import { StepBadge } from './StepBadge';
import type { StepKey, StepStatus } from './types';

// Android에서 LayoutAnimation 활성화
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface AccordionStepProps {
  /**
   * 단계 키 (store 연동용)
   */
  stepKey: StepKey;
  /**
   * 단계 번호 (1부터 시작)
   */
  stepNumber: number;
  /**
   * 단계 제목
   */
  title: string;
  /**
   * 단계 상태
   */
  status: StepStatus;
  /**
   * 펼쳐진 상태인지 여부
   */
  isExpanded: boolean;
  /**
   * 접힌 상태에서 표시할 요약 정보
   */
  summaryContent?: React.ReactNode;
  /**
   * 펼쳐진 상태에서 표시할 본문 내용
   */
  children: React.ReactNode;
  /**
   * 펼침/접힘 토글 핸들러
   */
  onToggle: () => void;
  /**
   * 단계 완료 핸들러 (다음 단계로 이동)
   * confirmation 단계에서는 사용되지 않음
   */
  onComplete?: () => void;
  /**
   * 완료 버튼 비활성화 여부
   */
  isCompleteDisabled?: boolean;
  /**
   * 완료 버튼 텍스트 (기본값: "다음 단계")
   */
  completeButtonText?: string;
  /**
   * 완료 버튼 숨김 여부 (자동 전환 사용 시)
   */
  hideCompleteButton?: boolean;
}

/**
 * Accordion 형태의 단계 컴포넌트
 *
 * 예약 플로우에서 각 단계를 표시하며, 펼침/접힘 상태를 관리합니다.
 * - 잠금 상태: 탭 불가, 잠금 아이콘 표시
 * - 활성 상태: 펼침/접힘 가능, 본문 및 완료 버튼 표시
 * - 완료 상태: 펼침/접힘 가능, 요약 정보 표시 (접힌 상태)
 *
 * @example
 * ```tsx
 * <AccordionStep
 *   stepKey="service"
 *   stepNumber={1}
 *   title="서비스 선택"
 *   status="active"
 *   isExpanded={true}
 *   summaryContent={<ServiceSummary />}
 *   onToggle={() => toggleStep('service')}
 *   onComplete={() => completeStep('service')}
 * >
 *   <ServiceSelectionStep />
 * </AccordionStep>
 * ```
 */
export function AccordionStep({
  stepKey,
  stepNumber,
  title,
  status,
  isExpanded,
  summaryContent,
  children,
  onToggle,
  onComplete,
  isCompleteDisabled = false,
  completeButtonText = '다음 단계',
  hideCompleteButton = false,
}: AccordionStepProps) {
  const isLocked = status === 'locked';
  const showSummary = !isExpanded && status === 'completed' && summaryContent;
  const showCompleteButton = stepKey !== 'confirmation' && onComplete && !hideCompleteButton;

  const handleToggle = () => {
    if (isLocked) return;
    onToggle();
  };

  return (
    <View style={styles.container}>
      <Card
        style={{
          paddingVertical: 0,
          paddingHorizontal: 0,
        }}
      >
        {/* 헤더 (항상 표시) */}
        <TouchableOpacity onPress={handleToggle} disabled={isLocked} activeOpacity={0.7} style={styles.header}>
          <View style={styles.headerLeft}>
            <StepBadge number={stepNumber} status={status} />
            <Text
              style={[styles.title, isLocked && styles.titleLocked, status === 'completed' && styles.titleCompleted]}
            >
              {title}
            </Text>
          </View>
          <StatusIcon status={status} isExpanded={isExpanded} />
        </TouchableOpacity>

        {/* 요약 정보 (접힌 상태 + 완료된 경우) */}
        {showSummary && <View style={styles.summaryContainer}>{summaryContent}</View>}

        {/* 본문 (펼침 상태에서만 렌더링) */}
        {isExpanded && (
          <View style={styles.content}>
            {children}

            {/* 완료 버튼 (마지막 단계 제외) */}
            {showCompleteButton && (
              <View style={styles.completeButtonContainer}>
                <Button
                  display="full"
                  containerStyle={styles.completeButton}
                  disabled={isCompleteDisabled}
                  onPress={onComplete}
                >
                  {completeButtonText}
                </Button>
              </View>
            )}
          </View>
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.grey900,
    marginLeft: 12,
  },
  titleLocked: {
    color: colors.grey400,
  },
  titleCompleted: {
    color: colors.blue500,
  },
  summaryContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: colors.grey100,
  },
  content: {
    borderTopWidth: 1,
    borderTopColor: colors.grey100,
  },
  completeButtonContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.grey100,
  },
  completeButton: {
    borderRadius: 8,
  },
});
