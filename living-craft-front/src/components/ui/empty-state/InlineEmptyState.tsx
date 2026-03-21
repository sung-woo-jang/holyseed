import { colors } from '@toss/tds-colors';
import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

interface InlineEmptyStateProps {
  /**
   * 주 메시지
   */
  message: string;
  /**
   * 부 메시지 (선택사항)
   */
  subMessage?: string;
  /**
   * 커스텀 스타일
   */
  style?: ViewStyle;
}

/**
 * 인라인 빈 상태 컴포넌트
 *
 * 섹션이나 카드 내부에서 데이터가 없을 때 표시되는 간단한 메시지 컴포넌트입니다.
 * 주 메시지와 선택적 부 메시지를 지원합니다.
 *
 * @example
 * ```tsx
 * // 주 메시지만
 * <InlineEmptyState message="사용 가능한 지역이 없습니다." />
 *
 * // 주 메시지 + 부 메시지
 * <InlineEmptyState
 *   message="검색 결과가 없습니다."
 *   subMessage="다른 검색어로 다시 시도해주세요"
 * />
 *
 * // 커스텀 스타일
 * <InlineEmptyState
 *   message="데이터가 없습니다."
 *   style={{ paddingVertical: 40 }}
 * />
 * ```
 */
export const InlineEmptyState = ({ message, subMessage, style }: InlineEmptyStateProps) => {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.message}>{message}</Text>
      {subMessage && <Text style={styles.subMessage}>{subMessage}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 8,
  },
  message: {
    fontSize: 16,
    color: colors.grey600,
    textAlign: 'center',
  },
  subMessage: {
    fontSize: 14,
    color: colors.grey500,
    textAlign: 'center',
  },
});
