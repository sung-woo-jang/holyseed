import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { categoriesApi, productsApi } from '@/lib/pc-api'
import type { CategoryNode } from '@/lib/pc-api'
import { qk } from '@/queries/keys'

function flattenTree(nodes: CategoryNode[], depth = 0): { id: number; label: string }[] {
  return nodes.flatMap((n) => [
    { id: n.id, label: '　'.repeat(depth) + (depth > 0 ? '› ' : '') + n.name },
    ...flattenTree(n.children, depth + 1),
  ])
}

export function EditProductPage() {
  const { id } = useParams<{ id: string }>()
  const productId = parseInt(id!)
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: qk.productDetail(productId),
    queryFn: () => productsApi.one(productId),
  })

  const { data: treeData } = useQuery({
    queryKey: qk.categoryTree(),
    queryFn: categoriesApi.tree,
  })

  const [form, setForm] = useState({
    modelCode: '',
    displayName: '',
    categoryId: '' as string | number,
    brand: '',
    spec: '',
    description: '',
    unit: 'EA',
    note: '',
    isActive: true,
  })

  useEffect(() => {
    if (!data) return
    setForm({
      modelCode: data.modelCode,
      displayName: data.displayName,
      categoryId: data.categoryId,
      brand: data.brand ?? '',
      spec: data.spec ?? '',
      description: data.description ?? '',
      unit: data.unit ?? 'EA',
      note: data.note ?? '',
      isActive: data.isActive,
    })
  }, [data])

  const update = useMutation({
    mutationFn: () =>
      productsApi.update(productId, {
        modelCode: form.modelCode,
        displayName: form.displayName,
        categoryId: Number(form.categoryId),
        brand: form.brand || undefined,
        spec: form.spec || undefined,
        description: form.description || undefined,
        unit: form.unit || 'EA',
        note: form.note || undefined,
        isActive: form.isActive,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.productDetail(productId) })
      qc.invalidateQueries({ queryKey: ['compare'] })
      qc.invalidateQueries({ queryKey: ['products'] })
      navigate(`/products/${productId}`)
    },
  })

  const set = (key: string, value: unknown) => setForm((f) => ({ ...f, [key]: value }))

  const categories = treeData ? flattenTree(treeData) : []

  if (isLoading) return <div className="p-6 text-gray-400">로딩 중...</div>
  if (!data) return <div className="p-6 text-gray-400">제품을 찾을 수 없습니다.</div>

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => navigate(`/products/${productId}`)} className="text-sm text-gray-500 hover:text-gray-700">← 뒤로</button>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-900 font-medium">제품 수정</span>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">모델코드 *</label>
            <input
              value={form.modelCode}
              onChange={(e) => set('modelCode', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">카테고리 *</label>
            <select
              value={form.categoryId}
              onChange={(e) => set('categoryId', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">선택...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">제품명 *</label>
          <input
            value={form.displayName}
            onChange={(e) => set('displayName', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">브랜드</label>
            <input
              value={form.brand}
              onChange={(e) => set('brand', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">단위</label>
            <input
              value={form.unit}
              onChange={(e) => set('unit', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="EA"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">스펙</label>
          <input
            value={form.spec}
            onChange={(e) => set('spec', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="가로600, 실버, 가로600 높이700 등"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">설명 <span className="text-gray-400">(내 메모용 — 제품 특징, 시공 팁 등)</span></label>
          <textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="예) 원룸 시공 시 자주 사용. 한샘 후드 대체품으로 많이 쓰임."
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">비고</label>
          <input
            value={form.note}
            onChange={(e) => set('note', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="단종 예정, 재고한정 등"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            checked={form.isActive}
            onChange={(e) => set('isActive', e.target.checked)}
            className="rounded"
          />
          <label htmlFor="isActive" className="text-sm text-gray-700">활성 상태</label>
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <button onClick={() => navigate(`/products/${productId}`)} className="text-sm text-gray-500 hover:text-gray-700">
            취소
          </button>
          <button
            onClick={() => update.mutate()}
            disabled={!form.modelCode || !form.displayName || !form.categoryId || update.isPending}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {update.isPending ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  )
}
