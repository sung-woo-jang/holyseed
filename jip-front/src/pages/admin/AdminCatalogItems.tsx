import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { useAdminItems, useAdminCategories, useInvalidateCatalog } from '@/queries/catalog'
import { useToastStore } from '@/stores/toast'

function fmtKRW(n: number) {
  return n.toLocaleString('ko-KR') + '원'
}

export default function AdminCatalogItems() {
  const navigate = useNavigate()
  const { data: categories } = useAdminCategories()
  const showToast = useToastStore((s) => s.show)
  const invalidate = useInvalidateCatalog()
  const [catFilter, setCatFilter] = useState<string>('all')
  const [toggling, setToggling] = useState<string | null>(null)

  const { data: items, isLoading } = useAdminItems(catFilter === 'all' ? undefined : catFilter)

  const handleToggleActive = async (e: React.MouseEvent, code: string, current: boolean) => {
    e.stopPropagation()
    setToggling(code + '-active')
    try {
      await api.post(`/catalog/admin/items/${code}/toggle`, { isActive: !current })
      await invalidate()
    } catch {
      showToast('상태 변경 실패', 'error')
    } finally {
      setToggling(null)
    }
  }

  const handleToggleFeatured = async (e: React.MouseEvent, code: string, current: boolean) => {
    e.stopPropagation()
    setToggling(code + '-featured')
    try {
      await api.post(`/catalog/admin/items/${code}/toggle-featured`, { isFeatured: !current })
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <h1 className="h2" style={{ flex: 1 }}>서비스 아이템 관리</h1>
        <select
          className="input"
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          style={{ width: 160 }}
        >
          <option value="all">전체 카테고리</option>
          {(categories ?? []).map((c: any) => (
            <option key={c.code} value={c.code}>{c.name}</option>
          ))}
        </select>
        <button className="btn primary sm" onClick={() => navigate('/admin/catalog/items/new')}>
          + 새 아이템
        </button>
      </div>
      <p style={{ color: 'var(--ink-3)', fontSize: 14, marginBottom: 24 }}>
        서비스 목록 카드를 관리합니다. 행을 클릭하면 편집 화면으로 이동합니다.
      </p>

      <div style={{ display: 'grid', gap: 10 }}>
        {(items ?? []).map((item: any) => (
          <div
            key={item.code}
            className="card card-pad"
            style={{ display: 'flex', gap: 14, alignItems: 'center', cursor: 'pointer', opacity: item.isActive ? 1 : 0.5 }}
            onClick={() => navigate(`/admin/catalog/items/${item.code}/edit`)}
          >
            <div style={{ width: 72, height: 56, borderRadius: 6, overflow: 'hidden', background: 'var(--ink-6)', flexShrink: 0 }}>
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-4)', fontSize: 10 }}>없음</div>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{item.name}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-4)' }}>
                {item.code} · {item.category?.name}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 600 }}>{fmtKRW(item.price)}</div>
              {item.isFeatured && (
                <span style={{ fontSize: 11, background: 'var(--primary)', color: '#fff', borderRadius: 4, padding: '2px 6px' }}>인기</span>
              )}
              <button
                type="button"
                title="인기 토글"
                style={{ fontSize: 16, background: 'none', border: 'none', cursor: 'pointer', color: item.isFeatured ? 'var(--primary)' : 'var(--ink-5)', lineHeight: 1, padding: '2px 4px' }}
                disabled={toggling === item.code + '-featured'}
                onClick={(e) => handleToggleFeatured(e, item.code, item.isFeatured)}
              >★</button>
              <button
                type="button"
                className={`jobs-switch ${item.isActive ? 'on' : ''}`}
                disabled={toggling === item.code + '-active'}
                onClick={(e) => handleToggleActive(e, item.code, item.isActive)}
              />
            </div>
            <span style={{ color: 'var(--ink-3)', fontSize: 16 }}>›</span>
          </div>
        ))}
        {(!items || items.length === 0) && <div className="empty">아이템 없음</div>}
      </div>
    </div>
  )
}
