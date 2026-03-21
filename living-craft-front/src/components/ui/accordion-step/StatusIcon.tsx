import { colors } from '@toss/tds-colors';
import { Icon } from '@toss/tds-react-native';
import { StyleSheet, View } from 'react-native';

import type { StepStatus } from './types';

interface StatusIconProps {
  /**
   * 단계 상태
   */
  status: StepStatus;
  /**
   * 펼쳐진 상태인지 여부
   */
  isExpanded: boolean;
}

/**
 * 단계의 상태를 표시하는 아이콘 컴포넌트
 *
 * - locked: 잠금 아이콘
 * - active/completed + expanded: 위쪽 화살표
 * - active/completed + collapsed: 아래쪽 화살표
 */
export function StatusIcon({ status, isExpanded }: StatusIconProps) {
  if (status === 'locked') {
    return (
      <View style={styles.iconContainer}>
        <Icon name="lock" color={colors.grey400} size={20} />
      </View>
    );
  }

  return (
    <View style={styles.iconContainer}>
      <Icon
        name={isExpanded ? 'chevron-up' : 'chevron-down'}
        color={status === 'completed' ? colors.blue500 : colors.grey600}
        size={20}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
