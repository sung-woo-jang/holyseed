import { colors } from '@toss/tds-colors';
import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

import { Card } from '../card';

interface SectionCardProps {
  /**
   * 섹션 제목
   */
  title: string;
  /**
   * 섹션 부제목 (선택사항)
   */
  subtitle?: string;
  /**
   * 섹션 본문 내용
   */
  children: React.ReactNode;
  style?: ViewStyle;
}

interface LoadingProps {
  /**
   * 로딩 중인지 여부
   */
  isLoading: boolean;
  /**
   * 로딩 UI
   */
  children: React.ReactNode;
}

interface EmptyProps {
  /**
   * 비어있는지 여부
   */
  isEmpty: boolean;
  /**
   * 빈 상태 메시지
   */
  message: string;
}

interface ContentProps {
  /**
   * 컨텐츠 UI
   */
  children: React.ReactNode;
}

/**
 * 제목과 본문을 포함하는 섹션 카드 컴포넌트
 *
 * Card 컴포넌트를 감싸고 일관된 헤더 스타일을 제공합니다.
 * Compound Components 패턴을 사용하여 로딩/빈상태/정상 상태를 선언적으로 관리합니다.
 *
 * @example
 * ```tsx
 * <SectionCard title="한 번에 인테리어 준비 끝내기">
 *   <SectionCard.Loading isLoading={isLoading}>
 *     <Skeleton />
 *   </SectionCard.Loading>
 *   <SectionCard.Empty isEmpty={isEmpty} message="데이터가 없습니다." />
 *   <SectionCard.Content>
 *     <View style={styles.content}>
 *       <Text>본문 내용</Text>
 *     </View>
 *   </SectionCard.Content>
 * </SectionCard>
 * ```
 */
export const SectionCard = ({ title, subtitle, children, style }: SectionCardProps) => {
  return (
    <Card style={style}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {children}
    </Card>
  );
};

/**
 * 로딩 상태 컴포넌트
 * isLoading이 true일 때만 children을 렌더링합니다.
 */
SectionCard.Loading = ({ isLoading, children }: LoadingProps) => {
  if (!isLoading) return null;
  return <>{children}</>;
};

/**
 * 빈 상태 컴포넌트
 * isEmpty가 true일 때 빈 상태 메시지를 표시합니다.
 */
SectionCard.Empty = ({ isEmpty, message }: EmptyProps) => {
  if (!isEmpty) return null;
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
};

/**
 * 정상 상태 컨텐츠 컴포넌트
 * 로딩이 끝나고 데이터가 있을 때 표시됩니다.
 */
SectionCard.Content = ({ children }: ContentProps) => {
  return <>{children}</>;
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.grey900,
  },
  subtitle: {
    fontSize: 14,
    color: colors.grey600,
    marginTop: 4,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: colors.grey600,
  },
});
