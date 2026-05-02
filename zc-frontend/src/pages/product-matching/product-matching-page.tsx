import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Input, Label } from '@/shared/ui';
import { Pagination } from '@/widgets/pagination/pagination';
import { useFetchStats } from '@/features/stats/api/useFetchStats';
import { useFetchUnmatchedProducts } from '@/features/product-models/api/useFetchUnmatchedProducts';
import { useFetchProductModels } from '@/features/product-models/api/useFetchProductModels';
import { useCreateProductModel } from '@/features/product-models/api/useCreateProductModel';
import { useFetchSites } from '@/features/sites/api/fetch-sites/useFetchSites';
import { useFetchModelLinksSearch } from '@/features/product-matching/api/fetch-model-links/useFetchModelLinksSearch';
import { useDeleteModelLink } from '@/features/product-matching/api/delete-model-link/useDeleteModelLink';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { axiosInstance } from '@/shared/api/axios';
import { ZC_API } from '@/shared/api/endpoints';

type Tab = 'unmatched' | 'matched';
type MatchMode = 'select' | 'create';

export function ProductMatchingPage() {
  const { data: stats } = useFetchStats();

  // ── 탭
  const [activeTab, setActiveTab] = useState<Tab>('unmatched');

  // ── 미매칭 탭 필터
  const [siteFilter, setSiteFilter] = useState('');
  const [unmatchedSearch, setUnmatchedSearch] = useState('');
  const [unmatchedPage, setUnmatchedPage] = useState(1);
  const debouncedUnmatchedSearch = useDebounce(unmatchedSearch, 400);

  const { data: sites } = useFetchSites();

  const { data: unmatchedData, isLoading: isLoadingUnmatched } = useFetchUnmatchedProducts({
    page: unmatchedPage,
    limit: 30,
    search: debouncedUnmatchedSearch || undefined,
    siteCode: siteFilter || undefined,
  });

  // 필터/검색 변경 시 선택 초기화 + 페이지 리셋
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    setSelectedProductIds(new Set());
    setUnmatchedPage(1);
  }, [siteFilter, debouncedUnmatchedSearch]);

  // ── 우측 패널
  const [matchMode, setMatchMode] = useState<MatchMode>('select');
  const [modelSearch, setModelSearch] = useState('');
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [newModelForm, setNewModelForm] = useState({ modelName: '', displayName: '', description: '' });
  const [isLinking, setIsLinking] = useState(false);

  const { data: modelsData } = useFetchProductModels({ search: modelSearch || undefined, limit: 20 });
  const createModel = useCreateProductModel();

  // ── 매칭됨 탭 필터
  const [matchedSearch, setMatchedSearch] = useState('');
  const [matchedPage, setMatchedPage] = useState(1);
  const [matchTypeFilter, setMatchTypeFilter] = useState<'auto_matched' | 'manual_matched' | ''>('');
  const debouncedMatchedSearch = useDebounce(matchedSearch, 400);

  const { data: matchedData, isLoading: isLoadingMatched } = useFetchModelLinksSearch({
    page: matchedPage,
    limit: 30,
    search: debouncedMatchedSearch || undefined,
    matchType: matchTypeFilter || undefined,
  });

  const deleteLink = useDeleteModelLink();

  // ────────────────────────────────────────────────────────
  // 미매칭 탭 핸들러
  // ────────────────────────────────────────────────────────
  const toggleProduct = (id: string) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (!unmatchedData) return;
    const ids = unmatchedData.items.map((p) => p.id);
    setSelectedProductIds(
      selectedProductIds.size === ids.length ? new Set() : new Set(ids),
    );
  };

  // 기존 모델에 연결
  const handleLinkToModel = async () => {
    if (!selectedModelId || selectedProductIds.size === 0) return;
    setIsLinking(true);
    let successCount = 0;
    const errors: string[] = [];
    for (const productId of Array.from(selectedProductIds)) {
      try {
        await axiosInstance.post(ZC_API.PRODUCT_MODELS.LINK_PRODUCT(selectedModelId), { productListingId: productId });
        successCount++;
      } catch (e: any) {
        errors.push(e.response?.data?.message || productId);
      }
    }
    setIsLinking(false);
    if (errors.length > 0) {
      alert(`${successCount}개 성공, ${errors.length}개 실패:\n${errors.join('\n')}`);
    } else {
      alert(`${successCount}개 제품이 모델에 연결되었습니다.`);
    }
    setSelectedProductIds(new Set());
    setSelectedModelId(null);
  };

  // 새 모델 생성 후 연결 (버그 수정: 반환 ID 직접 사용)
  const handleCreateAndLink = async () => {
    if (!newModelForm.modelName || !newModelForm.displayName) {
      alert('모델명과 표시명을 입력하세요.');
      return;
    }
    if (selectedProductIds.size === 0) {
      alert('연결할 제품을 선택하세요.');
      return;
    }
    setIsLinking(true);
    try {
      const created = await createModel.mutateAsync({
        modelName: newModelForm.modelName,
        displayName: newModelForm.displayName,
        description: newModelForm.description || undefined,
      });
      const createdId = (created as any)?.id ?? (created as any)?.data?.id;
      if (!createdId) throw new Error('모델 ID를 가져올 수 없습니다.');

      let successCount = 0;
      const errors: string[] = [];
      for (const productId of Array.from(selectedProductIds)) {
        try {
          await axiosInstance.post(ZC_API.PRODUCT_MODELS.LINK_PRODUCT(createdId), { productListingId: productId });
          successCount++;
        } catch (e: any) {
          errors.push(e.response?.data?.message || productId);
        }
      }
      if (errors.length > 0) {
        alert(`${successCount}개 성공, ${errors.length}개 실패:\n${errors.join('\n')}`);
      } else {
        alert(`새 모델 생성 후 ${successCount}개 제품이 연결되었습니다.`);
      }
      setSelectedProductIds(new Set());
      setNewModelForm({ modelName: '', displayName: '', description: '' });
    } catch (error: any) {
      alert(error.message || '처리에 실패했습니다.');
    } finally {
      setIsLinking(false);
    }
  };

  // ────────────────────────────────────────────────────────
  // 선택된 제품들의 브랜드 목록
  // ────────────────────────────────────────────────────────
  const selectedBrands = unmatchedData
    ? [...new Set(
        unmatchedData.items
          .filter((p) => selectedProductIds.has(p.id) && p.brand?.name)
          .map((p) => p.brand!.name),
      )]
    : [];

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold">제품 매칭</h1>
        <p className="text-sm text-muted-foreground mt-1">미매칭 제품을 선택해서 모델에 연결하고, 기존 매칭을 관리하세요</p>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: '총 제품', value: stats?.totalProducts ?? 0, color: '' },
          { label: '매칭 완료', value: stats?.matchedProducts ?? 0, color: 'text-green-600' },
          { label: '미매칭', value: stats?.unmatchedProducts ?? 0, color: 'text-orange-600' },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-3">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 탭 */}
      <div className="flex gap-1 border-b">
        {([['unmatched', '미매칭'], ['matched', '매칭됨']] as [Tab, string][]).map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}
            {tab === 'unmatched' && unmatchedData && (
              <span className="ml-1.5 text-xs bg-orange-100 text-orange-600 rounded-full px-1.5">
                {unmatchedData.total}
              </span>
            )}
            {tab === 'matched' && matchedData && (
              <span className="ml-1.5 text-xs bg-muted text-muted-foreground rounded-full px-1.5">
                {matchedData.total}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── 탭 1: 미매칭 ── */}
      {activeTab === 'unmatched' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 좌측: 미매칭 목록 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                미매칭 제품
                {selectedProductIds.size > 0 && (
                  <span className="ml-2 text-sm font-normal text-primary">{selectedProductIds.size}개 선택</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* 사이트 필터 */}
              <div className="flex flex-wrap gap-1.5">
                <Button size="sm" variant={siteFilter === '' ? 'default' : 'outline'} onClick={() => setSiteFilter('')}>전체</Button>
                {sites?.filter((s) => s.isActive).map((site) => (
                  <Button
                    key={site.id}
                    size="sm"
                    variant={siteFilter === site.code ? 'default' : 'outline'}
                    onClick={() => setSiteFilter(site.code)}
                  >
                    {site.name}
                  </Button>
                ))}
              </div>

              {/* 검색 */}
              <Input
                placeholder="제품명, 모델명 검색..."
                value={unmatchedSearch}
                onChange={(e) => setUnmatchedSearch(e.target.value)}
              />

              {/* 전체 선택 */}
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={!!unmatchedData?.items.length && selectedProductIds.size === unmatchedData.items.length}
                  onChange={toggleAll}
                  className="w-4 h-4"
                />
                <span className="font-medium">전체 선택</span>
                {unmatchedData && (
                  <span className="text-muted-foreground">({unmatchedData.items.length}개 표시)</span>
                )}
              </label>

              {/* 목록 */}
              <div className="max-h-[420px] overflow-y-auto space-y-1.5">
                {isLoadingUnmatched && (
                  <div className="text-center py-12 text-muted-foreground text-sm">불러오는 중...</div>
                )}
                {!isLoadingUnmatched && unmatchedData?.items.map((product) => (
                  <label
                    key={product.id}
                    className={`flex items-start gap-3 p-2.5 border rounded-lg hover:bg-gray-50 cursor-pointer ${
                      selectedProductIds.has(product.id) ? 'border-primary/50 bg-primary/5' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedProductIds.has(product.id)}
                      onChange={() => toggleProduct(product.id)}
                      className="w-4 h-4 mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{product.productName}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {product.brand?.name && <span className="mr-2">{product.brand.name}</span>}
                        {product.site?.name && <span>{product.site.name}</span>}
                      </div>
                      {product.extractedModelName && (
                        <Badge variant="outline" className="mt-1 text-xs">{product.extractedModelName}</Badge>
                      )}
                    </div>
                    <div className="text-sm font-medium text-green-700 whitespace-nowrap">
                      {(product.currentDiscountPrice ?? product.currentPrice).toLocaleString()}원
                    </div>
                  </label>
                ))}
                {!isLoadingUnmatched && !unmatchedData?.items.length && (
                  <div className="text-center py-12 text-muted-foreground text-sm">미매칭 제품이 없습니다</div>
                )}
              </div>

              {/* 페이지네이션 */}
              {unmatchedData && unmatchedData.totalPages > 1 && (
                <Pagination
                  currentPage={unmatchedPage}
                  totalPages={unmatchedData.totalPages}
                  onPageChange={setUnmatchedPage}
                />
              )}
            </CardContent>
          </Card>

          {/* 우측: 모델 선택/생성 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">모델 선택 / 생성</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* 선택된 제품 브랜드 힌트 */}
              {selectedBrands.length > 0 && (
                <div className="p-2 rounded bg-muted/50 text-xs text-muted-foreground">
                  선택된 제품 브랜드: {selectedBrands.join(', ')}
                </div>
              )}

              {/* 모드 토글 */}
              <div className="flex gap-2">
                <Button size="sm" variant={matchMode === 'select' ? 'default' : 'outline'} onClick={() => setMatchMode('select')}>
                  기존 모델 선택
                </Button>
                <Button size="sm" variant={matchMode === 'create' ? 'default' : 'outline'} onClick={() => setMatchMode('create')}>
                  새 모델 생성
                </Button>
              </div>

              {/* 기존 모델 선택 */}
              {matchMode === 'select' && (
                <div className="space-y-3">
                  <Input
                    placeholder="모델 검색..."
                    value={modelSearch}
                    onChange={(e) => setModelSearch(e.target.value)}
                  />
                  <div className="max-h-[340px] overflow-y-auto space-y-1.5">
                    {modelsData?.data.map((model) => (
                      <label
                        key={model.id}
                        className={`flex items-start gap-3 p-2.5 border rounded-lg cursor-pointer transition-colors ${
                          selectedModelId === model.id ? 'bg-blue-50 border-blue-400' : 'hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="model"
                          checked={selectedModelId === model.id}
                          onChange={() => setSelectedModelId(model.id)}
                          className="w-4 h-4 mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{model.displayName}</div>
                          <div className="text-xs text-muted-foreground">{model.modelName}</div>
                          {model.brand && <Badge variant="outline" className="mt-1 text-xs">{model.brand.name}</Badge>}
                        </div>
                        {model.derivedUnitPrice != null && (
                          <span className="text-xs text-primary font-medium whitespace-nowrap">
                            {model.derivedUnitPrice.toLocaleString()}원
                          </span>
                        )}
                      </label>
                    ))}
                    {!modelsData?.data.length && (
                      <div className="text-center py-8 text-muted-foreground text-sm">모델이 없습니다</div>
                    )}
                  </div>
                  <Button
                    onClick={handleLinkToModel}
                    disabled={!selectedModelId || selectedProductIds.size === 0 || isLinking}
                    className="w-full"
                  >
                    {isLinking ? '연결 중...' : `선택한 ${selectedProductIds.size}개 제품 연결`}
                  </Button>
                </div>
              )}

              {/* 새 모델 생성 */}
              {matchMode === 'create' && (
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">모델명 *</Label>
                    <Input
                      value={newModelForm.modelName}
                      onChange={(e) => setNewModelForm({ ...newModelForm, modelName: e.target.value })}
                      placeholder="예: WL900-NS"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">표시명 *</Label>
                    <Input
                      value={newModelForm.displayName}
                      onChange={(e) => setNewModelForm({ ...newModelForm, displayName: e.target.value })}
                      placeholder="예: 세면대 WL900"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">설명</Label>
                    <Input
                      value={newModelForm.description}
                      onChange={(e) => setNewModelForm({ ...newModelForm, description: e.target.value })}
                      placeholder="모델 설명 (선택)"
                    />
                  </div>
                  <Button
                    onClick={handleCreateAndLink}
                    disabled={!newModelForm.modelName || !newModelForm.displayName || selectedProductIds.size === 0 || isLinking}
                    className="w-full"
                  >
                    {isLinking ? '처리 중...' : `새 모델 생성 후 ${selectedProductIds.size}개 제품 연결`}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── 탭 2: 매칭됨 ── */}
      {activeTab === 'matched' && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-base">매칭된 항목</CardTitle>
              <div className="flex gap-2 flex-wrap">
                {/* matchType 필터 */}
                {(['', 'manual_matched', 'auto_matched'] as const).map((val) => (
                  <Button
                    key={val}
                    size="sm"
                    variant={matchTypeFilter === val ? 'default' : 'outline'}
                    onClick={() => { setMatchTypeFilter(val as '' | 'manual_matched' | 'auto_matched'); setMatchedPage(1); }}
                  >
                    {val === '' ? '전체' : val === 'manual_matched' ? '수동' : '자동'}
                  </Button>
                ))}
                {/* 검색 */}
                <Input
                  className="w-48"
                  placeholder="제품명, 모델명 검색..."
                  value={matchedSearch}
                  onChange={(e) => { setMatchedSearch(e.target.value); setMatchedPage(1); }}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingMatched && (
              <div className="text-center py-12 text-muted-foreground text-sm">불러오는 중...</div>
            )}

            {!isLoadingMatched && (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="py-2 pr-3 font-medium">제품명</th>
                        <th className="py-2 pr-3 font-medium">모델명</th>
                        <th className="py-2 pr-3 font-medium">브랜드</th>
                        <th className="py-2 pr-3 font-medium">사이트</th>
                        <th className="py-2 pr-3 font-medium">방식</th>
                        <th className="py-2 pr-3 font-medium">연결일</th>
                        <th className="py-2 font-medium"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {matchedData?.data.map((link) => (
                        <tr key={link.id} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="py-2 pr-3 max-w-[160px] truncate">
                            {link.listing?.productName ?? '-'}
                          </td>
                          <td className="py-2 pr-3 text-muted-foreground">
                            {link.model?.modelName ?? '-'}
                          </td>
                          <td className="py-2 pr-3">
                            {link.listing?.brand?.name ?? link.model?.brand?.name ?? '-'}
                          </td>
                          <td className="py-2 pr-3">
                            {link.listing?.site?.name ?? '-'}
                          </td>
                          <td className="py-2 pr-3">
                            <Badge variant={link.matchType === 'auto_matched' ? 'secondary' : 'default'} className="text-xs">
                              {link.matchType === 'auto_matched' ? '자동' : '수동'}
                            </Badge>
                          </td>
                          <td className="py-2 pr-3 text-muted-foreground whitespace-nowrap">
                            {link.linkedAt ? new Date(link.linkedAt).toLocaleDateString('ko-KR') : '-'}
                          </td>
                          <td className="py-2">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                if (confirm('매칭을 해제하시겠습니까?')) {
                                  deleteLink.mutate(link.id);
                                }
                              }}
                              disabled={deleteLink.isPending}
                            >
                              해제
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {!matchedData?.data.length && (
                    <div className="text-center py-12 text-muted-foreground text-sm">
                      매칭된 항목이 없습니다
                    </div>
                  )}
                </div>

                {matchedData && matchedData.totalPages > 1 && (
                  <Pagination
                    currentPage={matchedPage}
                    totalPages={matchedData.totalPages}
                    onPageChange={setMatchedPage}
                    className="mt-4"
                  />
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
