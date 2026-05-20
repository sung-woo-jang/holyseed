import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { categoriesApi, vendorsApi, productsApi, pricesApi } from '@/lib/pc-api'
import { qk } from '@/queries/keys'

interface PriceRow { vendorId: number; price: string; note: string }

export function NewProductPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [form, setForm] = useState({
    modelCode: '',
    displayName: '',
    categoryId: '',
    brand: '',
    spec: '',
    unit: 'EA',
    note: '',
  })
  const [prices, setPrices] = useState<PriceRow[]>([{ vendorId: 0, price: '', note: '' }])
  const [error, setError] = useState('')

  const { data: categories } = useQuery({ queryKey: qk.categoriesAll(), queryFn: categoriesApi.all })
  const { data: vendors } = useQuery({ queryKey: qk.vendorsAll(), queryFn: vendorsApi.all })

  const create = useMutation({
    mutationFn: async () => {
      const product = await productsApi.create({
        modelCode: form.modelCode.trim(),
        displayName: form.displayName.trim(),
        categoryId: parseInt(form.categoryId),
        brand: form.brand || undefined,
        spec: form.spec || undefined,
        unit: form.unit,
        note: form.note || undefined,
      })
      for (const row of prices) {
        if (row.vendorId && row.price) {
          await pricesApi.upsert({ productId: product.id, vendorId: row.vendorId, price: parseFloat(row.price), note: row.note || undefined })
        }
      }
      return product
    },
    onSuccess: (product) => {
      qc.invalidateQueries({ queryKey: ['products'] })
      qc.invalidateQueries({ queryKey: ['compare'] })
      navigate(`/products/${product.id}`)
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || '제품 등록에 실패했습니다.')
    },
  })

  const addPriceRow = () => setPrices((prev) => [...prev, { vendorId: 0, price: '', note: '' }])
  const removePriceRow = (i: number) => setPrices((prev) => prev.filter((_, idx) => idx !== i))

  const flatCategories = categories?.filter((c) => !('children' in c) || true) || []

  const renderCategoryOptions = (nodes: typeof flatCategories, depth = 0): React.ReactNode[] =>
    nodes.flatMap((n: any) => [
      <option key={n.id} value={n.id}>{' '.repeat(depth * 3)}{n.name}</option>,
      ...(n.children ? renderCategoryOptions(n.children, depth + 1) : []),
    ])

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => navigate(-1)} className="text-sm text-gray-500 hover:text-gray-700">← 뒤로</button>
        <span className="text-gray-300">/</span>
        <span className="text-sm font-medium">새 제품 등록</span>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-xl font-bold text-gray-900 mb-6">제품 등록</h1>

        {error && <p className="text-sm text-red-600 mb-4 p-3 bg-red-50 rounded-lg">{error}</p>}

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">모델코드 *</label>
              <input
                value={form.modelCode}
                onChange={(e) => setForm((f) => ({ ...f, modelCode: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="예: G60AL"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">카테고리 *</label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">선택...</option>
                {categories && renderCategoryOptions(categories as any)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">제품명 *</label>
            <input
              value={form.displayName}
              onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="예: G60 실버 슬라이드후드"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">브랜드</label>
              <input
                value={form.brand}
                onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="예: 린나이"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">단위</label>
              <input
                value={form.unit}
                onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">스펙/사양</label>
            <textarea
              value={form.spec}
              onChange={(e) => setForm((f) => ({ ...f, spec: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="예: 기본형 실버 가로600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">비고</label>
            <input
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 가격 입력 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">업체별 가격</label>
              <button onClick={addPriceRow} className="text-sm text-blue-600 hover:text-blue-800">+ 업체 추가</button>
            </div>
            <div className="space-y-2">
              {prices.map((row, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <select
                    value={row.vendorId}
                    onChange={(e) => setPrices((prev) => prev.map((p, idx) => idx === i ? { ...p, vendorId: parseInt(e.target.value) } : p))}
                    className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm flex-1"
                  >
                    <option value={0}>업체 선택</option>
                    {vendors?.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                  <input
                    type="number"
                    value={row.price}
                    onChange={(e) => setPrices((prev) => prev.map((p, idx) => idx === i ? { ...p, price: e.target.value } : p))}
                    placeholder="가격"
                    className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm w-28"
                  />
                  <input
                    value={row.note}
                    onChange={(e) => setPrices((prev) => prev.map((p, idx) => idx === i ? { ...p, note: e.target.value } : p))}
                    placeholder="비고"
                    className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm w-28"
                  />
                  {prices.length > 1 && (
                    <button onClick={() => removePriceRow(i)} className="text-gray-400 hover:text-red-500">×</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => navigate(-1)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">취소</button>
            <button
              onClick={() => create.mutate()}
              disabled={!form.modelCode || !form.displayName || !form.categoryId || create.isPending}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {create.isPending ? '등록 중...' : '제품 등록'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
