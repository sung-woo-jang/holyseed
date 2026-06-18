

import Lightbox from 'yet-another-react-lightbox';
import Captions from 'yet-another-react-lightbox/plugins/captions';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/captions.css';
import type { Media } from '@/types';
import styles from './Lightbox.module.css';

interface GalleryLightboxProps {
  media: Media[];
  currentIndex: number;
  onClose: () => void;
  onChange: (index: number) => void;
}

export function GalleryLightbox({ media, currentIndex, onClose, onChange }: GalleryLightboxProps) {
  const slides = media.map(item => ({
    src: `/api/wedding/media/${item.id}/resized`,
    alt: item.uploaderName || 'Guest photo',
    width: item.width || 1920,
    height: item.height || 1080,
    title: item.uploaderName || '익명',
    description: item.message,
  }));

  return (
    <div className={styles.lightboxContainer}>
      <Lightbox
        open={currentIndex >= 0}
        close={onClose}
        index={currentIndex}
        slides={slides}
        plugins={[Captions]}
        on={{
          view: ({ index }) => onChange(index),
        }}
        carousel={{
          finite: false,
        }}
        render={{
          buttonPrev: slides.length <= 1 ? () => null : undefined,
          buttonNext: slides.length <= 1 ? () => null : undefined,
        }}
      />
    </div>
  );
}
