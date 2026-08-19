import { View } from 'react-native';

interface HBarProps {
  value: number;
  max: number;
  color: string;
  height?: number;
  dark?: boolean;
}

export default function HBar({ value, max, color, height: barHeight = 8, dark = false }: HBarProps) {
  const pct = Math.min(100, (Math.abs(value) / (max || 1)) * 100);
  return (
    <View
      style={{
        width: '100%',
        height: barHeight,
        borderRadius: barHeight / 2,
        backgroundColor: dark ? 'rgba(255,255,255,0.06)' : '#F2F4F6',
        overflow: 'hidden',
      }}
    >
      <View style={{ width: `${pct}%`, height: barHeight, borderRadius: barHeight / 2, backgroundColor: color }} />
    </View>
  );
}
