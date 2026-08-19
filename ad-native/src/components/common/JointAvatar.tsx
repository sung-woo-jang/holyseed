import Svg, { Path } from 'react-native-svg';

/** 공동 소유 표시 — 웹의 conic-gradient(brand 0-180deg, muted 180-360deg) 원 배지를 SVG 반원 두 조각으로 재현 */
export default function JointAvatar({ size = 24, brand, muted }: { size?: number; brand: string; muted: string }) {
  const r = size / 2;
  const rightWedge = `M${r},${r} L${r},0 A${r},${r} 0 0 1 ${r},${size} Z`;
  const leftWedge = `M${r},${r} L${r},${size} A${r},${r} 0 0 1 ${r},0 Z`;
  return (
    <Svg width={size} height={size}>
      <Path d={rightWedge} fill={brand} />
      <Path d={leftWedge} fill={muted} />
    </Svg>
  );
}
