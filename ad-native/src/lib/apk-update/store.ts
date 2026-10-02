import { create } from 'zustand';

export interface ApkInfo {
  versionCode: number;
  versionName: string;
  url: string;
  size: number;
  notes?: string;
}

export type ApkPhase = 'idle' | 'available' | 'downloading' | 'ready' | 'error';

interface ApkUpdateState {
  phase: ApkPhase;
  /** 모달 표시 여부 — 다운로드 중에 닫아도 phase는 유지 */
  visible: boolean;
  info: ApkInfo | null;
  progress: number;
  error: string | null;
  /** 사용자가 "나중에"를 누른 버전 — 자동 확인에서는 같은 버전을 다시 묻지 않음 */
  dismissedCode: number;
  set: (patch: Partial<Omit<ApkUpdateState, 'set'>>) => void;
}

export const useApkUpdateStore = create<ApkUpdateState>((set) => ({
  phase: 'idle',
  visible: false,
  info: null,
  progress: 0,
  error: null,
  dismissedCode: 0,
  set: (patch) => set(patch),
}));
