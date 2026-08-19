import { ActivityIndicator } from 'react-native';

interface LoaderProps {
  size?: 'small' | 'large' | number;
  color?: string;
}

export default function Loader({ size = 'small', color }: LoaderProps) {
  const rnSize = typeof size === 'number' ? (size >= 30 ? 'large' : 'small') : size;
  return <ActivityIndicator size={rnSize} color={color ?? '#3182F6'} />;
}
