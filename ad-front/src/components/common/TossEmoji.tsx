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
      <div
        style={{
          width: size,
          height: size,
          borderRadius: br,
          backgroundColor: bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <img src={uri} width={innerSize} height={innerSize} alt="" draggable={false} />
      </div>
    );
  }

  return <img src={uri} width={size} height={size} alt="" draggable={false} style={{ flexShrink: 0 }} />;
}
