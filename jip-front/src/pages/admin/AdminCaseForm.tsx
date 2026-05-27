import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { useToastStore } from '@/stores/toast'

interface PhotoEntry {
  role: 'cover' | 'before' | 'after'
  label: string
  fileUrl: string
}

interface FormState {
  title: string
  area: string
  hours: string
  dateText: string
  color: 'warm' | 'cool' | 'default'
  intro: string
  story: string
  isPublished: boolean
}

const DEFAULT_FORM: FormState = {
  title: '',
  area: '',
  hours: '',
  dateText: '',
  color: 'default',
  intro: '',
  story: '',
  isPublished: true,
}

export default function AdminCaseForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const showToast = useToastStore((s) => s.show)
  const isEdit = !!id

  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [photos, setPhotos] = useState<PhotoEntry[]>([])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(isEdit)

  useEffect(() => {
    if (!isEdit) return
    api
      .get(`/cases/admin/${id}`)
      .then((r) => {
        const c = r.data.data
        setForm({
          title: c.title ?? '',
          area: c.area ?? '',
          hours: c.hours != null ? String(c.hours) : '',
          dateText: c.dateText ?? '',
          color: c.color ?? 'default',
          intro: c.intro ?? '',
          story: c.story ?? '',
          isPublished: c.isPublished ?? true,
        })
        setTags((c.tags ?? []).map((t: { tag: string }) => t.tag))
        setPhotos(
          (c.photos ?? []).map((p: { role: 'cover' | 'before' | 'after'; label: string; fileUrl: string }) => ({
            role: p.role,
            label: p.label ?? '',
            fileUrl: p.fileUrl ?? '',
          }))
        )
      })
      .catch(() => {
        showToast('데이터를 불러오지 못했어요', 'error')
      })
      .finally(() => setLoading(false))
  }, [id, isEdit, showToast])

  const setField = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }))

  const addTag = () => {
    const t = tagInput.trim()
    if (!t || tags.includes(t)) {
      setTagInput('')
      return
    }
    setTags((prev) => [...prev, t])
    setTagInput('')
  }

  const removeTag = (t: string) => setTags((prev) => prev.filter((x) => x !== t))

  const uploadPhoto = async (file: File): Promise<string> => {
    const fd = new FormData()
    fd.append('file', file)
    const res = await api.post('/uploads/case-photo', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    return res.data.data.url as string
  }

  const handlePhotoAdd = async (e: React.ChangeEvent<HTMLInputElement>, role: 'cover' | 'before' | 'after') => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploading(true)
    try {
      for (const file of files) {
        const fileUrl = await uploadPhoto(file)
        setPhotos((prev) => [...prev, { role, label: '', fileUrl }])
      }
    } catch {
      showToast('사진 업로드 실패', 'error')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const removePhoto = (idx: number) => setPhotos((prev) => prev.filter((_, i) => i !== idx))
  const updatePhotoLabel = (idx: number, label: string) =>
    setPhotos((prev) => prev.map((p, i) => (i === idx ? { ...p, label } : p)))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) {
      showToast('제목을 입력해주세요', 'error')
      return
    }
    setSaving(true)
    try {
      const payload = {
        title: form.title.trim(),
        area: form.area.trim() || undefined,
        hours: form.hours ? Number(form.hours) : undefined,
        dateText: form.dateText.trim() || undefined,
        color: form.color,
        intro: form.intro.trim() || undefined,
        story: form.story.trim() || undefined,
        isPublished: form.isPublished,
        tags,
        photos: photos.filter((p) => p.fileUrl),
      }
      if (isEdit) {
        await api.post(`/cases/admin/${id}/update`, payload)
        showToast('시공사례가 수정됐어요')
      } else {
        await api.post('/cases/admin', payload)
        showToast('시공사례가 등록됐어요')
      }
      navigate('/admin/cases')
    } catch {
      showToast('저장 실패', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="empty">불러오는 중...</div>

  const coverPhotos = photos.filter((p) => p.role === 'cover')
  const beforePhotos = photos.filter((p) => p.role === 'before')
  const afterPhotos = photos.filter((p) => p.role === 'after')

  return (
    <form onSubmit={handleSubmit}>
      <div className="steps mb-16">
        <span className="link" style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/cases')}>
          시공사례
        </span>
        <span className="sep">›</span>
        <b>{isEdit ? '수정' : '새 사례'}</b>
      </div>
      <h1 className="h2 mb-24">{isEdit ? '시공사례 수정' : '새 시공사례 등록'}</h1>

      {/* 공개 여부 토글 */}
      <div
        className="card card-pad mb-24"
        style={{ display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}
        onClick={() => setField('isPublished', !form.isPublished)}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700 }}>{form.isPublished ? '공개' : '비공개'}</div>
          <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 2 }}>
            {form.isPublished ? '고객 사이트에 노출됩니다.' : '저장만 되고 고객에게 보이지 않아요.'}
          </div>
        </div>
        <button type="button" className={`jobs-switch ${form.isPublished ? 'on' : ''}`} aria-label="공개 여부" />
      </div>

      {/* 기본 정보 */}
      <div className="card card-pad mb-16">
        <h3 className="h3 mb-16">기본 정보</h3>
        <div style={{ display: 'grid', gap: 12 }}>
          <label>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>제목 *</div>
            <input
              className="input"
              value={form.title}
              onChange={(e) => setField('title', e.target.value)}
              placeholder="예) 40년 된 주방, 상판·싱크볼·수전 한 번에"
              required
            />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>지역</div>
              <input
                className="input"
                value={form.area}
                onChange={(e) => setField('area', e.target.value)}
                placeholder="강남구 역삼동"
              />
            </label>
            <label>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>소요 시간 (시간)</div>
              <input
                className="input"
                type="number"
                min={0}
                value={form.hours}
                onChange={(e) => setField('hours', e.target.value)}
                placeholder="3"
              />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>날짜 (YYYY.MM)</div>
              <input
                className="input"
                value={form.dateText}
                onChange={(e) => setField('dateText', e.target.value)}
                placeholder="2026.03"
              />
            </label>
            <label>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>사진 색감 (fallback)</div>
              <select
                className="input"
                value={form.color}
                onChange={(e) => setField('color', e.target.value as FormState['color'])}
              >
                <option value="warm">warm — 주방 계열</option>
                <option value="cool">cool — 욕실 계열</option>
                <option value="default">default — 필름 계열</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      {/* 소개·스토리 */}
      <div className="card card-pad mb-16">
        <h3 className="h3 mb-16">내용</h3>
        <div style={{ display: 'grid', gap: 12 }}>
          <label>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>한 줄 소개</div>
            <input
              className="input"
              value={form.intro}
              onChange={(e) => setField('intro', e.target.value)}
              placeholder="짧은 소개 문구 (선택)"
            />
          </label>
          <label>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>시공 스토리</div>
            <textarea
              className="input"
              rows={5}
              value={form.story}
              onChange={(e) => setField('story', e.target.value)}
              placeholder="시공 배경, 고객 요청, 진행 과정 등 (선택)"
              style={{ resize: 'vertical' }}
            />
          </label>
        </div>
      </div>

      {/* 태그 */}
      <div className="card card-pad mb-16">
        <h3 className="h3 mb-16">태그</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {tags.map((t) => (
            <span key={t} className="tag" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {t}
              <button
                type="button"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: 12,
                  lineHeight: 1,
                }}
                onClick={() => removeTag(t)}
              >
                ×
              </button>
            </span>
          ))}
          {tags.length === 0 && <span style={{ color: 'var(--ink-4)', fontSize: 13 }}>태그 없음</span>}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="input"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addTag()
              }
            }}
            placeholder="태그 입력 후 Enter"
            style={{ flex: 1 }}
          />
          <button type="button" className="btn ghost" onClick={addTag}>
            추가
          </button>
        </div>
      </div>

      {/* 사진 */}
      <div className="card card-pad mb-24">
        <h3 className="h3 mb-16">사진</h3>

        {/* Cover */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--ink-2)' }}>커버 사진</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 8 }}>
            {coverPhotos.map((p, i) => {
              const globalIdx = photos.indexOf(p)
              return (
                <div key={i} style={{ position: 'relative' }}>
                  <img src={p.fileUrl} alt="" style={{ width: 120, height: 90, objectFit: 'cover', borderRadius: 8 }} />
                  <button
                    type="button"
                    style={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      background: 'rgba(0,0,0,0.6)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '50%',
                      width: 20,
                      height: 20,
                      cursor: 'pointer',
                      fontSize: 12,
                      lineHeight: '20px',
                      padding: 0,
                    }}
                    onClick={() => removePhoto(globalIdx)}
                  >
                    ×
                  </button>
                  <input
                    className="input"
                    value={p.label}
                    onChange={(e) => updatePhotoLabel(globalIdx, e.target.value)}
                    placeholder="사진 설명 (선택)"
                    style={{ marginTop: 4, fontSize: 12, width: 120 }}
                  />
                </div>
              )
            })}
          </div>
          <label className="btn ghost sm" style={{ cursor: 'pointer' }}>
            {uploading ? '업로드 중...' : '+ 커버 사진 추가'}
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => handlePhotoAdd(e, 'cover')}
              disabled={uploading}
            />
          </label>
        </div>

        {/* Before */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--ink-2)' }}>시공 전 (Before)</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 8 }}>
            {beforePhotos.map((p, i) => {
              const globalIdx = photos.indexOf(p)
              return (
                <div key={i} style={{ position: 'relative' }}>
                  <img src={p.fileUrl} alt="" style={{ width: 120, height: 90, objectFit: 'cover', borderRadius: 8 }} />
                  <button
                    type="button"
                    style={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      background: 'rgba(0,0,0,0.6)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '50%',
                      width: 20,
                      height: 20,
                      cursor: 'pointer',
                      fontSize: 12,
                      lineHeight: '20px',
                      padding: 0,
                    }}
                    onClick={() => removePhoto(globalIdx)}
                  >
                    ×
                  </button>
                  <input
                    className="input"
                    value={p.label}
                    onChange={(e) => updatePhotoLabel(globalIdx, e.target.value)}
                    placeholder="사진 설명 (선택)"
                    style={{ marginTop: 4, fontSize: 12, width: 120 }}
                  />
                </div>
              )
            })}
          </div>
          <label className="btn ghost sm" style={{ cursor: 'pointer' }}>
            {uploading ? '업로드 중...' : '+ Before 사진 추가'}
            <input
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => handlePhotoAdd(e, 'before')}
              disabled={uploading}
            />
          </label>
        </div>

        {/* After */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--ink-2)' }}>시공 후 (After)</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 8 }}>
            {afterPhotos.map((p, i) => {
              const globalIdx = photos.indexOf(p)
              return (
                <div key={i} style={{ position: 'relative' }}>
                  <img src={p.fileUrl} alt="" style={{ width: 120, height: 90, objectFit: 'cover', borderRadius: 8 }} />
                  <button
                    type="button"
                    style={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      background: 'rgba(0,0,0,0.6)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '50%',
                      width: 20,
                      height: 20,
                      cursor: 'pointer',
                      fontSize: 12,
                      lineHeight: '20px',
                      padding: 0,
                    }}
                    onClick={() => removePhoto(globalIdx)}
                  >
                    ×
                  </button>
                  <input
                    className="input"
                    value={p.label}
                    onChange={(e) => updatePhotoLabel(globalIdx, e.target.value)}
                    placeholder="사진 설명 (선택)"
                    style={{ marginTop: 4, fontSize: 12, width: 120 }}
                  />
                </div>
              )
            })}
          </div>
          <label className="btn ghost sm" style={{ cursor: 'pointer' }}>
            {uploading ? '업로드 중...' : '+ After 사진 추가'}
            <input
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => handlePhotoAdd(e, 'after')}
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      {/* 저장 */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button type="submit" className="btn primary lg" disabled={saving || uploading}>
          {saving ? '저장 중...' : isEdit ? '수정 저장' : '등록하기'}
        </button>
        <button type="button" className="btn ghost lg" onClick={() => navigate('/admin/cases')}>
          취소
        </button>
      </div>
    </form>
  )
}
