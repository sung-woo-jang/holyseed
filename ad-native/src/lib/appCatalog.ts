import type { AppMode } from '../stores/appMode.store';
import { TE } from './toss-emoji';

export interface AppCatalogEntry {
  mode: AppMode;
  emojiCode: string;
  name: string;
  hint: string;
}

export const APP_CATALOG: AppCatalogEntry[] = [
  { mode: 'assetDiary', emojiCode: TE.ledger, name: '자산일기', hint: '홈 · 자산 · 가계부' },
  { mode: 'laofus', emojiCode: TE.chartUp, name: '라오어', hint: '무매 · TQQQ VR' },
  { mode: 'worklog', emojiCode: TE.briefcase, name: '근무일지', hint: '근무 기록 · 급여 계산' },
];
