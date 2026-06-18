

import { useEffect, useRef } from 'react';
import styles from './KakaoMap.module.css';
import cn from 'classnames';

interface KakaoMapProps {
  lat: number;
  lng: number;
  venueName: string;
  address: string;
}

interface KakaoMaps {
  LatLng: new (lat: number, lng: number) => unknown;
  Map: new (container: HTMLElement, options: { center: unknown; level: number }) => unknown;
  Marker: new (options: { position: unknown }) => { setMap: (map: unknown) => void };
  InfoWindow: new (options: { content: string }) => { open: (map: unknown, marker: unknown) => void };
  load: (callback: () => void) => void;
}

declare global {
  interface Window {
    kakao: {
      maps: KakaoMaps;
    };
  }
}

export default function KakaoMap({ lat, lng, venueName }: KakaoMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadKakaoMap = () => {
      if (!window.kakao || !window.kakao.maps) {
        console.error('Kakao Maps API not loaded');
        return;
      }

      if (!mapRef.current) return;

      const options = {
        center: new window.kakao.maps.LatLng(lat, lng),
        level: 3,
      };

      const map = new window.kakao.maps.Map(mapRef.current, options);

      // Add marker
      const markerPosition = new window.kakao.maps.LatLng(lat, lng);
      const marker = new window.kakao.maps.Marker({
        position: markerPosition,
      });
      marker.setMap(map);

      // Add info window
      const iwContent = `<div style="padding:5px;font-size:12px;">${venueName}</div>`;
      const infowindow = new window.kakao.maps.InfoWindow({
        content: iwContent,
      });
      infowindow.open(map, marker);
    };

    // Check if script is already loaded
    if (window.kakao && window.kakao.maps) {
      window.kakao.maps.load(loadKakaoMap);
    } else {
      // Wait for script to load
      const checkInterval = setInterval(() => {
        if (window.kakao && window.kakao.maps) {
          clearInterval(checkInterval);
          window.kakao.maps.load(loadKakaoMap);
        }
      }, 100);

      return () => clearInterval(checkInterval);
    }
  }, [lat, lng, venueName]);

  const openKakaoNavi = () => {
    window.open(
      `https://map.kakao.com/link/to/${venueName},${lat},${lng}`,
      '_blank'
    );
  };

  const openKakaoMap = () => {
    window.open(
      `https://map.kakao.com/link/map/${venueName},${lat},${lng}`,
      '_blank'
    );
  };

  return (
    <div className={styles.wrapper}>
      <div ref={mapRef} className={styles.map}></div>
      <div className={styles.buttons}>
        <button type="button" onClick={openKakaoNavi} className={cn(styles.button, styles.buttonKakao)}>
          <span role="img" aria-label="navi">🚗</span> 카카오내비
        </button>
        <button type="button" onClick={openKakaoMap} className={cn(styles.button, styles.buttonMap)}>
          <span role="img" aria-label="map">🗺️</span> 카카오맵
        </button>
      </div>
    </div>
  );
}
