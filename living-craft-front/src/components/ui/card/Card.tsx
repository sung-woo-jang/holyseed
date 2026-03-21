import { colors } from '@toss/tds-colors';
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  /**
   * 카드의 border radius
   *
   * 가이드라인:
   * - 카드 높이 > 60px: 한 줄에 1개(20), 2개(18), 3개 이상(16)
   * - 카드 높이 <= 60px: 한 줄에 1개(18), 2개(16), 3개 이상(14)
   *
   * @default 20
   */
  borderRadius?: number;
}

/**
 * 섹션용 Card 컴포넌트
 *
 * 페이지 내 섹션을 나누는 컨테이너 역할을 하는 카드 컴포넌트입니다.
 * 디자인 가이드의 기본값을 고정하여 일관된 UI를 제공합니다.
 *
 * @example 기본 사용
 * ```tsx
 * <Card>
 *   <Text style={styles.title}>제목</Text>
 *   <Text style={styles.content}>내용</Text>
 * </Card>
 * ```
 *
 * @example borderRadius 커스터마이징 (한 줄에 2개 카드, 높이 > 60px)
 * ```tsx
 * <Card borderRadius={18}>
 *   <Text>Radius 18 적용</Text>
 * </Card>
 * ```
 *
 * @example 추가 스타일이 필요한 경우
 * ```tsx
 * <Card style={{ marginHorizontal: 20 }}>
 *   <Text>커스텀 마진이 적용된 카드</Text>
 * </Card>
 * ```
 */
export const Card = ({ children, style, borderRadius = 20 }: CardProps) => {
  return <View style={[styles.card, { borderRadius }, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    // 배경색: CardBg-White (가이드)
    backgroundColor: colors.background,

    // Spacing: 상하 간격 10px, 좌우 간격 8px (가이드)
    paddingVertical: 10,
    paddingHorizontal: 8,

    // Margin: 좌우 마진 10px (가이드 - 화면 너비에 꽉 차게 배치할 때)
    marginHorizontal: 10,
    marginRight: 10,
    marginLeft: 10,

    // Margin: 상하 간격 10px (가이드)
    marginBottom: 10,
  },
});
