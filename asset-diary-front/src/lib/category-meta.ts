import type { AssetCategory, CategoryType } from '../types/api';
import { TE } from './toss-emoji';

export interface AssetCategoryMeta {
  label: string;
  color: string;
  iconCode: string;
}

export const ASSET_CATEGORY_META: Record<AssetCategory, AssetCategoryMeta> = {
  CASH:        { label: '현금성',    color: '#0AB39C', iconCode: TE.piggy },
  INVESTMENT:  { label: '투자',      color: '#3182F6', iconCode: TE.chartUp },
  CRYPTO:      { label: '가상자산',  color: '#A78BFA', iconCode: TE.coin },
  REAL_ESTATE: { label: '실물자산',  color: '#F59E0B', iconCode: TE.home2 },
  PENSION:     { label: '연금·보험', color: '#EC4899', iconCode: TE.shield },
  LIABILITY:   { label: '부채',      color: '#94A3B8', iconCode: TE.creditCard },
};

const FALLBACK_ASSET_META: AssetCategoryMeta = { label: '기타', color: '#8B95A1', iconCode: TE.piggy };

/** 미지의 카테고리 키여도 크래시 없이 메타를 반환 */
export function getAssetCategoryMeta(category: string): AssetCategoryMeta {
  return ASSET_CATEGORY_META[category as AssetCategory] ?? FALLBACK_ASSET_META;
}

export interface CategoryDef {
  type: CategoryType;
  iconCode: string;
  color: string;
}

export const CATEGORY_DEFS: Record<string, CategoryDef> = {
  급여:    { type: 'INCOME',   iconCode: TE.briefcase,    color: '#3182F6' },
  투자수익: { type: 'INCOME',   iconCode: TE.chartUp,      color: '#0AB39C' },
  사업소득: { type: 'INCOME',   iconCode: TE.receipt,      color: '#F59E0B' },
  기타수입: { type: 'INCOME',   iconCode: TE.sparkles,     color: '#A78BFA' },
  주거:    { type: 'EXPENSE',  iconCode: TE.home2,         color: '#EF4444' },
  식비:    { type: 'EXPENSE',  iconCode: TE.cake,          color: '#F59E0B' },
  교통:    { type: 'EXPENSE',  iconCode: TE.car,           color: '#0AB39C' },
  의료:    { type: 'EXPENSE',  iconCode: TE.bulb,          color: '#EC4899' },
  쇼핑:    { type: 'EXPENSE',  iconCode: TE.bag,           color: '#A78BFA' },
  여가:    { type: 'EXPENSE',  iconCode: TE.clapperboard,  color: '#06B6D4' },
  교육:    { type: 'EXPENSE',  iconCode: TE.books,         color: '#8B5CF6' },
  보험료:   { type: 'EXPENSE',  iconCode: TE.shield,        color: '#64748B' },
  구독:    { type: 'EXPENSE',  iconCode: TE.tvSet,         color: '#3182F6' },
  기타:    { type: 'EXPENSE',  iconCode: TE.cyclone,       color: '#94A3B8' },
};

export function getCategoryDef(name: string): CategoryDef {
  return CATEGORY_DEFS[name] ?? { type: 'EXPENSE', iconCode: TE.cyclone, color: '#94A3B8' };
}
