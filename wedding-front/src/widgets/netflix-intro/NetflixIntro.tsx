

import { useState, useEffect } from 'react';
import styles from './NetflixIntro.module.css';

interface NetflixIntroProps {
  onComplete: (wasSkipped: boolean) => void;
}

export default function NetflixIntro({ onComplete }: NetflixIntroProps) {
  const [isPlaying, setIsPlaying] = useState(true);

  const handleVideoEnd = () => {
    setIsPlaying(false);
    setTimeout(() => onComplete(false), 500); // Fade out duration - completed naturally
  };

  const handleSkip = () => {
    setIsPlaying(false);
    onComplete(true); // Skipped
  };

  // Respect prefers-reduced-motion
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setTimeout(onComplete, 1000); // Show static frame for 1s
    }
  }, [onComplete]);

  if (!isPlaying) return null;

  return (
    <div className={styles.introOverlay}>
      <video
        autoPlay
        muted
        playsInline
        onEnded={handleVideoEnd}
        className={styles.video}
      >
        <source src="/Netflix Into 1920x1080.mp4" type="video/mp4" />
      </video>

      <button
        onClick={handleSkip}
        className={styles.skipButton}
        aria-label="Skip intro"
      >
        Skip Intro
      </button>
    </div>
  );
}
