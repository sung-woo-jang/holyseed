import type { AssetCategory, Category, CategoryType, CostType } from '../types/api';
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

// 프론트 자산 카테고리 키 → 백엔드 enum (REAL_ESTATE/LIABILITY는 백엔드에 없음)
const BACKEND_ALIAS: Record<string, string> = {
  REAL_ESTATE: 'REAL_ASSET',
  LIABILITY: 'DEBT',
};
/** 자산 생성/수정 시 백엔드 enum으로 변환 */
export function toBackendAssetCategory(category: string): string {
  return BACKEND_ALIAS[category] ?? category;
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

/** 실제 카테고리(icon/color)를 우선 쓰고, 없으면 이름 기반 CATEGORY_DEFS로 폴백 */
export function resolveCategoryVisual(
  categoryId: number | null | undefined,
  categoryName: string,
  categories: Category[],
): { icon: string; color: string } {
  const cat = categoryId != null ? categories.find((c) => c.id === categoryId) : categories.find((c) => c.name === categoryName);
  const def = getCategoryDef(categoryName);
  return { icon: cat?.icon || def.iconCode, color: cat?.color || def.color };
}

/** 카테고리의 기본 분류(고정비/변동비) — 본인 값 없으면 상위(대분류) 값으로 폴백 */
export function resolveCostType(categoryId: number | null | undefined, categories: Category[]): CostType | null {
  if (categoryId == null) return null;
  const cat = categories.find((c) => c.id === categoryId);
  if (!cat) return null;
  if (cat.defaultCostType) return cat.defaultCostType;
  if (cat.parentId != null) {
    const parent = categories.find((c) => c.id === cat.parentId);
    return parent?.defaultCostType ?? null;
  }
  return null;
}

/** 소분류면 상위(대분류) id, 대분류면 자기 자신의 id를 반환 — 카테고리별 집계·필터를 대분류 기준으로 묶을 때 사용 */
export function resolveRootCategoryId(categoryId: number | null | undefined, categories: Category[]): number | null {
  if (categoryId == null) return null;
  const cat = categories.find((c) => c.id === categoryId);
  if (!cat) return null;
  return cat.parentId ?? cat.id;
}
