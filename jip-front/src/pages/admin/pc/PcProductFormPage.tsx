import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { pcCategoriesApi, pcVendorsApi, pcProductsApi, pcPricesApi, pcKeys } from '@/queries/pc'
import type { PcCategoryNode } from '@/queries/pc'
import { useToastStore } from '@/stores/toast'

interface PriceRow { vendorId: number; price: string; note: string }

function flattenCategories(nodes: PcCategoryNode[], depth = 0): Array<{ id: number; name: string; depth: number }> {
  return nodes.flatMap((n) => [
    { id: n.id, name: n.name, depth },
    ...flattenCategories(n.children ?? [], depth + 1),
  ])
}

export default function PcProductFormPage() {
  const { id } = useParams<{ id: string }>()
  const productId = id ? parseInt(id) : undefined
  const isEdit = !!productId
  const navigate = useNavigate()
  const qc = useQueryClient()
  const showToast = useToastStore((s) => s.show)

  const [form, setForm] = useState({
    modelCode: '',
    displayName: '',
    categoryId: '',
    brand: '',
    spec: '',
    unit: 'EA',
    note: '',
    description: '',
  })
  const [prices, setPrices] = useState<PriceRow[]>([{ vendorId: 0, price: '', note: '' }])
  const [saving, setSaving] = useState(false)

  const { data: categories } = useQuery({ queryKey: pcKeys.categoriesAll(), queryFn: pcCategoriesApi.all })
  const { data: vendors } = useQuery({ queryKey: pcKeys.vendorsAll(), queryFn: pcVendorsApi.all })
  const { data: existing, isLoading } = useQuery({
    queryKey: pcKeys.productDetail(productId!),
    queryFn: () => pcProductsApi.one(productId!),
    enabled: isEdit,
  })

  useEffect(() => {
    if (!existing) return
    setForm({
      modelCode: existing.modelCode,
      displayName: existing.displayName,
      categoryId: String(existing.categoryId),
      brand: existing.brand || '',
      spec: existing.spec || '',
      unit: existing.unit,
      note: existing.note || '',
      description: existing.description || '',
    })
  }, [existing])

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.modelCode.trim()) { showToast('모델코드를 입력해주세요', 'error'); return }
    if (!form.displayName.trim()) { showToast('제품명을 입력해주세요', 'error'); return }
    if (!form.categoryId) { showToast('카테고리를 선택해주세요', 'error'); return }
    setSaving(true)
    try {
      if (isEdit) {
        await pcProductsApi.update(productId, {
          displayName: form.displayName.trim(),
          categoryId: parseInt(form.categoryId),
          brand: form.brand || undefined,
          spec: form.spec || undefined,
          unit: form.unit,
          note: form.note || undefined,
          description: form.description || undefined,
        })
        await qc.invalidateQueries({ queryKey: pcKeys.productDetail(productId) })
        showToast('제품이 수정됐어요')
        navigate(`/admin/pc/products/${productId}`)
      } else {
        const product = await pcProductsApi.create({
          modelCode: form.modelCode.trim(),
          displayName: form.displayName.trim(),
          categoryId: parseInt(form.categoryId),
          brand: form.brand || undefined,
          spec: form.spec || undefined,
          unit: form.unit,
          note: form.note || undefined,
          description: form.description || undefined,
        })
        for (const row of prices) {
          if (row.vendorId && row.price) {
            await pcPricesApi.upsert({
              productId: product.id,
              vendorId: row.vendorId,
              price: parseFloat(row.price),
              note: row.note || undefined,
            })
          }
        }
        await qc.invalidateQueries({ queryKey: ['pc-products'] })
        showToast('제품이 등록됐어요')
        navigate(`/admin/pc/products/${product.id}`)
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || '저장 실패', 'error')
    } finally {
      setSaving(false)
    }
  }

  const flatCategories = categories ? flattenCategories(categories as PcCategoryNode[]) : []

  if (isEdit && isLoading) return <div className="empty">불러오는 중...</div>

  return (
    <form onSubmit={handleSubmit}>
      <div className="steps mb-16">
        <span className="link" style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/pc/products')}>
          제품
        </span>
        <span className="sep">›</span>
        <b>{isEdit ? form.displayName || id : '새 제품 등록'}</b>
      </div>
      <h1 className="h2 mb-24">{isEdit ? '제품 수정' : '제품 등록'}</h1>

      <div className="card card-pad mb-16">
        <h3 className="h3 mb-16">기본 정보</h3>
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>모델코드 *{isEdit && <span style={{ fontWeight: 400, color: 'var(--ink-3)' }}> (변경 불가)</span>}</div>
              <input className="input" value={form.modelCode} onChange={set('modelCode')} placeholder="예: G60AL" disabled={isEdit} required />
            </label>
            <label>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>카테고리 *</div>
              <select className="input" value={form.categoryId} onChange={set('categoryId')} required>
                <option value="">선택...</option>
                {flatCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {' '.repeat(c.depth * 3)}{c.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>제품명 *</div>
            <input className="input" value={form.displayName} onChange={set('displayName')} placeholder="예: G60 실버 슬라이드후드" required />
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>브랜드</div>
              <input className="input" value={form.brand} onChange={set('brand')} placeholder="예: 린나이" />
            </label>
            <label>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>단위</div>
              <input className="input" value={form.unit} onChange={set('unit')} />
            </label>
          </div>
          <label>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>스펙/사양</div>
            <textarea className="input" rows={2} value={form.spec} onChange={set('spec')} placeholder="예: 기본형 실버 가로600" style={{ resize: 'vertical' }} />
          </label>
          <label>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>비고</div>
            <input className="input" value={form.note} onChange={set('note')} />
          </label>
          <label>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>설명 (내부 메모)</div>
            <textarea className="input" rows={2} value={form.description} onChange={set('description')} style={{ resize: 'vertical' }} />
          </label>
        </div>
      </div>

      {!isEdit && (
        <div className="card card-pad mb-24">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 className="h3">업체별 가격</h3>
            <button
              type="button"
              className="btn ghost sm"
              onClick={() => setPrices((p) => [...p, { vendorId: 0, price: '', note: '' }])}
            >
              + 업체 추가
            </button>
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            {prices.map((row, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <select
                  className="input"
                  value={row.vendorId}
                  onChange={(e) => setPrices((p) => p.map((r, idx) => idx === i ? { ...r, vendorId: parseInt(e.target.value) } : r))}
                  style={{ flex: 1 }}
                >
                  <option value={0}>업체 선택</option>
                  {vendors?.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
                <input
                  type="number"
                  className="input"
                  value={row.price}
                  onChange={(e) => setPrices((p) => p.map((r, idx) => idx === i ? { ...r, price: e.target.value } : r))}
                  placeholder="가격"
                  style={{ width: 120 }}
                />
                <input
                  className="input"
                  value={row.note}
                  onChange={(e) => setPrices((p) => p.map((r, idx) => idx === i ? { ...r, note: e.target.value } : r))}
                  placeholder="비고"
                  style={{ width: 120 }}
                />
                {prices.length > 1 && (
                  <button type="button" className="btn ghost sm" onClick={() => setPrices((p) => p.filter((_, idx) => idx !== i))}>×</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12 }}>
        <button type="submit" className="btn primary lg" disabled={saving}>
          {saving ? '저장 중...' : isEdit ? '수정 저장' : '제품 등록'}
        </button>
        <button type="button" className="btn ghost lg" onClick={() => navigate(-1)}>취소</button>
      </div>
    </form>
  )
}
