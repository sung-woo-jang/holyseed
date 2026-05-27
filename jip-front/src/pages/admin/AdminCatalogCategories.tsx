import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { useAdminCategories, useInvalidateCatalog } from '@/queries/catalog'
import { useToastStore } from '@/stores/toast'

export default function AdminCatalogCategories() {
  const navigate = useNavigate()
  const { data: categories, isLoading } = useAdminCategories()
  const showToast = useToastStore((s) => s.show)
  const invalidate = useInvalidateCatalog()
  const [toggling, setToggling] = useState<string | null>(null)

  const handleToggle = async (e: React.MouseEvent, code: string, current: boolean) => {
    e.stopPropagation()
    setToggling(code)
    try {
      await api.post(`/catalog/admin/categories/${code}/toggle`, { isActive: !current })
      await invalidate()
    } catch {
      showToast('상태 변경 실패', 'error')
    } finally {
      setToggling(null)
    }
  }

  if (isLoading) return <div className="empty">불러오는 중...</div>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <h1 className="h2" style={{ flex: 1 }}>카테고리 관리</h1>
        <button className="btn primary sm" onClick={() => navigate('/admin/catalog/categories/new')}>
          + 새 카테고리
        </button>
      </div>
      <p style={{ color: 'var(--ink-3)', fontSize: 14, marginBottom: 24 }}>
        서비스 페이지 카테고리 카드를 관리합니다. 카드를 클릭하면 편집 화면으로 이동합니다.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
        {(categories ?? []).map((cat: any) => (
          <div
            key={cat.code}
            className="card card-pad"
            style={{ cursor: 'pointer', opacity: cat.isActive ? 1 : 0.45, position: 'relative' }}
            onClick={() => navigate(`/admin/catalog/categories/${cat.code}/edit`)}
          >
            <div style={{ width: '100%', height: 140, borderRadius: 8, overflow: 'hidden', background: 'var(--ink-6)', marginBottom: 12 }}>
              {cat.imageUrl ? (
                <img src={cat.imageUrl} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-4)', fontSize: 12 }}>사진 없음</div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{ fontWeight: 700, flex: 1 }}>{cat.name}</div>
              <button
                type="button"
                className={`jobs-switch ${cat.isActive ? 'on' : ''}`}
                style={{ flexShrink: 0 }}
                disabled={toggling === cat.code}
                onClick={(e) => handleToggle(e, cat.code, cat.isActive)}
              />
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-4)', marginBottom: 4 }}>{cat.code}</div>
            {cat.intro && <div style={{ fontSize: 12, color: 'var(--ink-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.intro}</div>}
            <div style={{ position: 'absolute', top: 12, right: 12, fontSize: 10, background: cat.isActive ? 'var(--primary)' : 'var(--ink-5)', color: cat.isActive ? '#fff' : 'var(--ink-3)', borderRadius: 4, padding: '2px 6px' }}>
              {cat.isActive ? '활성' : '비활성'}
            </div>
          </div>
        ))}
        {(!categories || categories.length === 0) && <div className="empty">카테고리 없음</div>}
      </div>
    </div>
  )
}
