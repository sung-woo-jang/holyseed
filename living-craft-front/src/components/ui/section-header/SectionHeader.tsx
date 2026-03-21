import { colors } from '@toss/tds-colors';
import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

interface SectionHeaderProps {
  /**
   * 섹션 제목
   */
  title: string;
  /**
   * 섹션 부제목 (선택사항)
   */
  subtitle?: string;
  /**
   * 하단 보더 표시 여부
   */
  showBorder?: boolean;
  /**
   * 헤더 왼쪽 액션 (예: 뒤로가기 버튼)
   */
  leftAction?: React.ReactNode;
  /**
   * 커스텀 스타일
   */
  style?: ViewStyle;
}

/**
 * 섹션 헤더 컴포넌트
 *
 * 제목과 부제목을 표시하는 재사용 가능한 헤더 컴포넌트입니다.
 * 선택적으로 하단 보더와 왼쪽 액션(뒤로가기 버튼 등)을 지원합니다.
 *
 * @example
 * ```tsx
 * // 기본 사용
 * <SectionHeader title="서비스 지역" subtitle="먼저 서비스를 선택해주세요" />
 *
 * // 하단 보더 포함
 * <SectionHeader
 *   title="시/도 선택"
 *   subtitle="서비스를 받으실 시/도를 선택해주세요"
 *   showBorder
 * />
 *
 * // 뒤로가기 버튼 포함
 * <SectionHeader
 *   title="구/군 선택"
 *   subtitle="서울의 구/군을 선택해주세요"
 *   leftAction={<IconButton name="icon-arrow-back-ios-mono" onPress={handleBack} />}
 * />
 * ```
 */
export const SectionHeader = ({ title, subtitle, showBorder = false, leftAction, style }: SectionHeaderProps) => {
  return (
    <View style={[styles.header, showBorder && styles.headerWithBorder, style]}>
      {leftAction ? (
        <View style={styles.headerRow}>
          {leftAction}
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
        </View>
      ) : (
        <>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerWithBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.grey200,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.grey900,
  },
  subtitle: {
    fontSize: 14,
    color: colors.grey600,
    marginTop: 4,
  },
});
