import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import styles from './NetflixRow.module.css';

type RowItemType = 'image' | 'video' | 'info-card' | 'calendar-card' | 'account-card' | 'upload-card' | 'top-ranked';

interface BaseItem {
  type: RowItemType;
  alt?: string;
}

interface ImageItem extends BaseItem {
  type: 'image';
  src: string;
}

interface TopRankedItem extends BaseItem {
  type: 'top-ranked';
  src: string;
  rank: number;
}

interface VideoItem extends BaseItem {
  type: 'video';
  src: string;
  poster?: string;
}

interface InfoCardItem extends BaseItem {
  type: 'info-card';
  icon: string;
  title: string;
  subtitle?: string;
  content?: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
}

interface CalendarCardItem extends BaseItem {
  type: 'calendar-card';
  year: string;
  month: string;
  day: string;
  dayName: string;
  time: string;
  onClick?: () => void;
}

interface AccountCardItem extends BaseItem {
  type: 'account-card';
  icon: string;
  relation: string;
  holder: string;
  bank: string;
  account: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface UploadCardItem extends BaseItem {
  type: 'upload-card';
  icon: string;
  title: string;
  subtitle: string;
  action: {
    label: string;
    href: string;
  };
}

type RowItem = ImageItem | VideoItem | InfoCardItem | CalendarCardItem | AccountCardItem | UploadCardItem | TopRankedItem;

interface NetflixRowProps {
  title: string;
  items: RowItem[];
  onItemClick?: (index: number) => void;
  onVideoClick?: (videoSrc: string) => void;
  rowId?: string;
}

export default function NetflixRow({ title, items, onItemClick, onVideoClick, rowId }: NetflixRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const scroll = (direction: 'left' | 'right') => {
    if (!rowRef.current) return;
    const scrollAmount = rowRef.current.clientWidth * 0.8;
    rowRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  const handleScroll = () => {
    if (!rowRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
    setShowLeftArrow(scrollLeft > 10);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const renderItem = (item: RowItem, index: number) => {
    switch (item.type) {
      case 'image':
        return (
          <div
            className={styles.card}
            onClick={() => onItemClick?.(index)}
          >
            <img
              src={item.src}
              alt={item.alt || ''}
              className={styles.cardImage}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        );

      case 'video':
        return (
          <div
            className={styles.videoCard}
            onClick={() => onVideoClick?.(item.src)}
          >
            <video
              className={styles.video}
              poster={item.poster}
              muted
              loop
              playsInline
              preload="metadata"
              data-wedding-video
              onMouseEnter={(e) => e.currentTarget.play()}
              onMouseLeave={(e) => {
                const video = e.currentTarget;
                video.pause();
                video.currentTime = 0;
                video.load();
              }}
            >
              <source src={item.src} type="video/mp4" />
            </video>
            <div className={styles.videoPlayOverlay}>
              <svg className={styles.playIcon} viewBox="0 0 24 24" fill="white">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>
        );

      case 'info-card':
        return (
          <div className={styles.infoCard} onClick={item.action?.onClick}>
            <div className={styles.cardIcon}>{item.icon}</div>
            <h3 className={styles.cardTitle}>{item.title}</h3>
            {item.subtitle && (
              <p className={styles.cardSubtitle}>{item.subtitle}</p>
            )}
            {item.content && (
              <p className={styles.cardContent}>{item.content}</p>
            )}
            {item.action && (
              item.action.href ? (
                <Link to={item.action.href} className={styles.cardButton}>
                  {item.action.label}
                </Link>
              ) : item.action.onClick ? (
                <button onClick={(e) => {
                  e.stopPropagation();
                  item.action?.onClick?.();
                }} className={styles.cardButton}>
                  {item.action.label}
                </button>
              ) : null
            )}
          </div>
        );

      case 'calendar-card':
        return (
          <div className={styles.calendarCard} onClick={item.onClick}>
            <div className={styles.calendarMonth}>{item.month}</div>
            <div className={styles.calendarDay}>{item.day}</div>
            <div className={styles.calendarYear}>{item.year}</div>
            <div className={styles.calendarDayName}>{item.dayName}</div>
            <div className={styles.calendarTime}>{item.time}</div>
          </div>
        );

      case 'account-card':
        return (
          <div className={styles.accountCard}>
            <div className={styles.cardIcon}>{item.icon}</div>
            <div className={styles.accountRelation}>{item.relation}</div>
            <div className={styles.accountHolder}>{item.holder}</div>
            <div className={styles.accountBank}>{item.bank}</div>
            <div className={styles.accountNumber}>{item.account}</div>
            {item.action && (
              <button onClick={item.action.onClick} className={styles.cardButton}>
                {item.action.label}
              </button>
            )}
          </div>
        );

      case 'upload-card':
        return (
          <div className={styles.uploadCard}>
            <div className={styles.uploadIcon}>{item.icon}</div>
            <h3 className={styles.uploadTitle}>{item.title}</h3>
            <p className={styles.uploadSubtitle}>{item.subtitle}</p>
            <Link to={item.action.href} className={styles.uploadButton}>
              {item.action.label}
            </Link>
          </div>
        );

      case 'top-ranked':
        return (
          <div
            className={styles.topRankedCard}
            onClick={() => onItemClick?.(index)}
          >
            <svg
              className={styles.rankNumberSvg}
              viewBox="0 0 140 200"
              preserveAspectRatio="xMidYMax meet"
            >
              <text
                x="0"
                y="175"
                fill="transparent"
                stroke="#464646"
                strokeWidth="8"
                strokeLinejoin="round"
                fontSize="200"
                fontWeight="900"
                fontFamily="Helvetica Neue, Arial, sans-serif"
              >
                {item.rank}
              </text>
            </svg>
            <div className={styles.topRankedImageWrapper}>
              <img
                src={item.src}
                alt={item.alt || `Top ${item.rank}`}
                className={styles.topRankedImage}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={styles.row} id={rowId}>
      <h2 className={styles.rowTitle}>{title}</h2>

      <div className={styles.rowContainer}>
        {showLeftArrow && (
          <button
            className={`${styles.arrow} ${styles.arrowLeft}`}
            onClick={() => scroll('left')}
            aria-label="Scroll left"
          >
            ‹
          </button>
        )}

        <div
          ref={rowRef}
          className={styles.rowContent}
          onScroll={handleScroll}
        >
          {items.map((item, index) => (
            <div key={index} className={styles.itemWrapper}>
              {renderItem(item, index)}
            </div>
          ))}
        </div>

        {showRightArrow && (
          <button
            className={`${styles.arrow} ${styles.arrowRight}`}
            onClick={() => scroll('right')}
            aria-label="Scroll right"
          >
            ›
          </button>
        )}
      </div>
    </div>
  );
}
