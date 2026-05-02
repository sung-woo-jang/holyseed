import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { ArrowLeft, Plus } from 'lucide-react';
import { Button, Card, Badge } from '@/shared/ui';
import { axiosInstance } from '@/shared/api/axios';
import { ZC_API } from '@/shared/api/endpoints';
import { useFetchModelCompare } from '@/features/product-models/api/useFetchModelCompare';
import { useFetchSites } from '@/features/sites/api/fetch-sites/useFetchSites';

const SITE_COLORS = ['#2563eb', '#16a34a', '#dc2626', '#d97706', '#7c3aed'];

export function CompareModelPage() {
  const { modelId } = useParams<{ modelId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: compareData, isLoading, error } = useFetchModelCompare(modelId!);
  const { data: sites } = useFetchSites();

  const [showManualForm, setShowManualForm] = useState(false);
  const [manualForm, setManualForm] = useState({
    siteId: '',
    productName: '',
    currentPrice: '',
    currentDiscountPrice: '',
    productUrl: '',
    manualPriceNote: '',
  });

  const addManualMutation = useMutation({
    mutationFn: async () => {
      const listingRes = await axiosInstance.post(ZC_API.PRODUCT_LISTINGS.CREATE_MANUAL, {
        siteId: manualForm.siteId,
        productName: manualForm.productName,
        currentPrice: parseInt(manualForm.currentPrice),
        currentDiscountPrice: manualForm.currentDiscountPrice ? parseInt(manualForm.currentDiscountPrice) : undefined,
        productUrl: manualForm.productUrl || undefined,
        manualPriceNote: manualForm.manualPriceNote || undefined,
      });
      const listingId = listingRes.data?.data?.id;
      if (!listingId) throw new Error('listing 생성 실패');

      await axiosInstance.post(ZC_API.PRODUCT_MODELS.LINK_PRODUCT(modelId!), {
        productListingId: listingId,
      });

      try {
        await axiosInstance.post(ZC_API.PRODUCT_MODELS.CALCULATE_MATERIAL_COST(modelId!));
      } catch (_) {}
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['model-compare', modelId] });
      setShowManualForm(false);
      setManualForm({ siteId: '', productName: '', currentPrice: '', currentDiscountPrice: '', productUrl: '', manualPriceNote: '' });
    },
  });

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">불러오는 중...</div>;
  if (error || !compareData) return <div className="p-8 text-center text-red-500">데이터를 불러올 수 없습니다.</div>;

  const { model, listings, priceHistory, lowestPrice, highestPrice } = compareData;

  // Recharts용 데이터 병합
  const allDates = new Set<string>();
  priceHistory.forEach((ph) => ph.points.forEach((p) => allDates.add(p.recordedAt.slice(0, 10))));
  const sortedDates = Array.from(allDates).sort();
  const chartData = sortedDates.map((date) => {
    const row: Record<string, string | number> = { date };
    priceHistory.forEach((ph) => {
      const point = ph.points.find((p) => p.recordedAt.slice(0, 10) === date);
      if (point) row[ph.siteName] = point.discountPrice ?? point.price;
    });
    return row;
  });

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/models/${modelId}`)}>
          <ArrowLeft className="w-4 h-4 mr-1" /> 모델 상세
        </Button>
        <div>
          <h1 className="text-xl font-bold">{model.displayName || model.modelName}</h1>
          <p className="text-sm text-muted-foreground">
            {model.brand?.name && <span className="mr-2">{model.brand.name}</span>}
            {model.unifiedCategory?.name && <span>{model.unifiedCategory.name}</span>}
          </p>
        </div>
      </div>

      {/* 가격 구성 카드 */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: '자재가', value: (model.materialCost ?? 0).toLocaleString() + '원' },
          { label: '마진율', value: (model.marginRate ?? 0) + '%' },
          { label: '시공비', value: (model.laborCost ?? 0).toLocaleString() + '원' },
          { label: '견적단가', value: (model.derivedUnitPrice ?? 0).toLocaleString() + '원', highlight: true },
        ].map((item) => (
          <Card key={item.label} className={`p-4 ${item.highlight ? 'bg-primary/5 border-primary/20' : ''}`}>
            <div className="text-sm text-muted-foreground">{item.label}</div>
            <div className={`text-lg font-bold mt-1 ${item.highlight ? 'text-primary' : ''}`}>{item.value}</div>
          </Card>
        ))}
      </div>

      {/* 사이트별 가격 표 */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">사이트별 현재 가격</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {lowestPrice && <span>최저 {lowestPrice.toLocaleString()}원</span>}
            {highestPrice && lowestPrice !== highestPrice && <span>최고 {highestPrice.toLocaleString()}원</span>}
            <Button size="sm" variant="outline" onClick={() => setShowManualForm(true)}>
              <Plus className="w-3 h-3 mr-1" /> 가격 추가
            </Button>
          </div>
        </div>

        {listings.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">연결된 사이트 없음</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left py-2 pr-4">사이트</th>
                  <th className="text-right py-2 pr-4">정상가</th>
                  <th className="text-right py-2 pr-4">할인가</th>
                  <th className="text-left py-2 pr-4">구분</th>
                  <th className="text-left py-2">메모</th>
                </tr>
              </thead>
              <tbody>
                {listings.map((l) => (
                  <tr key={l.id} className={`border-b last:border-0 ${l.isLowest ? 'bg-green-50' : ''}`}>
                    <td className="py-2 pr-4 font-medium">
                      {l.siteName}
                      {l.isLowest && <span className="ml-1 text-xs text-green-600 font-semibold">최저</span>}
                    </td>
                    <td className="py-2 pr-4 text-right">{l.currentPrice.toLocaleString()}원</td>
                    <td className="py-2 pr-4 text-right">
                      {l.currentDiscountPrice ? (
                        <span className="text-red-600 font-semibold">{l.currentDiscountPrice.toLocaleString()}원</span>
                      ) : '-'}
                    </td>
                    <td className="py-2 pr-4">
                      <Badge variant={l.isManual ? 'default' : 'secondary'}>
                        {l.isManual ? '수동' : '자동'}
                      </Badge>
                    </td>
                    <td className="py-2 text-muted-foreground text-xs">{l.manualPriceNote || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* 수동 가격 추가 폼 */}
      {showManualForm && (
        <Card className="p-4 border-blue-200 bg-blue-50/30">
          <h3 className="font-semibold mb-3">사이트 가격 직접 추가</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs mb-1">사이트 *</label>
              <select
                className="w-full border rounded px-2 py-1.5 text-sm"
                value={manualForm.siteId}
                onChange={(e) => setManualForm((p) => ({ ...p, siteId: e.target.value }))}
              >
                <option value="">선택</option>
                {sites?.map((s: { id: string; name: string }) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1">제품명 *</label>
              <input
                className="w-full border rounded px-2 py-1.5 text-sm"
                value={manualForm.productName}
                onChange={(e) => setManualForm((p) => ({ ...p, productName: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs mb-1">정상가 *</label>
              <input
                type="number"
                className="w-full border rounded px-2 py-1.5 text-sm"
                value={manualForm.currentPrice}
                onChange={(e) => setManualForm((p) => ({ ...p, currentPrice: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs mb-1">할인가</label>
              <input
                type="number"
                className="w-full border rounded px-2 py-1.5 text-sm"
                value={manualForm.currentDiscountPrice}
                onChange={(e) => setManualForm((p) => ({ ...p, currentDiscountPrice: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs mb-1">제품 URL</label>
              <input
                className="w-full border rounded px-2 py-1.5 text-sm"
                value={manualForm.productUrl}
                onChange={(e) => setManualForm((p) => ({ ...p, productUrl: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs mb-1">출처 메모</label>
              <input
                className="w-full border rounded px-2 py-1.5 text-sm"
                value={manualForm.manualPriceNote}
                onChange={(e) => setManualForm((p) => ({ ...p, manualPriceNote: e.target.value }))}
                placeholder="예: 쿠팡 2024-01 검색"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-3 justify-end">
            <Button variant="outline" size="sm" onClick={() => setShowManualForm(false)}>취소</Button>
            <Button
              size="sm"
              disabled={!manualForm.siteId || !manualForm.productName || !manualForm.currentPrice || addManualMutation.isPending}
              onClick={() => addManualMutation.mutate()}
            >
              {addManualMutation.isPending ? '추가중...' : '추가'}
            </Button>
          </div>
        </Card>
      )}

      {/* 가격 변동 차트 */}
      {chartData.length > 0 && (
        <Card className="p-4">
          <h2 className="font-semibold mb-3">가격 변동 (90일)</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => (v / 10000).toFixed(0) + '만'} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => (typeof v === 'number' ? v.toLocaleString() + '원' : v)} />
              <Legend />
              {priceHistory.map((ph, idx) => (
                <Line
                  key={ph.listingId}
                  type="monotone"
                  dataKey={ph.siteName}
                  stroke={SITE_COLORS[idx % SITE_COLORS.length]}
                  dot={false}
                  strokeWidth={2}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
}
