import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
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
  const navigate = useNavigate()
  const qc = useQueryClient()
  const showToast = useToastStore((s) => s.show)
  const dropRef = useRef<HTMLDivElement>(null)

  const [form, setForm] = useState({
    modelCode: '', displayName: '', categoryId: '', brand: '', spec: '', unit: 'EA', note: '', description: '',
  })
  const [prices, setPrices] = useState<PriceRow[]>([{ vendorId: 0, price: '', note: '' }])
  const [featureLabels, setFeatureLabels] = useState<string[]>([])
  const [featureInput, setFeatureInput] = useState('')
  const [colorLabels, setColorLabels] = useState<string[]>([])
  const [colorInput, setColorInput] = useState('')
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [saving, setSaving] = useState(false)

  const { data: categories } = useQuery({ queryKey: pcKeys.categoriesAll(), queryFn: pcCategoriesApi.all })
  const { data: vendors } = useQuery({ queryKey: pcKeys.vendorsAll(), queryFn: pcVendorsApi.all })

  const flatCategories = categories ? flattenCategories(categories as PcCategoryNode[]) : []

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }))

  const addImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) { showToast('이미지 파일만 추가할 수 있어요', 'error'); return }
    setImageFiles((prev) => [...prev, file])
  }

  const handleImageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) addImageFile(file)
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) addImageFile(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.modelCode.trim()) { showToast('모델코드를 입력해주세요', 'error'); return }
    if (!form.displayName.trim()) { showToast('제품명을 입력해주세요', 'error'); return }
    if (!form.categoryId) { showToast('카테고리를 선택해주세요', 'error'); return }
    setSaving(true)
    try {
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

      await Promise.all([
        ...prices.filter((r) => r.vendorId && r.price).map((row) =>
          pcPricesApi.upsert({ productId: product.id, vendorId: row.vendorId, price: parseFloat(row.price), note: row.note || undefined })
        ),
        featureLabels.length > 0 ? pcProductsApi.setFeatures(product.id, featureLabels) : Promise.resolve(),
        colorLabels.length > 0 ? pcProductsApi.setColors(product.id, colorLabels) : Promise.resolve(),
      ])

      for (let i = 0; i < imageFiles.length; i++) {
        await pcProductsApi.uploadImage(product.id, imageFiles[i], i === 0, i)
      }

      await qc.invalidateQueries({ queryKey: ['pc-products'] })
      showToast('제품이 등록됐어요')
      navigate(`/admin/pc/products/${product.id}`)
    } catch (err: any) {
      showToast(err.response?.data?.message || '저장 실패', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div className="steps">
          <span className="link" style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/pc/compare?categoryId=all')}>제품</span>
          <span className="sep">›</span>
          <b>새 제품 등록</b>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="btn ghost sm" onClick={() => navigate(-1)}>취소</button>
          <button type="submit" className="btn primary sm" disabled={saving}>{saving ? '저장 중...' : '등록'}</button>
        </div>
      </div>

      {/* 기본 정보 */}
      <div className="card card-pad mb-16">
        <h3 className="h3 mb-16">기본 정보</h3>
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>모델코드 *</div>
              <input className="input" value={form.modelCode} onChange={set('modelCode')} placeholder="예: G60AL" style={{ fontFamily: 'monospace' }} required />
            </label>
            <label>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>카테고리 *</div>
              <select className="input" value={form.categoryId} onChange={set('categoryId')} required>
                <option value="">선택...</option>
                {flatCategories.map((c) => (
                  <option key={c.id} value={c.id}>{' '.repeat(c.depth * 3)}{c.name}</option>
                ))}
              </select>
            </label>
          </div>
          <label>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>제품명 *</div>
            <input className="input" value={form.displayName} onChange={set('displayName')} placeholder="예: G60 실버 슬라이드후드" required />
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px', gap: 12 }}>
            <label>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>브랜드</div>
              <input className="input" value={form.brand} onChange={set('brand')} placeholder="예: 린나이" />
            </label>
            <label>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>스펙/사양</div>
              <input className="input" value={form.spec} onChange={set('spec')} placeholder="예: 기본형 실버 가로600" />
            </label>
            <label>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>단위</div>
              <input className="input" value={form.unit} onChange={set('unit')} />
            </label>
          </div>
          <label>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>비고</div>
            <input className="input" value={form.note} onChange={set('note')} />
          </label>
          <label>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>설명 (내부 메모)</div>
            <textarea className="input" rows={2} value={form.description} onChange={set('description')} style={{ resize: 'vertical' }} />
          </label>
        </div>
      </div>

      {/* 고객 사이트 연결 — 등록 후 detail에서 설정 */}
      <div className="card card-pad mb-16" style={{ background: 'var(--bg-deep)', borderStyle: 'dashed' }}>
        <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>
          고객 사이트 연결은 등록 후 상세 페이지에서 설정할 수 있어요.
        </div>
      </div>

      {/* 제품 특징 */}
      <div className="card card-pad mb-16">
        <h3 className="h3 mb-8">제품 특징</h3>
        <p style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 12 }}>고객 상세 "왜 이 제품인가요" 항목으로 노출됩니다.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {featureLabels.map((label, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'var(--bg-deep)', borderRadius: 20, fontSize: 13 }}>
              {label}
              <button type="button" onClick={() => setFeatureLabels((prev) => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', lineHeight: 1, padding: 0, fontSize: 14 }}>×</button>
            </span>
          ))}
          {featureLabels.length === 0 && <span style={{ fontSize: 13, color: 'var(--ink-4)' }}>없음</span>}
        </div>
        <input
          className="input"
          placeholder="특징 입력 후 Enter"
          value={featureInput}
          onChange={(e) => setFeatureInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              const v = featureInput.trim()
              if (v) { setFeatureLabels((prev) => [...prev, v]); setFeatureInput('') }
            }
          }}
          style={{ fontSize: 13 }}
        />
      </div>

      {/* 색상/옵션 */}
      <div className="card card-pad mb-16">
        <h3 className="h3 mb-8">색상 / 옵션</h3>
        <p style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 12 }}>고객 상세 "선택 가능 색상" 및 사양표에 노출됩니다.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {colorLabels.map((label, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'var(--bg-deep)', borderRadius: 20, fontSize: 13 }}>
              {label}
              <button type="button" onClick={() => setColorLabels((prev) => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', lineHeight: 1, padding: 0, fontSize: 14 }}>×</button>
            </span>
          ))}
          {colorLabels.length === 0 && <span style={{ fontSize: 13, color: 'var(--ink-4)' }}>없음</span>}
        </div>
        <input
          className="input"
          placeholder="색상/옵션 입력 후 Enter"
          value={colorInput}
          onChange={(e) => setColorInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              const v = colorInput.trim()
              if (v) { setColorLabels((prev) => [...prev, v]); setColorInput('') }
            }
          }}
          style={{ fontSize: 13 }}
        />
      </div>

      {/* 이미지 */}
      <div className="card card-pad mb-16">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 className="h3">이미지</h3>
          <label className="btn ghost sm">
            + 이미지 추가
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageInput} />
          </label>
        </div>
        <div
          ref={dropRef}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${dragOver ? 'var(--color-primary, #3182ce)' : 'var(--ink-5)'}`,
            borderRadius: 10, padding: '16px 12px',
            background: dragOver ? 'rgba(49,130,206,0.05)' : 'var(--bg-deep)',
            transition: 'all 0.15s',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {imageFiles.map((file, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <img
                  src={URL.createObjectURL(file)}
                  alt=""
                  style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 8, border: `2px solid ${i === 0 ? 'var(--color-primary, #3182ce)' : 'var(--ink-6)'}` }}
                />
                {i === 0 && (
                  <div style={{ position: 'absolute', top: 4, left: 4, background: 'var(--color-primary, #3182ce)', color: '#fff', fontSize: 10, padding: '1px 4px', borderRadius: 3 }}>대표</div>
                )}
                <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                  <button
                    type="button"
                    className="btn ghost sm"
                    style={{ fontSize: 11, padding: '2px 6px', color: 'var(--ink-3)' }}
                    onClick={() => setImageFiles((prev) => prev.filter((_, j) => j !== i))}
                  >삭제</button>
                </div>
              </div>
            ))}
            {imageFiles.length === 0 && !dragOver && (
              <div style={{ color: 'var(--ink-4)', fontSize: 13, width: '100%', textAlign: 'center', padding: '12px 0' }}>
                이미지를 여기에 끌어다 놓거나 위 버튼으로 추가하세요
              </div>
            )}
            {dragOver && (
              <div style={{ color: 'var(--color-primary, #3182ce)', fontSize: 13, fontWeight: 600, width: '100%', textAlign: 'center', padding: '12px 0' }}>
                놓으면 추가돼요
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 업체별 가격 */}
      <div className="card card-pad mb-16">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 className="h3">업체별 가격</h3>
          <button type="button" className="btn ghost sm" onClick={() => setPrices((p) => [...p, { vendorId: 0, price: '', note: '' }])}>+ 업체 추가</button>
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
    </form>
  )
}
