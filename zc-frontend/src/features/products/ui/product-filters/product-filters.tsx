import { useFetchBrands } from '@/features/brands/api/fetch-brands';

interface ProductFiltersProps {
  brandId?: string;
  siteCode?: string;
  matchStatus?: string;
  onBrandChange: (value: string) => void;
  onSiteChange: (value: string) => void;
  onMatchStatusChange: (value: string) => void;
}

const SITES = [
  { code: 'dasis', name: '다시스' },
  { code: 'wooribath', name: '우리욕실' },
];

const MATCH_STATUSES = [
  { value: 'all', label: '전체' },
  { value: 'matched', label: '매칭됨' },
  { value: 'unmatched', label: '미매칭' },
];

export function ProductFilters({
  brandId,
  siteCode,
  matchStatus,
  onBrandChange,
  onSiteChange,
  onMatchStatusChange,
}: ProductFiltersProps) {
  const { data: brands } = useFetchBrands();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* 사이트 필터 */}
      <div>
        <label className="block text-sm font-medium mb-2">사이트</label>
        <select
          value={siteCode || ''}
          onChange={(e) => onSiteChange(e.target.value)}
          className="w-full h-10 px-3 rounded-md border border-input bg-white text-sm"
        >
          <option value="">전체 사이트</option>
          {SITES.map((site) => (
            <option key={site.code} value={site.code}>
              {site.name}
            </option>
          ))}
        </select>
      </div>

      {/* 브랜드 필터 */}
      <div>
        <label className="block text-sm font-medium mb-2">브랜드</label>
        <select
          value={brandId || ''}
          onChange={(e) => onBrandChange(e.target.value)}
          className="w-full h-10 px-3 rounded-md border border-input bg-white text-sm"
        >
          <option value="">전체 브랜드</option>
          {brands?.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.name} ({brand.productCount})
            </option>
          ))}
        </select>
      </div>

      {/* 매칭 상태 필터 */}
      <div>
        <label className="block text-sm font-medium mb-2">매칭 상태</label>
        <select
          value={matchStatus || 'all'}
          onChange={(e) => onMatchStatusChange(e.target.value)}
          className="w-full h-10 px-3 rounded-md border border-input bg-white text-sm"
        >
          {MATCH_STATUSES.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
