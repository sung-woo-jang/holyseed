import { View } from 'react-native';
import { useTheme } from '../../lib/theme';

interface BorderProps {
  /** 'full' = 화면 폭 전체, 'padding' = 좌우 20px 여백 */
  type?: 'full' | 'padding';
  height?: number;
}

export default function Border({ type = 'full', height = 1 }: BorderProps) {
  const theme = useTheme();
  return (
    <View
      style={{
        height,
        backgroundColor: theme.border,
        marginHorizontal: type === 'padding' ? 20 : 0,
      }}
    />
  );
}
