import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { vendorsApi } from '@/lib/pc-api'
import type { Vendor } from '@/lib/pc-api'
import { qk } from '@/queries/keys'

export function VendorsPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState<Partial<Vendor>>({ name: '', contact: '', phone: '', email: '', homepage: '', memo: '' })

  const { data: vendors } = useQuery({ queryKey: qk.vendorsAll(), queryFn: vendorsApi.all })

  const save = useMutation({
    mutationFn: () =>
      editId
        ? vendorsApi.update(editId, form)
        : vendorsApi.create(form as any),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.vendorsAll() })
      setShowForm(false)
      setEditId(null)
      setForm({ name: '', contact: '', phone: '', email: '', homepage: '', memo: '' })
    },
  })

  const del = useMutation({
    mutationFn: (id: number) => vendorsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.vendorsAll() }),
  })

  const startEdit = (v: Vendor) => {
    setForm({ name: v.name, contact: v.contact, phone: v.phone, email: v.email, homepage: v.homepage, memo: v.memo })
    setEditId(v.id)
    setShowForm(true)
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">업체 관리</h1>
        <button
          onClick={() => { setShowForm(true); setEditId(null); setForm({ name: '', contact: '', phone: '', email: '', homepage: '', memo: '' }) }}
          className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm hover:bg-blue-700"
        >
          + 업체 추가
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-blue-100">
          <h2 className="font-semibold text-gray-900 mb-4">{editId ? '업체 수정' : '업체 추가'}</h2>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { key: 'name', label: '업체명 *', required: true },
              { key: 'contact', label: '담당자' },
              { key: 'phone', label: '전화번호' },
              { key: 'email', label: '이메일' },
              { key: 'homepage', label: '홈페이지' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-xs text-gray-500 mb-1">{label}</label>
                <input
                  value={(form as any)[key] || ''}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">메모</label>
              <textarea
                value={form.memo || ''}
                onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                rows={2}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowForm(false)} className="text-sm text-gray-500">취소</button>
            <button
              onClick={() => save.mutate()}
              disabled={!form.name || save.isPending}
              className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm disabled:opacity-50"
            >
              저장
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">업체명</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">담당자</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">전화번호</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">이메일</th>
              <th className="py-3"></th>
            </tr>
          </thead>
          <tbody>
            {vendors?.map((v) => (
              <tr key={v.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{v.name}</td>
                <td className="px-4 py-3 text-gray-600">{v.contact || '—'}</td>
                <td className="px-4 py-3 text-gray-600">{v.phone || '—'}</td>
                <td className="px-4 py-3 text-gray-600">{v.email || '—'}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => startEdit(v)} className="text-blue-600 hover:text-blue-800 mr-3 text-xs">수정</button>
                  <button
                    onClick={() => { if (confirm('업체를 삭제할까요?')) del.mutate(v.id) }}
                    className="text-red-400 hover:text-red-600 text-xs"
                  >삭제</button>
                </td>
              </tr>
            ))}
            {(!vendors || vendors.length === 0) && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">업체가 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
