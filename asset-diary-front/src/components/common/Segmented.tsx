import React from 'react';
import { SegmentedControl } from '@toss/tds-react-native';

interface SegmentedProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  small?: boolean;
}

export default function Segmented({ options, value, onChange, small = false }: SegmentedProps) {
  return (
    <SegmentedControl.Root
      value={value}
      onChange={onChange}
      name="segmented"
      size={small ? 'small' : 'large'}
      alignment="fixed"
    >
      {options.map((o) => (
        <SegmentedControl.Item key={o} value={o}>
          {o}
        </SegmentedControl.Item>
      ))}
    </SegmentedControl.Root>
  );
}
