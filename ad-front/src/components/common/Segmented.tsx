import SegmentedControl from '../ui/SegmentedControl';

interface SegmentedProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  small?: boolean;
  /** 'fixed' = 부모 폭 꽉 채움(기본), 'fluid' = 콘텐츠 폭에 맞춤 */
  alignment?: 'fixed' | 'fluid';
}

export default function Segmented({ options, value, onChange, small = false, alignment = 'fixed' }: SegmentedProps) {
  return (
    <SegmentedControl.Root
      value={value}
      onChange={onChange}
      name="segmented"
      size={small ? 'small' : 'large'}
      alignment={alignment}
    >
      {options.map((o) => (
        <SegmentedControl.Item key={o} value={o}>
          {o}
        </SegmentedControl.Item>
      ))}
    </SegmentedControl.Root>
  );
}
