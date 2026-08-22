import { Image, View } from 'react-native';
import TossEmoji from './TossEmoji';

interface CategoryIconProps {
  /** 토스 이모지 코드 또는 업로드된 이미지 URL(http로 시작하면 이미지로 판단) */
  icon: string;
  size?: number;
  bg?: string;
  borderRadius?: number;
}

/** 카테고리 아이콘 전용 렌더러 — 값이 URL이면 업로드 이미지, 아니면 토스 이모지로 그린다 */
export default function CategoryIcon({ icon, size = 40, bg, borderRadius }: CategoryIconProps) {
  if (icon?.startsWith('http')) {
    const br = borderRadius ?? Math.round(size * 0.25);
    return (
      <View style={{ width: size, height: size, borderRadius: br, overflow: 'hidden', backgroundColor: bg }}>
        <Image source={{ uri: icon }} style={{ width: size, height: size }} resizeMode="cover" />
      </View>
    );
  }
  return <TossEmoji code={icon} size={size} bg={bg} borderRadius={borderRadius} />;
}
