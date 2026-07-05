import { createContext, useContext, type ReactNode } from 'react';
import cn from 'classnames';
import styles from './SegmentedControl.module.css';

interface SegmentedContextValue {
  value: string;
  onChange: (value: string) => void;
  size: 'small' | 'large';
}

const SegmentedContext = createContext<SegmentedContextValue | null>(null);

interface RootProps {
  value: string;
  onChange: (value: string) => void;
  name?: string;
  size?: 'small' | 'large';
  alignment?: 'fixed' | 'fluid';
  children: ReactNode;
}

function Root({ value, onChange, size = 'large', alignment = 'fixed', children }: RootProps) {
  return (
    <SegmentedContext.Provider value={{ value, onChange, size }}>
      <div className={cn(styles.root, alignment === 'fluid' && styles.fluid)}>{children}</div>
    </SegmentedContext.Provider>
  );
}

interface ItemProps {
  value: string;
  children: ReactNode;
}

function Item({ value, children }: ItemProps) {
  const ctx = useContext(SegmentedContext);
  if (!ctx) throw new Error('SegmentedControl.Item must be used inside SegmentedControl.Root');
  const active = ctx.value === value;
  return (
    <button
      type="button"
      className={cn(styles.item, styles[`item-${ctx.size}`], active && styles.active)}
      onClick={() => ctx.onChange(value)}
    >
      {children}
    </button>
  );
}

const SegmentedControl = { Root, Item };
export default SegmentedControl;
