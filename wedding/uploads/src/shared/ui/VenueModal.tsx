

import { useState, lazy, Suspense } from 'react';
import styles from './VenueModal.module.css';

const KakaoMap = lazy(() => import('@/shared/ui/KakaoMap'));

interface VenueModalProps {
  isOpen: boolean;
  onClose: () => void;
  venueName: string;
  venueHall?: string;
  address: string;
  lat: number;
  lng: number;
}

export default function VenueModal({
  isOpen,
  onClose,
  venueName,
  venueHall,
  address,
  lat,
  lng,
}: VenueModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      alert('주소 복사에 실패했습니다.');
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        <button className={styles.closeButton} onClick={onClose} aria-label="Close">
          ✕
        </button>

        <div className={styles.content}>
          <div className={styles.header}>
            <div className={styles.icon}>📍</div>
            <h2 className={styles.title}>{venueName}</h2>
            {venueHall && <p className={styles.subtitle}>{venueHall}</p>}
          </div>

          <div className={styles.mapContainer}>
            <Suspense fallback={<p>지도 로딩 중...</p>}>
              <KakaoMap
                lat={lat}
                lng={lng}
                venueName={venueName}
                address={address}
              />
            </Suspense>
          </div>

          <div className={styles.addressSection}>
            <div className={styles.addressText}>{address}</div>
            <button
              className={styles.copyButton}
              onClick={handleCopyAddress}
            >
              {copied ? '✓ 복사됨' : '주소 복사'}
            </button>
          </div>

          <div className={styles.transportSection}>
            <h3 className={styles.sectionTitle}>오시는 길</h3>

            <div className={styles.transportItem}>
              <div className={styles.transportIcon}>🚗</div>
              <div className={styles.transportInfo}>
                <strong>자가용</strong>
                <p>네비게이션에 "{venueName}" 검색</p>
              </div>
            </div>

            <div className={styles.transportItem}>
              <div className={styles.transportIcon}>🚇</div>
              <div className={styles.transportInfo}>
                <strong>대중교통</strong>
                <p>카카오맵, 네이버 지도에서 길찾기를 이용해주세요</p>
              </div>
            </div>

            <div className={styles.transportItem}>
              <div className={styles.transportIcon}>🅿️</div>
              <div className={styles.transportInfo}>
                <strong>주차</strong>
                <p>건물 내 주차장 이용 가능</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
