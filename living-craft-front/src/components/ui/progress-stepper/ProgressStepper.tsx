import { colors } from '@toss/tds-colors';
import { LinearGradient } from '@toss/tds-react-native';
import type { ReactElement } from 'react';
import { Children } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { ProgressStepProps } from './ProgressStep';

// ============================================================================
// Types
// ============================================================================

type Variant = 'compact' | 'icon';
type PaddingTop = 'default' | 'wide';
type StepStatus = 'completed' | 'active' | 'pending';

interface ProgressStepperProps {
  /**
   * 표시 스타일
   * - compact: 프로그레스 바 + 타이틀만 표시하는 간결한 스타일
   * - icon: 아이콘 + 타이틀 + 연결선을 표시하는 상세 스타일
   * @default 'compact'
   */
  variant?: Variant;

  /**
   * 상단 여백 제어
   * - default: 16px
   * - wide: 24px
   * @default 'default'
   */
  paddingTop?: PaddingTop;

  /**
   * 현재 활성화된 스텝의 인덱스 (0부터 시작)
   * @default 0
   */
  activeStepIndex?: number;

  /**
   * 완료된 스텝에 체크 표시를 할지 여부
   * @default false
   */
  checkForFinish?: boolean;

  /**
   * ProgressStep 컴포넌트들
   */
  children: ReactElement<ProgressStepProps> | ReactElement<ProgressStepProps>[];
}

// ============================================================================
// Style Constants (Figma 기준)
// ============================================================================

const COLORS = {
  progressBarBg: '#EDEFF2',
  progressBarFillStart: 'rgba(49, 130, 246, 0.2)', // 연한 파란색
  progressBarFillEnd: '#3182F6', // Blue500
  indicatorOuter: 'rgba(49, 130, 246, 0.2)',
  indicatorInner: '#3182F6',
  titleActive: '#333D48',
  titlePending: '#6B7684',
  border: 'rgba(2, 32, 71, 0.05)',
  white: '#FFFFFF',
  iconBg: '#F4F6F8',
  iconBorder: '#E5E8EB',
};

// 그라데이션 색상 배열
const GRADIENT_COLORS = [COLORS.progressBarFillStart, COLORS.progressBarFillEnd];

const DIMENSIONS = {
  progressBarHeight: 8,
  indicatorSize: 8,
  indicatorOuterSize: 16,
  borderRadius: 40,
  iconContainerSize: 32,
  stepBadgeSize: 24, // 숫자 뱃지 크기
};

// ============================================================================
// Helper Functions
// ============================================================================

const getStepStatus = (index: number, activeStepIndex: number): StepStatus => {
  if (index < activeStepIndex) return 'completed';
  if (index === activeStepIndex) return 'active';
  return 'pending';
};

// ============================================================================
// Check Icon Component
// ============================================================================

const CheckIcon = () => (
  <View style={iconStyles.checkIconContainer}>
    <View style={iconStyles.checkIconLine1} />
    <View style={iconStyles.checkIconLine2} />
  </View>
);

const iconStyles = StyleSheet.create({
  checkIconContainer: {
    width: 10,
    height: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIconLine1: {
    position: 'absolute',
    width: 3.5,
    height: 1.5,
    backgroundColor: COLORS.white,
    transform: [{ rotate: '45deg' }],
    left: 0.5,
    top: 5.5,
  },
  checkIconLine2: {
    position: 'absolute',
    width: 6.5,
    height: 1.5,
    backgroundColor: COLORS.white,
    transform: [{ rotate: '-45deg' }],
    right: -0.5,
    top: 4,
  },
});

// ============================================================================
// Compact Variant Component
// ============================================================================

interface CompactVariantProps {
  steps: ProgressStepProps[];
  activeStepIndex: number;
  checkForFinish: boolean;
}

const CompactVariant = ({ steps, activeStepIndex, checkForFinish }: CompactVariantProps) => {
  const totalSteps = steps.length;
  const progressPercentage = totalSteps > 1 ? (activeStepIndex / (totalSteps - 1)) * 100 : 0;

  return (
    <View style={compactStyles.container}>
      {/* 프로그레스 바 */}
      <View style={compactStyles.progressBarContainer}>
        <View style={compactStyles.progressBarBackground}>
          <View style={[compactStyles.progressBarFill, { width: `${progressPercentage}%` }]}>
            <LinearGradient
              key={`gradient-${activeStepIndex}`}
              colors={GRADIENT_COLORS}
              degree="90deg"
              easing="linear"
              style={compactStyles.gradient}
            />
          </View>
        </View>
      </View>

      {/* 숫자 뱃지 행 */}
      <View style={compactStyles.badgeRow}>
        {steps.map((_, index) => {
          const status = getStepStatus(index, activeStepIndex);
          const showCheckmark = checkForFinish && status === 'completed';
          const isActive = status === 'active';
          const isCompleted = status === 'completed';

          return (
            <View key={index} style={compactStyles.badgeWrapper}>
              <View
                style={[
                  compactStyles.badge,
                  isCompleted && compactStyles.badgeCompleted,
                  isActive && compactStyles.badgeActive,
                  status === 'pending' && compactStyles.badgePending,
                ]}
              >
                {showCheckmark ? (
                  <CheckIcon />
                ) : (
                  <Text
                    style={[
                      compactStyles.badgeText,
                      (isCompleted || isActive) && compactStyles.badgeTextActive,
                      status === 'pending' && compactStyles.badgeTextPending,
                    ]}
                  >
                    {index + 1}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* 타이틀 행 */}
      <View style={compactStyles.titleRow}>
        {steps.map((step, index) => {
          const status = getStepStatus(index, activeStepIndex);

          return (
            <View key={index} style={compactStyles.titleWrapper}>
              <Text
                style={[
                  compactStyles.stepTitle,
                  status !== 'pending' && compactStyles.stepTitleActive,
                  status === 'pending' && compactStyles.stepTitlePending,
                ]}
                numberOfLines={1}
              >
                {step.title}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const compactStyles = StyleSheet.create({
  container: {
    position: 'relative',
  },

  // 프로그레스 바 (뱃지 중앙을 연결)
  progressBarContainer: {
    position: 'absolute',
    top: DIMENSIONS.stepBadgeSize / 2 - DIMENSIONS.progressBarHeight / 2,
    left: DIMENSIONS.stepBadgeSize / 2,
    right: DIMENSIONS.stepBadgeSize / 2,
    height: DIMENSIONS.progressBarHeight,
    zIndex: 0,
  },
  progressBarBackground: {
    flex: 1,
    backgroundColor: COLORS.progressBarBg,
    borderRadius: DIMENSIONS.borderRadius,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: DIMENSIONS.borderRadius,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
  },

  // 숫자 뱃지 행
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1,
  },
  badgeWrapper: {
    alignItems: 'center',
  },
  badge: {
    width: DIMENSIONS.stepBadgeSize,
    height: DIMENSIONS.stepBadgeSize,
    borderRadius: DIMENSIONS.stepBadgeSize / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  badgeCompleted: {
    backgroundColor: COLORS.indicatorInner,
  },
  badgeActive: {
    backgroundColor: COLORS.indicatorInner,
    shadowColor: COLORS.indicatorInner,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  badgePending: {
    backgroundColor: COLORS.iconBg,
    borderColor: COLORS.iconBorder,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  badgeTextActive: {
    color: COLORS.white,
  },
  badgeTextPending: {
    color: COLORS.titlePending,
  },

  // 타이틀 행
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  titleWrapper: {
    alignItems: 'center',
    width: 60,
  },
  stepTitle: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  stepTitleActive: {
    fontWeight: '700',
    color: COLORS.titleActive,
  },
  stepTitlePending: {
    fontWeight: '600',
    color: COLORS.titlePending,
  },
});

// ============================================================================
// Icon Variant Component
// ============================================================================

interface IconVariantProps {
  steps: ProgressStepProps[];
  activeStepIndex: number;
  checkForFinish: boolean;
}

const IconVariant = ({ steps, activeStepIndex, checkForFinish }: IconVariantProps) => {
  const totalSteps = steps.length;
  const progressPercentage = totalSteps > 1 ? (activeStepIndex / (totalSteps - 1)) * 100 : 0;

  return (
    <View style={iconVariantStyles.container}>
      {/* 연결선 (배경) */}
      <View style={iconVariantStyles.connectionLineContainer}>
        <View style={iconVariantStyles.connectionLineBg} />
        <View style={[iconVariantStyles.connectionLineFill, { width: `${progressPercentage}%` }]}>
          <LinearGradient colors={GRADIENT_COLORS} degree="90deg" easing="linear" style={iconVariantStyles.gradient} />
        </View>
      </View>

      {/* 스텝 아이템들 */}
      <View style={iconVariantStyles.stepsRow}>
        {steps.map((step, index) => {
          const status = getStepStatus(index, activeStepIndex);
          const showCheckmark = checkForFinish && status === 'completed';

          return (
            <View key={index} style={iconVariantStyles.stepItem}>
              {/* 아이콘 컨테이너 */}
              <View
                style={[
                  iconVariantStyles.iconWrapper,
                  status === 'active' && iconVariantStyles.iconWrapperActive,
                  status === 'completed' && iconVariantStyles.iconWrapperCompleted,
                  status === 'pending' && iconVariantStyles.iconWrapperPending,
                ]}
              >
                {showCheckmark ? (
                  <CheckIcon />
                ) : step.icon ? (
                  <View style={iconVariantStyles.customIconWrapper}>{step.icon}</View>
                ) : (
                  <View style={iconVariantStyles.dotIndicator} />
                )}
              </View>

              {/* 타이틀 */}
              {step.title && (
                <Text
                  style={[
                    iconVariantStyles.stepTitle,
                    status !== 'pending' && iconVariantStyles.stepTitleActive,
                    status === 'pending' && iconVariantStyles.stepTitlePending,
                  ]}
                  numberOfLines={1}
                >
                  {step.title}
                </Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
};

const iconVariantStyles = StyleSheet.create({
  container: {
    position: 'relative',
  },

  // 연결선
  connectionLineContainer: {
    position: 'absolute',
    top: DIMENSIONS.iconContainerSize / 2 - 1,
    left: DIMENSIONS.iconContainerSize / 2,
    right: DIMENSIONS.iconContainerSize / 2,
    height: 2,
  },
  connectionLineBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: COLORS.progressBarBg,
    borderRadius: 1,
  },
  connectionLineFill: {
    position: 'absolute',
    left: 0,
    height: 2,
    borderRadius: 1,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
  },

  // 스텝 아이템들
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },

  // 아이콘 래퍼
  iconWrapper: {
    width: DIMENSIONS.iconContainerSize,
    height: DIMENSIONS.iconContainerSize,
    borderRadius: DIMENSIONS.iconContainerSize / 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  iconWrapperActive: {
    backgroundColor: COLORS.indicatorInner,
    shadowColor: COLORS.indicatorInner,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  iconWrapperCompleted: {
    backgroundColor: COLORS.indicatorInner,
  },
  iconWrapperPending: {
    backgroundColor: COLORS.iconBg,
    borderWidth: 1,
    borderColor: COLORS.iconBorder,
  },

  customIconWrapper: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  dotIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.white,
  },

  // 타이틀
  stepTitle: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 80,
  },
  stepTitleActive: {
    fontWeight: '700',
    color: COLORS.titleActive,
  },
  stepTitlePending: {
    fontWeight: '600',
    color: COLORS.titlePending,
  },
});

// ============================================================================
// Main Component
// ============================================================================

/**
 * Toss ProgressStepper 컴포넌트
 *
 * 단계별 작업 진행 상황을 프로그레스 바와 스텝으로 시각적으로 표시합니다.
 * 사용자가 현재 어느 단계에 있는지, 앞으로 남은 단계는 무엇인지 명확하게 보여줍니다.
 *
 * @example
 * ```tsx
 * // Compact variant (기본)
 * <ProgressStepper activeStepIndex={1}>
 *   <ProgressStep title="서비스" />
 *   <ProgressStep title="날짜/시간" />
 *   <ProgressStep title="정보입력" />
 *   <ProgressStep title="확인" />
 * </ProgressStepper>
 *
 * // Icon variant
 * <ProgressStepper variant="icon" activeStepIndex={1} checkForFinish>
 *   <ProgressStep title="서비스" icon={<ServiceIcon />} />
 *   <ProgressStep title="날짜/시간" icon={<CalendarIcon />} />
 * </ProgressStepper>
 * ```
 *
 * @see https://tossmini-docs.toss.im/tds-mobile/components/progress-stepper/
 */
export const ProgressStepper = ({
  variant = 'compact',
  paddingTop = 'default',
  activeStepIndex = 0,
  checkForFinish = false,
  children,
}: ProgressStepperProps) => {
  // children에서 ProgressStep의 props 추출
  const steps = Children.toArray(children)
    .filter((child): child is ReactElement<ProgressStepProps> => {
      return typeof child === 'object' && child !== null && 'props' in child;
    })
    .map((child) => child.props);

  return (
    <View style={[styles.container, paddingTop === 'wide' ? styles.paddingTopWide : styles.paddingTopDefault]}>
      {variant === 'compact' ? (
        <CompactVariant steps={steps} activeStepIndex={activeStepIndex} checkForFinish={checkForFinish} />
      ) : (
        <IconVariant steps={steps} activeStepIndex={activeStepIndex} checkForFinish={checkForFinish} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingBottom: 8,
    backgroundColor: colors.white,
  },
  paddingTopDefault: {
    paddingTop: 16,
  },
  paddingTopWide: {
    paddingTop: 24,
  },
});
