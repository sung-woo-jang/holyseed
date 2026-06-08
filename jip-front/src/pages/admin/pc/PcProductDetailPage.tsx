import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { pcProductsApi, pcVendorsApi, pcPricesApi, pcCategoriesApi, pcKeys } from '@/queries/pc'
import type { PcCategoryNode } from '@/queries/pc'
import type { ReviewItem, FaqItem, TrustBadgeItem, InstallStepItem } from '@/types'
import { useServiceItems } from '@/queries/catalog'
import { useToastStore } from '@/stores/toast'

function flattenCategories(nodes: PcCategoryNode[], depth = 0): Array<{ id: number; name: string; depth: number }> {
  return nodes.flatMap((n) => [
    { id: n.id, name: n.name, depth },
    ...flattenCategories(n.children ?? [], depth + 1),
  ])
}

function ImageLightbox({ url, onClose }: { url: string; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'zoom-out',
      }}
    >
      <img
        src={url}
        alt=""
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8, cursor: 'default', boxShadow: '0 8px 48px rgba(0,0,0,0.5)' }}
      />
      <button
        onClick={onClose}
        style={{ position: 'absolute', top: 20, right: 24, background: 'none', border: 'none', color: '#fff', fontSize: 32, cursor: 'pointer', lineHeight: 1 }}
      >×</button>
    </div>
  )
}

const IMAGE_ROLES = ['main', 'detail', 'example', 'color'] as const

export default function PcProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const productId = parseInt(id!)
  const navigate = useNavigate()
  const qc = useQueryClient()
  const showToast = useToastStore((s) => s.show)

  const [showAddPrice, setShowAddPrice] = useState(false)
  const [newPrice, setNewPrice] = useState({ vendorId: '', price: '', note: '' })
  const [editingPriceId, setEditingPriceId] = useState<number | null>(null)
  const [editingPrice, setEditingPrice] = useState({ price: '', note: '' })
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)
  const [saving, setSaving] = useState(false)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  const [basicForm, setBasicForm] = useState({
    modelCode: '', displayName: '', categoryId: '', brand: '', spec: '', unit: 'EA',
    note: '', description: '', intro: '', tagline: '',
  })
  const [linkForm, setLinkForm] = useState({ serviceItemId: '', code: '', illustKind: '', sortOrder: '0' })
  const [features, setFeatures] = useState<{ label: string; description: string }[]>([])
  const [colorLabels, setColorLabels] = useState<string[]>([])
  const [colorInput, setColorInput] = useState('')

  // 고객 상세 콘텐츠
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [faqs, setFaqs] = useState<FaqItem[]>([])
  const [trustBadges, setTrustBadges] = useState<TrustBadgeItem[]>([])
  const [installSteps, setInstallSteps] = useState<InstallStepItem[]>([])

  const { data, isLoading } = useQuery({
    queryKey: pcKeys.productDetail(productId),
    queryFn: () => pcProductsApi.one(productId),
  })

  const { data: vendors } = useQuery({ queryKey: pcKeys.vendorsAll(), queryFn: pcVendorsApi.all })
  const { data: categories } = useQuery({ queryKey: pcKeys.categoriesAll(), queryFn: pcCategoriesApi.all })
  const { data: serviceItems } = useServiceItems()

  const flatCategories = categories ? flattenCategories(categories as PcCategoryNode[]) : []

  const invalidate = () => qc.invalidateQueries({ queryKey: pcKeys.productDetail(productId) })

  useEffect(() => {
    if (!data) return
    setBasicForm({
      modelCode: data.modelCode,
      displayName: data.displayName,
      categoryId: String(data.categoryId),
      brand: data.brand || '',
      spec: data.spec || '',
      unit: data.unit,
      note: data.note || '',
      description: data.description || '',
      intro: data.intro || '',
      tagline: data.tagline || '',
    })
    if (data.features) setFeatures(data.features.map((f) => ({ label: f.label, description: f.description ?? '' })))
    if (data.colors) setColorLabels(data.colors.map((c) => c.label))
    setReviews(data.reviews ?? [])
    setFaqs(data.faqs ?? [])
    setTrustBadges(data.trustBadges ?? [])
    setInstallSteps(data.installSteps ?? [])
  }, [data?.id])

  const setBasic = (k: keyof typeof basicForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setBasicForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSaveAll = async () => {
    if (!basicForm.modelCode.trim()) { showToast('모델코드를 입력해주세요', 'error'); return }
    if (!basicForm.displayName.trim()) { showToast('제품명을 입력해주세요', 'error'); return }
    if (!basicForm.categoryId) { showToast('카테고리를 선택해주세요', 'error'); return }
    setSaving(true)
    try {
      await Promise.all([
        pcProductsApi.update(productId, {
          modelCode: basicForm.modelCode.trim(),
          displayName: basicForm.displayName.trim(),
          categoryId: parseInt(basicForm.categoryId),
          brand: basicForm.brand || undefined,
          spec: basicForm.spec || undefined,
          unit: basicForm.unit,
          note: basicForm.note || undefined,
          description: basicForm.description || undefined,
          intro: basicForm.intro || undefined,
          tagline: basicForm.tagline || undefined,
          reviews,
          faqs,
          trustBadges,
          installSteps,
        }),
        pcProductsApi.linkServiceItem(productId, {
          serviceItemId: linkForm.serviceItemId ? parseInt(linkForm.serviceItemId) : null,
          code: linkForm.code || null,
          illustKind: linkForm.illustKind || undefined,
          sortOrder: parseInt(linkForm.sortOrder) || 0,
        }),
        pcProductsApi.setFeatures(productId, features.map((f) => ({ label: f.label, description: f.description || undefined }))),
        pcProductsApi.setColors(productId, colorLabels),
      ])
      await invalidate()
      showToast('저장됐어요')
      navigate(-1)
    } catch (err: any) {
      showToast(err.response?.data?.message || '저장 실패', 'error')
    } finally {
      setSaving(false)
    }
  }

  const upsertPrice = useMutation({
    mutationFn: () => pcPricesApi.upsert({
      productId,
      vendorId: parseInt(newPrice.vendorId),
      price: parseFloat(newPrice.price),
      note: newPrice.note || undefined,
    }),
    onSuccess: () => {
      invalidate()
      setShowAddPrice(false)
      setNewPrice({ vendorId: '', price: '', note: '' })
      showToast('가격이 저장됐어요')
    },
    onError: () => showToast('저장 실패', 'error'),
  })

  const deletePrice = useMutation({
    mutationFn: (priceId: number) => pcPricesApi.delete(priceId),
    onSuccess: () => { invalidate(); showToast('가격이 삭제됐어요') },
    onError: () => showToast('삭제 실패', 'error'),
  })

  const updatePrice = useMutation({
    mutationFn: (priceId: number) => {
      const target = data?.prices?.find((p) => p.id === priceId)
      if (!target) throw new Error()
      return pcPricesApi.upsert({
        productId,
        vendorId: target.vendorId,
        price: parseFloat(editingPrice.price),
        note: editingPrice.note || undefined,
      })
    },
    onSuccess: () => { invalidate(); setEditingPriceId(null); showToast('가격이 수정됐어요') },
    onError: () => showToast('수정 실패', 'error'),
  })

  const deleteImage = useMutation({
    mutationFn: (imageId: number) => pcProductsApi.deleteImage(productId, imageId),
    onSuccess: () => { invalidate(); showToast('이미지가 삭제됐어요') },
    onError: () => showToast('삭제 실패', 'error'),
  })

  const setPrimary = useMutation({
    mutationFn: (imageId: number) => pcProductsApi.setPrimaryImage(productId, imageId),
    onSuccess: () => { invalidate(); showToast('대표 이미지가 변경됐어요') },
  })

  const deleteProduct = useMutation({
    mutationFn: () => pcProductsApi.delete(productId),
    onSuccess: () => { showToast('제품이 삭제됐어요'); navigate('/admin/pc/compare?categoryId=all') },
    onError: () => showToast('삭제 실패', 'error'),
  })

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith('image/')) { showToast('이미지 파일만 업로드할 수 있어요', 'error'); return }
    setUploading(true)
    try {
      const isFirst = (data?.images?.length ?? 0) === 0
      await pcProductsApi.uploadImage(productId, file, isFirst, 0)
      invalidate()
      showToast('이미지가 업로드됐어요')
    } catch {
      showToast('업로드 실패', 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await uploadFile(file)
    e.target.value = ''
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) await uploadFile(file)
  }

  const handlePaste = async (e: React.ClipboardEvent) => {
    const imageItem = Array.from(e.clipboardData.items).find((item) => item.type.startsWith('image/'))
    if (!imageItem) return
    const file = imageItem.getAsFile()
    if (file) await uploadFile(file)
  }

  const handleImageMeta = async (imageId: number, data: { role?: string; label?: string }) => {
    try {
      await pcProductsApi.updateImageMeta(productId, imageId, data)
      invalidate()
    } catch {
      showToast('이미지 정보 변경 실패', 'error')
    }
  }

  if (isLoading) return <div className="empty">불러오는 중...</div>
  if (!data) return <div className="empty">제품을 찾을 수 없습니다.</div>

  return (
    <div>
      {lightboxUrl && <ImageLightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />}

      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div className="steps">
          <span className="link" style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/pc/compare?categoryId=all')}>제품</span>
          <span className="sep">›</span>
          <b>{data.modelCode}</b>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn ghost sm"
            style={{ color: 'var(--ink-3)' }}
            onClick={() => { if (confirm('제품을 삭제할까요? (이미지·가격 포함)')) deleteProduct.mutate() }}
          >삭제</button>
          <button className="btn primary sm" onClick={handleSaveAll} disabled={saving}>
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>

      {/* 기본 정보 */}
      <div className="card card-pad mb-16">
        <h3 className="h3 mb-16">기본 정보</h3>
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>모델코드 *</div>
              <input className="input" value={basicForm.modelCode} onChange={setBasic('modelCode')} placeholder="예: G60AL" style={{ fontFamily: 'monospace' }} />
            </label>
            <label>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>카테고리 *</div>
              <select className="input" value={basicForm.categoryId} onChange={setBasic('categoryId')}>
                <option value="">선택...</option>
                {flatCategories.map((c) => (
                  <option key={c.id} value={c.id}>{' '.repeat(c.depth * 3)}{c.name}</option>
                ))}
              </select>
            </label>
          </div>
          <label>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>제품명 *</div>
            <input className="input" value={basicForm.displayName} onChange={setBasic('displayName')} placeholder="예: G60 실버 슬라이드후드" />
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px', gap: 12 }}>
            <label>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>브랜드</div>
              <input className="input" value={basicForm.brand} onChange={setBasic('brand')} placeholder="예: 린나이" />
            </label>
            <label>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>스펙/사양</div>
              <input className="input" value={basicForm.spec} onChange={setBasic('spec')} placeholder="예: 기본형 실버 가로600" />
            </label>
            <label>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>단위</div>
              <input className="input" value={basicForm.unit} onChange={setBasic('unit')} />
            </label>
          </div>
          <label>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>비고</div>
            <input className="input" value={basicForm.note} onChange={setBasic('note')} />
          </label>
          <label>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>설명 (내부 메모, 고객 미노출)</div>
            <textarea className="input" rows={2} value={basicForm.description} onChange={setBasic('description')} style={{ resize: 'vertical' }} />
          </label>
          <label>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>제품 소개 (고객 노출 — 태그라인 하단·상세 도입부)</div>
            <textarea className="input" rows={3} value={basicForm.intro} onChange={setBasic('intro')} placeholder="예: 주방 후드 교체의 모든 것, 깔끔하게 완성해드립니다." style={{ resize: 'vertical' }} />
          </label>
          <label>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>태그라인 (고객 상단 강조 한 줄)</div>
            <input className="input" value={basicForm.tagline} onChange={setBasic('tagline')} placeholder="예: 조용하고 강력한 흡입력" />
          </label>
        </div>
      </div>

      {/* 고객 사이트 연결 */}
      <div className="card card-pad mb-16">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 className="h3">고객 사이트 연결</h3>
          {data.serviceItemId ? (
            <span style={{ fontSize: 12, padding: '3px 8px', background: 'var(--color-primary, #3182ce)', color: '#fff', borderRadius: 4 }}>연결됨</span>
          ) : (
            <span style={{ fontSize: 12, padding: '3px 8px', background: 'var(--ink-5)', color: 'var(--ink-2)', borderRadius: 4 }}>미연결</span>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <label>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>ServiceItem</div>
            <select
              className="input"
              value={linkForm.serviceItemId || String(data.serviceItemId ?? '')}
              onChange={(e) => setLinkForm((f) => ({ ...f, serviceItemId: e.target.value }))}
            >
              <option value="">연결 안 함</option>
              {serviceItems?.map((si) => (
                <option key={si.id} value={si.id}>{si.name} ({si.code})</option>
              ))}
            </select>
          </label>
          <label>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>URL 코드</div>
            <input className="input" placeholder="예: k1-1" defaultValue={data.code ?? ''} onChange={(e) => setLinkForm((f) => ({ ...f, code: e.target.value }))} />
          </label>
          <label>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>일러스트 종류</div>
            <input className="input" placeholder="예: hood" defaultValue={data.illustKind ?? 'default'} onChange={(e) => setLinkForm((f) => ({ ...f, illustKind: e.target.value }))} />
          </label>
          <label>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>노출 순서</div>
            <input type="number" className="input" defaultValue={data.sortOrder ?? 0} onChange={(e) => setLinkForm((f) => ({ ...f, sortOrder: e.target.value }))} />
          </label>
        </div>
        {data.representativePrice != null && (
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 10 }}>
            대표가: <b style={{ color: 'var(--ink-1)' }}>{data.representativePrice.toLocaleString()}원</b>
          </div>
        )}
      </div>

      {/* 제품 특징 */}
      <div className="card card-pad mb-16">
        <h3 className="h3 mb-4">제품 특징</h3>
        <p style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 12 }}>고객 상세 "왜 이 제품인가요" 항목. 설명 비우면 라벨만 노출.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
          {features.map((f, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: 8, alignItems: 'flex-start', padding: '10px 12px', background: 'var(--bg-deep)', borderRadius: 8 }}>
              <input
                className="input"
                value={f.label}
                onChange={(e) => setFeatures((prev) => prev.map((x, j) => j === i ? { ...x, label: e.target.value } : x))}
                placeholder="라벨 (예: 강력한 흡입력)"
                style={{ fontSize: 13 }}
              />
              <textarea
                className="input"
                rows={2}
                value={f.description}
                onChange={(e) => setFeatures((prev) => prev.map((x, j) => j === i ? { ...x, description: e.target.value } : x))}
                placeholder="설명 (선택 — 비우면 라벨만 노출)"
                style={{ fontSize: 12, resize: 'vertical' }}
              />
              <button
                type="button"
                onClick={() => setFeatures((prev) => prev.filter((_, j) => j !== i))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', fontSize: 18, padding: '4px 6px', lineHeight: 1 }}
              >×</button>
            </div>
          ))}
          {features.length === 0 && <span style={{ fontSize: 13, color: 'var(--ink-4)' }}>없음</span>}
        </div>
        <button
          type="button"
          className="btn ghost sm"
          onClick={() => setFeatures((prev) => [...prev, { label: '', description: '' }])}
        >+ 항목 추가</button>
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
          <label className="btn ghost sm" style={{ opacity: uploading ? 0.5 : 1, pointerEvents: uploading ? 'none' : 'auto' }}>
            {uploading ? '업로드 중...' : '+ 이미지 추가'}
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} disabled={uploading} />
          </label>
        </div>
        <p style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 12 }}>
          role: <b>main</b>=대표, <b>detail</b>=가까이서 본 모습, <b>example</b>=시공 전후, <b>color</b>=색상
        </p>
        <div
          ref={dropRef}
          tabIndex={0}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onPaste={handlePaste}
          style={{
            border: `2px dashed ${dragOver ? 'var(--color-primary, #3182ce)' : 'var(--ink-5)'}`,
            borderRadius: 10, padding: '16px 12px',
            background: dragOver ? 'rgba(49,130,206,0.05)' : 'var(--bg-deep)',
            transition: 'all 0.15s',
            outline: 'none',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            {data.images?.map((img) => (
              <div key={img.id} style={{ position: 'relative', width: 200 }}>
                <img
                  src={img.url}
                  alt=""
                  onClick={() => setLightboxUrl(img.url)}
                  style={{ width: 200, height: 200, objectFit: 'cover', borderRadius: 10, border: `2px solid ${img.isPrimary ? 'var(--color-primary, #3182ce)' : 'var(--ink-6)'}`, cursor: 'zoom-in', display: 'block' }}
                />
                {img.isPrimary && (
                  <div style={{ position: 'absolute', top: 4, left: 4, background: 'var(--color-primary, #3182ce)', color: '#fff', fontSize: 10, padding: '1px 4px', borderRadius: 3 }}>대표</div>
                )}
                <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                  <select
                    className="input"
                    value={img.role ?? 'main'}
                    onChange={(e) => handleImageMeta(img.id, { role: e.target.value })}
                    style={{ fontSize: 11, padding: '2px 4px', flex: 1 }}
                  >
                    {IMAGE_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <input
                  className="input"
                  defaultValue={img.label ?? ''}
                  onBlur={(e) => { const v = e.target.value; if (v !== (img.label ?? '')) handleImageMeta(img.id, { label: v }) }}
                  placeholder="라벨"
                  style={{ fontSize: 11, marginTop: 4, width: '100%' }}
                />
                <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                  {!img.isPrimary && (
                    <button className="btn ghost sm" style={{ fontSize: 11, padding: '2px 6px' }} onClick={() => setPrimary.mutate(img.id)}>대표</button>
                  )}
                  <button className="btn ghost sm" style={{ fontSize: 11, padding: '2px 6px', color: 'var(--ink-3)' }} onClick={() => { if (confirm('이미지를 삭제할까요?')) deleteImage.mutate(img.id) }}>삭제</button>
                </div>
              </div>
            ))}
            {(!data.images || data.images.length === 0) && !dragOver && (
              <div style={{ color: 'var(--ink-4)', fontSize: 13, width: '100%', textAlign: 'center', padding: '12px 0' }}>
                파일 드래그 · 버튼으로 추가 · 클릭 후 Ctrl+V 붙여넣기
              </div>
            )}
            {dragOver && (
              <div style={{ color: 'var(--color-primary, #3182ce)', fontSize: 13, fontWeight: 600, width: '100%', textAlign: 'center', padding: '12px 0' }}>
                놓으면 업로드돼요
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 고객 상세 콘텐츠 */}
      <div className="card card-pad mb-16">
        <h3 className="h3 mb-4">고객 상세 콘텐츠</h3>
        <p style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 20 }}>비워두면 고객 화면에서 해당 섹션이 숨겨집니다.</p>

        {/* 후기 */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>후기</div>
            <button type="button" className="btn ghost sm" onClick={() => setReviews((p) => [...p, { name: '', area: '', stars: 5, text: '' }])}>+ 추가</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {reviews.map((r, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '80px 80px 60px 1fr auto', gap: 6, alignItems: 'flex-start', padding: '10px 12px', background: 'var(--bg-deep)', borderRadius: 8 }}>
                <input className="input" value={r.name} onChange={(e) => setReviews((p) => p.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} placeholder="이름" style={{ fontSize: 12 }} />
                <input className="input" value={r.area} onChange={(e) => setReviews((p) => p.map((x, j) => j === i ? { ...x, area: e.target.value } : x))} placeholder="지역/평형" style={{ fontSize: 12 }} />
                <input type="number" className="input" value={r.stars} min={1} max={5} onChange={(e) => setReviews((p) => p.map((x, j) => j === i ? { ...x, stars: Number(e.target.value) } : x))} placeholder="★" style={{ fontSize: 12 }} />
                <textarea className="input" rows={2} value={r.text} onChange={(e) => setReviews((p) => p.map((x, j) => j === i ? { ...x, text: e.target.value } : x))} placeholder="후기 내용" style={{ fontSize: 12, resize: 'vertical' }} />
                <button type="button" onClick={() => setReviews((p) => p.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', fontSize: 18, padding: '4px 6px', lineHeight: 1 }}>×</button>
              </div>
            ))}
            {reviews.length === 0 && <span style={{ fontSize: 13, color: 'var(--ink-4)' }}>없음 (추가하면 고객 화면에 노출)</span>}
          </div>
        </div>

        {/* FAQ */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>FAQ</div>
            <button type="button" className="btn ghost sm" onClick={() => setFaqs((p) => [...p, { q: '', a: '' }])}>+ 추가</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {faqs.map((f, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 6, alignItems: 'flex-start', padding: '10px 12px', background: 'var(--bg-deep)', borderRadius: 8 }}>
                <textarea className="input" rows={2} value={f.q} onChange={(e) => setFaqs((p) => p.map((x, j) => j === i ? { ...x, q: e.target.value } : x))} placeholder="질문" style={{ fontSize: 12, resize: 'vertical' }} />
                <textarea className="input" rows={2} value={f.a} onChange={(e) => setFaqs((p) => p.map((x, j) => j === i ? { ...x, a: e.target.value } : x))} placeholder="답변" style={{ fontSize: 12, resize: 'vertical' }} />
                <button type="button" onClick={() => setFaqs((p) => p.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', fontSize: 18, padding: '4px 6px', lineHeight: 1 }}>×</button>
              </div>
            ))}
            {faqs.length === 0 && <span style={{ fontSize: 13, color: 'var(--ink-4)' }}>없음 (추가하면 고객 화면에 노출)</span>}
          </div>
        </div>

        {/* 신뢰 배지 */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>신뢰 배지</div>
            <button type="button" className="btn ghost sm" onClick={() => setTrustBadges((p) => [...p, { icon: '', title: '', desc: '' }])}>+ 추가</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {trustBadges.map((b, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '80px 120px 1fr auto', gap: 6, alignItems: 'flex-start', padding: '10px 12px', background: 'var(--bg-deep)', borderRadius: 8 }}>
                <input className="input" value={b.icon} onChange={(e) => setTrustBadges((p) => p.map((x, j) => j === i ? { ...x, icon: e.target.value } : x))} placeholder="이모지/아이콘" style={{ fontSize: 12 }} />
                <input className="input" value={b.title} onChange={(e) => setTrustBadges((p) => p.map((x, j) => j === i ? { ...x, title: e.target.value } : x))} placeholder="제목" style={{ fontSize: 12 }} />
                <input className="input" value={b.desc} onChange={(e) => setTrustBadges((p) => p.map((x, j) => j === i ? { ...x, desc: e.target.value } : x))} placeholder="설명" style={{ fontSize: 12 }} />
                <button type="button" onClick={() => setTrustBadges((p) => p.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', fontSize: 18, padding: '4px 6px', lineHeight: 1 }}>×</button>
              </div>
            ))}
            {trustBadges.length === 0 && <span style={{ fontSize: 13, color: 'var(--ink-4)' }}>없음 (추가하면 고객 화면에 노출)</span>}
          </div>
        </div>

        {/* 시공 스텝 */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>시공 스텝 ("이렇게 시공돼요")</div>
            <button type="button" className="btn ghost sm" onClick={() => setInstallSteps((p) => [...p, { title: '', desc: '' }])}>+ 추가</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {installSteps.map((s, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '120px 1fr auto', gap: 6, alignItems: 'flex-start', padding: '10px 12px', background: 'var(--bg-deep)', borderRadius: 8 }}>
                <input className="input" value={s.title} onChange={(e) => setInstallSteps((p) => p.map((x, j) => j === i ? { ...x, title: e.target.value } : x))} placeholder={`단계 ${i + 1} 제목`} style={{ fontSize: 12 }} />
                <textarea className="input" rows={2} value={s.desc} onChange={(e) => setInstallSteps((p) => p.map((x, j) => j === i ? { ...x, desc: e.target.value } : x))} placeholder="설명" style={{ fontSize: 12, resize: 'vertical' }} />
                <button type="button" onClick={() => setInstallSteps((p) => p.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', fontSize: 18, padding: '4px 6px', lineHeight: 1 }}>×</button>
              </div>
            ))}
            {installSteps.length === 0 && <span style={{ fontSize: 13, color: 'var(--ink-4)' }}>없음 (추가하면 고객 화면에 노출)</span>}
          </div>
        </div>
      </div>

      {/* 업체별 가격 */}
      <div className="card card-pad">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 className="h3">업체별 가격</h3>
          <button className="btn ghost sm" onClick={() => setShowAddPrice(true)}>+ 가격 추가</button>
        </div>

        {showAddPrice && (
          <div className="card card-pad mb-16" style={{ background: 'var(--bg-deep)' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>업체</div>
                <select className="input" value={newPrice.vendorId} onChange={(e) => setNewPrice((p) => ({ ...p, vendorId: e.target.value }))}>
                  <option value="">선택...</option>
                  {vendors?.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>가격 (원)</div>
                <input type="number" className="input" value={newPrice.price} onChange={(e) => setNewPrice((p) => ({ ...p, price: e.target.value }))} placeholder="0" style={{ width: 120 }} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>비고</div>
                <input className="input" value={newPrice.note} onChange={(e) => setNewPrice((p) => ({ ...p, note: e.target.value }))} placeholder="택배비포함 등" style={{ width: 120 }} />
              </div>
              <button className="btn primary sm" onClick={() => upsertPrice.mutate()} disabled={!newPrice.vendorId || !newPrice.price || upsertPrice.isPending}>저장</button>
              <button className="btn ghost sm" onClick={() => setShowAddPrice(false)}>취소</button>
            </div>
          </div>
        )}

        {data.prices && data.prices.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--ink-6)' }}>
                {['업체', '가격', '비고', ''].map((h, i) => (
                  <th key={i} style={{ textAlign: i === 1 ? 'right' : 'left', padding: '8px 0', fontWeight: 600, color: 'var(--ink-3)', paddingLeft: i === 2 ? 16 : 0 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...data.prices].sort((a, b) => Number(a.price) - Number(b.price)).map((price) => (
                <tr key={price.id} style={{ borderBottom: '1px solid var(--ink-6)' }}>
                  <td style={{ padding: '10px 0', fontWeight: 600 }}>{price.vendor?.name || `업체 #${price.vendorId}`}</td>
                  {editingPriceId === price.id ? (
                    <>
                      <td style={{ padding: '6px 0', textAlign: 'right' }}>
                        <input
                          type="number"
                          className="input"
                          value={editingPrice.price}
                          onChange={(e) => setEditingPrice((p) => ({ ...p, price: e.target.value }))}
                          style={{ width: 100, textAlign: 'right', fontSize: 13 }}
                          autoFocus
                        />
                      </td>
                      <td style={{ padding: '6px 0 6px 16px' }}>
                        <input
                          className="input"
                          value={editingPrice.note}
                          onChange={(e) => setEditingPrice((p) => ({ ...p, note: e.target.value }))}
                          placeholder="비고"
                          style={{ width: 120, fontSize: 13 }}
                        />
                      </td>
                      <td style={{ padding: '6px 0', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                          <button className="btn primary sm" style={{ fontSize: 11 }} onClick={() => updatePrice.mutate(price.id)} disabled={!editingPrice.price || updatePrice.isPending}>저장</button>
                          <button className="btn ghost sm" style={{ fontSize: 11 }} onClick={() => setEditingPriceId(null)}>취소</button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: 700, color: 'var(--ink-1)' }}>{Number(price.price).toLocaleString()}원</td>
                      <td style={{ padding: '10px 0', color: 'var(--ink-3)', paddingLeft: 16 }}>{price.note}</td>
                      <td style={{ padding: '10px 0', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                          <button className="btn ghost sm" style={{ fontSize: 11 }} onClick={() => { setEditingPriceId(price.id); setEditingPrice({ price: String(price.price), note: price.note ?? '' }) }}>수정</button>
                          <button className="btn ghost sm" style={{ fontSize: 11, color: 'var(--ink-3)' }} onClick={() => { if (confirm('가격을 삭제할까요?')) deletePrice.mutate(price.id) }}>삭제</button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ color: 'var(--ink-4)', fontSize: 13 }}>등록된 가격이 없습니다.</div>
        )}
      </div>
    </div>
  )
}
