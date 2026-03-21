import { colors } from '@toss/tds-colors';
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

interface ListSeparatorProps {
  /**
   * 좌우 마진 (기본값: 20)
   */
  marginHorizontal?: number;
  /**
   * 커스텀 스타일
   */
  style?: ViewStyle;
}

/**
 * 리스트 구분선 컴포넌트
 *
 * 리스트 아이템 사이의 구분선을 표시합니다.
 *
 * @example
 * ```tsx
 * // 기본 사용
 * <ListSeparator />
 *
 * // 커스텀 마진
 * <ListSeparator marginHorizontal={16} />
 *
 * // 리스트에서 사용
 * items.map((item, index) => (
 *   <View key={item.id}>
 *     <ListItem item={item} />
 *     {index < items.length - 1 && <ListSeparator />}
 *   </View>
 * ))
 * ```
 */
export const ListSeparator = ({ marginHorizontal = 20, style }: ListSeparatorProps) => {
  return <View style={[styles.separator, { marginHorizontal }, style]} />;
};

const styles = StyleSheet.create({
  separator: {
    height: 1,
    backgroundColor: colors.grey200,
  },
});
