import React from 'react';
import { View, StyleSheet } from 'react-native';
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
      <View style={[styles.container, { width: size, height: size, borderRadius: br, backgroundColor: bg }]}>
        <SvgUri width={innerSize} height={innerSize} uri={uri} />
      </View>
    );
  }

  return <SvgUri width={size} height={size} uri={uri} />;
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
});
