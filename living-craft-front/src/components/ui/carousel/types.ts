import type { ReactElement } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export interface CarouselItem {
  id: string | number;
  [key: string]: any;
}

export interface CarouselProps<T extends CarouselItem> {
  // 필수 props
  data: T[];
  renderItem: (item: T, index: number) => ReactElement;

  // 레이아웃
  itemWidth?: number;
  itemHeight?: number;
  gap?: number;
  containerStyle?: StyleProp<ViewStyle>;

  // 인디케이터
  showIndicator?: boolean;
  dotColor?: string;
  inactiveDotColor?: string;

  // 동작
  initialIndex?: number;
  autoPlay?: boolean;
  autoPlayInterval?: number;

  // 콜백
  onIndexChange?: (index: number) => void;
}

export interface CarouselIndicatorProps {
  totalCount: number;
  currentIndex: number;
  dotColor?: string;
  inactiveDotColor?: string;
  style?: StyleProp<ViewStyle>;
}
