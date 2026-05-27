import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAdminCategory, useInvalidateCatalog } from '@/queries/catalog'
import { useToastStore } from '@/stores/toast'

interface FormState {
  code: string
  name: string
  intro: string
  color: string
  sortOrder: string
  isActive: boolean
}

const DEFAULT: FormState = {
  code: '',
  name: '',
  intro: '',
  color: 'default',
  sortOrder: '0',
  isActive: true,
}

export default function AdminCatalogCategoryForm() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const showToast = useToastStore((s) => s.show)
  const qc = useQueryClient()
  const invalidate = useInvalidateCatalog()
  const isEdit = !!code

  const { data: existing, isLoading } = useAdminCategory(code ?? '')

  const [form, setForm] = useState<FormState>(DEFAULT)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!existing) return
    setForm({
      code: existing.code,
      name: existing.name,
      intro: (existing as any).intro ?? '',
      color: (existing as any).color ?? 'default',
      sortOrder: String((existing as any).sortOrder ?? 0),
      isActive: existing.isActive ?? true,
    })
    setImageUrl((existing as any).imageUrl ?? null)
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
      fd.append('categoryCode', code)
      const res = await api.post('/uploads/catalog-category-photo', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setImageUrl(res.data.data.url)
      await invalidate()
      showToast('사진이 업데이트됐어요')
    } catch {
      showToast('사진 업로드 실패', 'error')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { showToast('이름을 입력해주세요', 'error'); return }
    if (!isEdit && !form.code.trim()) { showToast('코드를 입력해주세요', 'error'); return }
    setSaving(true)
    try {
      if (isEdit) {
        await api.post(`/catalog/admin/categories/${code}/update`, {
          name: form.name,
          intro: form.intro || undefined,
          color: form.color,
          sortOrder: Number(form.sortOrder),
        })
        await qc.invalidateQueries({ queryKey: ['admin-category', code] })
      } else {
        await api.post('/catalog/admin/categories', {
          code: form.code,
          name: form.name,
          intro: form.intro || undefined,
          color: form.color,
          sortOrder: Number(form.sortOrder),
          isActive: form.isActive,
        })
      }
      await invalidate()
      showToast(isEdit ? '카테고리가 수정됐어요' : '카테고리가 생성됐어요')
      navigate('/admin/catalog/categories')
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
        <span className="link" style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/catalog/categories')}>
          카테고리 관리
        </span>
        <span className="sep">›</span>
        <b>{isEdit ? form.name || code : '새 카테고리'}</b>
      </div>
      <h1 className="h2 mb-24">{isEdit ? '카테고리 수정' : '새 카테고리 등록'}</h1>

      {/* 기본 정보 */}
      <div className="card card-pad mb-16">
        <h3 className="h3 mb-16">기본 정보</h3>
        <div style={{ display: 'grid', gap: 12 }}>
          {!isEdit && (
            <label>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>코드 * <span style={{ fontWeight: 400, color: 'var(--ink-3)' }}>(고유, 변경 불가)</span></div>
              <input className="input" value={form.code} onChange={(e) => set('code', e.target.value)} placeholder="예) kitchen" required />
            </label>
          )}
          <label>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>이름 *</div>
            <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="예) 주방" required />
          </label>
          <label>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>소개 (한 줄)</div>
            <input className="input" value={form.intro} onChange={(e) => set('intro', e.target.value)} placeholder="카테고리 설명" />
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>색상 테마</div>
              <select className="input" value={form.color} onChange={(e) => set('color', e.target.value)}>
                <option value="default">default</option>
                <option value="warm">warm</option>
                <option value="cool">cool</option>
              </select>
            </label>
            <label>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>정렬 순서</div>
              <input className="input" type="number" min={0} value={form.sortOrder} onChange={(e) => set('sortOrder', e.target.value)} />
            </label>
          </div>
          {!isEdit && (
            <div
              className="card card-pad"
              style={{ display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', background: 'var(--bg-deep)' }}
              onClick={() => set('isActive', !form.isActive)}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{form.isActive ? '활성' : '비활성'}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{form.isActive ? '고객 사이트에 노출됩니다.' : '숨김 처리됩니다.'}</div>
              </div>
              <button type="button" className={`jobs-switch ${form.isActive ? 'on' : ''}`} />
            </div>
          )}
        </div>
      </div>

      {/* 사진 (편집 모드만) */}
      {isEdit && (
        <div className="card card-pad mb-24">
          <h3 className="h3 mb-16">카테고리 사진</h3>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ width: 160, height: 110, borderRadius: 8, overflow: 'hidden', background: 'var(--ink-6)', flexShrink: 0 }}>
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
        <button type="submit" className="btn primary lg" disabled={saving}>
          {saving ? '저장 중...' : isEdit ? '수정 저장' : '등록하기'}
        </button>
        <button type="button" className="btn ghost lg" onClick={() => navigate('/admin/catalog/categories')}>
          취소
        </button>
      </div>
    </form>
  )
}
