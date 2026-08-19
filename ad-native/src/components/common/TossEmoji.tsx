import { View } from 'react-native';
import { SvgUri } from 'react-native-svg';
import { tossEmoji } from '../../lib/toss-emoji';

interface TossEmojiProps {
  code: string;
  size?: number;
  bg?: string;
  borderRadius?: number;
}

export default function TossEmoji({ code, size = 40, bg, borderRadius }: TossEmojiProps) {
  const uri = tossEmoji(code);
  const innerSize = Math.round(size * 0.6);
  const br = borderRadius ?? Math.round(size * 0.25);

  if (bg) {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: br,
          backgroundColor: bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <SvgUri uri={uri} width={innerSize} height={innerSize} />
      </View>
    );
  }

  return <SvgUri uri={uri} width={size} height={size} />;
}
