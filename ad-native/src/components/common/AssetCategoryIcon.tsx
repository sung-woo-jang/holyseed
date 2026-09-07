import Svg, { Circle, Path, Rect } from 'react-native-svg';

interface AssetCategoryIconProps {
  category: string;
  size?: number;
  color: string;
}

const STROKE = { fill: 'none', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

export default function AssetCategoryIcon({ category, size = 18, color }: AssetCategoryIconProps) {
  const p = { ...STROKE, stroke: color };
  let body: React.ReactNode;
  switch (category) {
    case 'CASH':
      body = (
        <>
          <Path d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v3" {...p} />
          <Path d="M3 7v10a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1v-4" {...p} />
          <Path d="M16 13h3a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-3a2 2 0 0 1 0-4Z" {...p} />
        </>
      );
      break;
    case 'INVESTMENT':
      body = (
        <>
          <Path d="M3 17l6-6 4 4 8-8" {...p} />
          <Path d="M15 7h6v6" {...p} />
        </>
      );
      break;
    case 'CRYPTO':
      body = (
        <>
          <Circle cx={9} cy={9} r={6} {...p} />
          <Circle cx={15} cy={15} r={6} {...p} />
        </>
      );
      break;
    case 'REAL_ESTATE':
      body = (
        <>
          <Path d="M4 11.5 12 4l8 7.5" {...p} />
          <Path d="M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9" {...p} />
          <Path d="M10 20v-5h4v5" {...p} />
        </>
      );
      break;
    case 'PENSION':
      body = <Path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" {...p} />;
      break;
    case 'LIABILITY':
      body = (
        <>
          <Rect x={3} y={6} width={18} height={13} rx={2.5} {...p} />
          <Path d="M3 10.5h18" {...p} />
          <Path d="M7 15h4" {...p} />
        </>
      );
      break;
    default:
      body = <Circle cx={12} cy={12} r={8} {...p} />;
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {body}
    </Svg>
  );
}
