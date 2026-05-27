import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { pcVendorsApi, pcKeys } from '@/queries/pc'
import type { PcVendor } from '@/queries/pc'
import { useToastStore } from '@/stores/toast'

const EMPTY_FORM: Partial<PcVendor> = { name: '', contact: '', phone: '', email: '', homepage: '', memo: '' }
const FIELDS = [
  { key: 'name', label: '업체명 *' },
  { key: 'contact', label: '담당자' },
  { key: 'phone', label: '전화번호' },
  { key: 'email', label: '이메일' },
  { key: 'homepage', label: '홈페이지' },
] as const

export default function PcVendorsPage() {
  const qc = useQueryClient()
  const showToast = useToastStore((s) => s.show)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState<Partial<PcVendor>>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const { data: vendors } = useQuery({ queryKey: pcKeys.vendorsAll(), queryFn: pcVendorsApi.all })

  const resetForm = () => { setForm(EMPTY_FORM); setEditId(null); setShowForm(false) }

  const handleSave = async () => {
    if (!form.name?.trim()) { showToast('업체명을 입력해주세요', 'error'); return }
    setSaving(true)
    try {
      if (editId) await pcVendorsApi.update(editId, form)
      else await pcVendorsApi.create(form)
      await qc.invalidateQueries({ queryKey: pcKeys.vendorsAll() })
      showToast(editId ? '업체가 수정됐어요' : '업체가 추가됐어요')
      resetForm()
    } catch {
      showToast('저장 실패', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = useMutation({
    mutationFn: (id: number) => pcVendorsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: pcKeys.vendorsAll() })
      showToast('업체가 삭제됐어요')
    },
    onError: () => showToast('삭제 실패', 'error'),
  })

  const startEdit = (v: PcVendor) => {
    setForm({ name: v.name, contact: v.contact, phone: v.phone, email: v.email, homepage: v.homepage, memo: v.memo })
    setEditId(v.id)
    setShowForm(true)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 className="h2">거래처 관리</h1>
        <button
          className="btn primary sm"
          onClick={() => { setShowForm(true); setEditId(null); setForm(EMPTY_FORM) }}
        >
          + 업체 추가
        </button>
      </div>

      {showForm && (
        <div className="card card-pad mb-16">
          <h3 className="h3 mb-16">{editId ? '업체 수정' : '업체 추가'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            {FIELDS.map(({ key, label }) => (
              <label key={key}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{label}</div>
                <input
                  className="input"
                  value={(form as any)[key] || ''}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                />
              </label>
            ))}
            <label style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>메모</div>
              <textarea
                className="input"
                rows={2}
                value={form.memo || ''}
                onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))}
                style={{ resize: 'vertical' }}
              />
            </label>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn ghost sm" onClick={resetForm}>취소</button>
            <button className="btn primary sm" onClick={handleSave} disabled={saving}>
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      )}

      <div className="card" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: 'var(--bg-deep)', borderBottom: '1px solid var(--ink-6)' }}>
              {['업체명', '담당자', '전화번호', '이메일', ''].map((h, i) => (
                <th key={i} style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 600, color: 'var(--ink-2)', fontSize: 13 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {vendors?.map((v) => (
              <tr key={v.id} style={{ borderBottom: '1px solid var(--ink-6)' }}>
                <td style={{ padding: '10px 16px', fontWeight: 600 }}>{v.name}</td>
                <td style={{ padding: '10px 16px', color: 'var(--ink-3)' }}>{v.contact || '—'}</td>
                <td style={{ padding: '10px 16px', color: 'var(--ink-3)' }}>{v.phone || '—'}</td>
                <td style={{ padding: '10px 16px', color: 'var(--ink-3)' }}>{v.email || '—'}</td>
                <td style={{ padding: '10px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <button className="btn ghost sm" onClick={() => startEdit(v)} style={{ marginRight: 8 }}>수정</button>
                  <button
                    className="btn ghost sm"
                    style={{ color: 'var(--ink-3)' }}
                    onClick={() => { if (confirm('업체를 삭제할까요?')) handleDelete.mutate(v.id) }}
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
            {(!vendors || vendors.length === 0) && (
              <tr>
                <td colSpan={5} className="empty" style={{ padding: '32px 16px' }}>등록된 업체가 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
