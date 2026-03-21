import { colors } from '@toss/tds-colors';
import { Icon } from '@toss/tds-react-native';
import { StyleSheet, Text, View } from 'react-native';

import type { StepStatus } from './types';

interface StepBadgeProps {
  /**
   * 단계 번호 (1부터 시작)
   */
  number: number;
  /**
   * 단계 상태
   */
  status: StepStatus;
}

/**
 * 단계 번호를 표시하는 뱃지 컴포넌트
 *
 * - locked: 회색 배경, 회색 텍스트
 * - active: 파란색 배경, 흰색 텍스트
 * - completed: 파란색 배경, 체크 아이콘
 */
export function StepBadge({ number, status }: StepBadgeProps) {
  const badgeStyle = [
    styles.badge,
    status === 'locked' && styles.badgeLocked,
    status === 'active' && styles.badgeActive,
    status === 'completed' && styles.badgeCompleted,
  ];

  return (
    <View style={badgeStyle}>
      {status === 'completed' ? (
        <Icon name="check" color={colors.white} size={14} />
      ) : (
        <Text
          style={[styles.badgeText, status === 'locked' && styles.badgeTextLocked]}
        >
          {number}
        </Text>
      )}
    </View>
  );
}

const BADGE_SIZE = 24;

const styles = StyleSheet.create({
  badge: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLocked: {
    backgroundColor: colors.grey200,
  },
  badgeActive: {
    backgroundColor: colors.blue500,
  },
  badgeCompleted: {
    backgroundColor: colors.blue500,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.white,
  },
  badgeTextLocked: {
    color: colors.grey500,
  },
});
