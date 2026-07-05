import type { ReactNode } from 'react';
import cn from 'classnames';
import styles from './ListHeader.module.css';

interface ListHeaderProps {
  title: ReactNode;
  lower?: ReactNode;
  right?: ReactNode;
}

function ListHeaderRoot({ title, lower, right }: ListHeaderProps) {
  return (
    <div className={styles.header}>
      <div className={styles.texts}>
        {title}
        {lower}
      </div>
      {right && <div className={styles.right}>{right}</div>}
    </div>
  );
}

function TitleParagraph({
  typography = 't4',
  children,
}: {
  typography?: 't4' | 't5';
  children: ReactNode;
}) {
  return <span className={cn(styles.title, styles[typography])}>{children}</span>;
}

function DescriptionParagraph({ children }: { children: ReactNode }) {
  return <span className={styles.desc}>{children}</span>;
}

const ListHeader = Object.assign(ListHeaderRoot, { TitleParagraph, DescriptionParagraph });
export default ListHeader;
