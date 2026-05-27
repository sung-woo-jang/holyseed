import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAdminItem, useAdminCategories, useInvalidateCatalog } from '@/queries/catalog'
import { useToastStore } from '@/stores/toast'

interface FormState {
  categoryCode: string
  code: string
  name: string
  description: string
  price: string
  unit: string
  duration: string
  illustKind: string
  isFeatured: boolean
  isActive: boolean
  sortOrder: string
}

const DEFAULT: FormState = {
  categoryCode: '',
  code: '',
  name: '',
  description: '',
  price: '0',
  unit: '',
  duration: '',
  illustKind: 'default',
  isFeatured: false,
  isActive: true,
  sortOrder: '0',
}

export default function AdminCatalogItemForm() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const showToast = useToastStore((s) => s.show)
  const qc = useQueryClient()
  const invalidate = useInvalidateCatalog()
  const isEdit = !!code

  const { data: categories } = useAdminCategories()
  const { data: existing, isLoading } = useAdminItem(code ?? '')

  const [form, setForm] = useState<FormState>(DEFAULT)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  useEffect(() => {
    if (categories && !isEdit && !form.categoryCode && categories.length > 0) {
      setForm((p) => ({ ...p, categoryCode: (categories[0] as any).code ?? '' }))
    }
  }, [categories, isEdit])

  useEffect(() => {
    if (!existing) return
    const e = existing as any
    setForm({
      categoryCode: e.category?.code ?? e.categoryCode ?? '',
      code: e.code,
      name: e.name,
      description: e.description ?? '',
      price: String(e.price ?? 0),
      unit: e.unit ?? '',
      duration: e.duration ?? '',
      illustKind: e.illustKind ?? 'default',
      isFeatured: e.isFeatured ?? false,
      isActive: e.isActive ?? true,
      sortOrder: String(e.sortOrder ?? 0),
    })
    setImageUrl(e.imageUrl ?? null)
  }, [existing])

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((p) => ({ ...p, [k]: v }))

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !code) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('itemCode', code)
      const res = await api.post('/uploads/catalog-item-photo', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setImageUrl(res.data.data.url)
      await invalidate()
      await qc.invalidateQueries({ queryKey: ['admin-item', code] })
      showToast('사진이 업데이트됐어요')
    } catch {
      showToast('사진 업로드 실패', 'error')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleDelete = async () => {
    if (!code) return
    if (!window.confirm(`"${form.name}" 아이템을 삭제하시겠어요?\n연결된 PC 제품이 있다면 연결이 해제됩니다.`)) return
    setDeleting(true)
    try {
      await api.post(`/catalog/admin/items/${code}/delete`)
      await invalidate()
      showToast('서비스 아이템이 삭제됐어요')
      navigate('/admin/catalog/items')
    } catch {
      showToast('삭제 실패', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { showToast('이름을 입력해주세요', 'error'); return }
    if (!isEdit && !form.code.trim()) { showToast('코드를 입력해주세요', 'error'); return }
    setSaving(true)
    try {
      if (isEdit) {
        await api.post(`/catalog/admin/items/${code}/update`, {
          name: form.name,
          description: form.description || undefined,
          price: Number(form.price),
          unit: form.unit || undefined,
          duration: form.duration || undefined,
          illustKind: form.illustKind || undefined,
          sortOrder: Number(form.sortOrder),
        })
        await qc.invalidateQueries({ queryKey: ['admin-item', code] })
      } else {
        await api.post('/catalog/admin/items', {
          categoryCode: form.categoryCode,
          code: form.code,
          name: form.name,
          description: form.description || undefined,
          price: Number(form.price),
          unit: form.unit || undefined,
          duration: form.duration || undefined,
          illustKind: form.illustKind || undefined,
          isFeatured: form.isFeatured,
          isActive: form.isActive,
          sortOrder: Number(form.sortOrder),
        })
      }
      await invalidate()
      showToast(isEdit ? '서비스 아이템이 수정됐어요' : '서비스 아이템이 생성됐어요')
      navigate('/admin/catalog/items')
    } catch {
      showToast('저장 실패', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (isEdit && isLoading) return <div className="empty">불러오는 중...</div>

  return (
    <form onSubmit={handleSubmit}>
      <div className="steps mb-16">
        <span className="link" style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/catalog/items')}>
          서비스 아이템 관리
        </span>
        <span className="sep">›</span>
        <b>{isEdit ? form.name || code : '새 아이템'}</b>
      </div>
      <h1 className="h2 mb-24">{isEdit ? '서비스 아이템 수정' : '새 서비스 아이템 등록'}</h1>

      <div className="card card-pad mb-16">
        <h3 className="h3 mb-16">기본 정보</h3>
        <div style={{ display: 'grid', gap: 12 }}>
          {!isEdit && (
            <label>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>카테고리 *</div>
              <select className="input" value={form.categoryCode} onChange={(e) => set('categoryCode', e.target.value)}>
                {(categories ?? []).map((c: any) => (
                  <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
                ))}
              </select>
            </label>
          )}
          {!isEdit && (
            <label>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>코드 * <span style={{ fontWeight: 400, color: 'var(--ink-3)' }}>(고유, 변경 불가)</span></div>
              <input className="input" value={form.code} onChange={(e) => set('code', e.target.value)} placeholder="예) k1" required />
            </label>
          )}
          <label>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>이름 *</div>
            <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="예) 주방 상판 교체" required />
          </label>
          <label>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>설명</div>
            <textarea className="input" rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="서비스 설명" style={{ resize: 'vertical' }} />
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>가격 (원) *</div>
              <input className="input" type="number" min={0} value={form.price} onChange={(e) => set('price', e.target.value)} required />
            </label>
            <label>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>단위</div>
              <input className="input" value={form.unit} onChange={(e) => set('unit', e.target.value)} placeholder="예) 1m 기준" />
            </label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>소요 시간</div>
              <input className="input" value={form.duration} onChange={(e) => set('duration', e.target.value)} placeholder="예) 2~4시간" />
            </label>
            <label>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>정렬 순서</div>
              <input className="input" type="number" min={0} value={form.sortOrder} onChange={(e) => set('sortOrder', e.target.value)} />
            </label>
          </div>
        </div>
      </div>

      {/* 상태 토글 */}
      <div className="card card-pad mb-16" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: 12, borderRadius: 8, background: 'var(--bg-deep)' }}
          onClick={() => set('isActive', !form.isActive)}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{form.isActive ? '활성' : '비활성'}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>서비스 노출 여부</div>
          </div>
          <button type="button" className={`jobs-switch ${form.isActive ? 'on' : ''}`} />
        </div>
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: 12, borderRadius: 8, background: 'var(--bg-deep)' }}
          onClick={() => set('isFeatured', !form.isFeatured)}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{form.isFeatured ? '인기 ★' : '일반'}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>홈 인기 섹션 노출</div>
          </div>
          <button type="button" className={`jobs-switch ${form.isFeatured ? 'on' : ''}`} />
        </div>
      </div>

      {/* 사진 (편집 모드만) */}
      {isEdit && (
        <div className="card card-pad mb-24">
          <h3 className="h3 mb-16">대표 사진</h3>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ width: 120, height: 90, borderRadius: 8, overflow: 'hidden', background: 'var(--ink-6)', flexShrink: 0 }}>
              {imageUrl ? (
                <img src={imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-4)', fontSize: 12 }}>없음</div>
              )}
            </div>
            <label className="btn ghost sm" style={{ cursor: 'pointer' }}>
              {uploading ? '업로드 중...' : '사진 교체'}
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} disabled={uploading} />
            </label>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12 }}>
        <button type="submit" className="btn primary lg" disabled={saving || deleting}>
          {saving ? '저장 중...' : isEdit ? '수정 저장' : '등록하기'}
        </button>
        <button type="button" className="btn ghost lg" onClick={() => navigate('/admin/catalog/items')} disabled={saving || deleting}>
          취소
        </button>
        {isEdit && (
          <button type="button" className="btn ghost lg" style={{ marginLeft: 'auto', color: 'var(--red, #e53e3e)', borderColor: 'var(--red, #e53e3e)' }} onClick={handleDelete} disabled={deleting || saving}>
            {deleting ? '삭제 중...' : '아이템 삭제'}
          </button>
        )}
      </div>
    </form>
  )
}
