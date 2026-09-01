import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import styles from './NetflixRow.module.css';
import { RANK_GLYPHS } from './rankGlyphs';

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
            {/* 세로/가로 어떤 비율의 사진이든 잘리지 않게: 흐린 배경(cover)이 카드를 채우고, 선명한 원본(contain)은 통째로 보임 */}
            <img src={item.src} alt="" aria-hidden="true" className={styles.cardBackdrop} loading="lazy" />
            <img src={item.src} alt={item.alt || ''} className={styles.cardImage} loading="lazy" />
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

      case 'top-ranked': {
        const glyph = RANK_GLYPHS[item.rank];
        const gradientId = `rankGradient-${item.rank}`;
        // 커스텀 글리프가 없는 두 자리 순위(11, 12...)는 각 자릿수의 실제 넷플릭스 글리프를
        // 나란히 이어붙여 구성 — "10"이 1+0을 조합한 것과 같은 방식
        const digitGlyphs = !glyph && item.rank >= 10
          ? String(item.rank).split('').map((d) => RANK_GLYPHS[Number(d)])
          : null;
        const composedGlyph = digitGlyphs?.every(Boolean) ? digitGlyphs : null;
        return (
          <div
            className={styles.topRankedCard}
            onClick={() => onItemClick?.(index)}
          >
            {composedGlyph ? (
              // 자릿수마다 85 너비 슬롯이 필요해서(CSS의 85:148 고정 비율을 그대로 쓰면
              // 가로로 눌려 작게 렌더링됨), 실제 조합 너비에 맞춰 비율 자체를 넓힘
              <svg
                className={styles.rankNumberSvg}
                style={{ aspectRatio: `${85 * composedGlyph.length} / 148` }}
                viewBox={`0 0 ${85 * composedGlyph.length} 148`}
                fill="none"
                opacity={0.3}
                preserveAspectRatio="xMaxYMid meet"
              >
                {composedGlyph.map((dg, di) => (
                  <svg key={di} x={di * 85} y="0" width="85" height="148" viewBox={dg!.viewBox ?? '0 0 85 148'}>
                    <g transform={`translate(${dg!.offsetX ?? 0}, 0)`}>
                      <path fillRule="evenodd" clipRule="evenodd" d={dg!.d} fill={`url(#${gradientId}-${di})`} />
                    </g>
                    <defs>
                      <linearGradient
                        id={`${gradientId}-${di}`}
                        x1={dg!.gradient.x1}
                        y1={dg!.gradient.y1}
                        x2={dg!.gradient.x2}
                        y2={dg!.gradient.y2}
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop stopColor="white" />
                        <stop offset="1" stopColor="white" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </svg>
                ))}
              </svg>
            ) : glyph ? (
              <svg
                className={styles.rankNumberSvg}
                viewBox={glyph.viewBox ?? '0 0 85 148'}
                fill="none"
                opacity={glyph.opacity}
                preserveAspectRatio="xMaxYMid meet"
              >
                <g transform={`translate(${glyph.offsetX ?? 0}, 0)`}>
                  <path fillRule="evenodd" clipRule="evenodd" d={glyph.d} fill={`url(#${gradientId})`} />
                </g>
                <defs>
                  <linearGradient
                    id={gradientId}
                    x1={glyph.gradient.x1}
                    y1={glyph.gradient.y1}
                    x2={glyph.gradient.x2}
                    y2={glyph.gradient.y2}
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="white" />
                    <stop offset="1" stopColor="white" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            ) : (
              <svg
                className={styles.rankNumberSvg}
                viewBox="0 0 85 148"
                fill="none"
                opacity={0.3}
                preserveAspectRatio="xMaxYMid meet"
              >
                <text
                  x="42.5"
                  y={item.rank >= 10 ? 128 : 132}
                  textAnchor="middle"
                  fill={`url(#${gradientId})`}
                  fontSize={item.rank >= 10 ? 95 : 140}
                  fontWeight="700"
                  fontFamily="'Bebas Neue', Helvetica Neue, Arial, sans-serif"
                >
                  {item.rank}
                </text>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="60" x2="85" y2="60" gradientUnits="userSpaceOnUse">
                    <stop stopColor="white" />
                    <stop offset="1" stopColor="white" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            )}
            <div className={styles.topRankedImageWrapper}>
              <img
                src={item.src}
                alt={item.alt || `Top ${item.rank}`}
                className={styles.topRankedImage}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                loading="lazy"
              />
            </div>
          </div>
        );
      }

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
