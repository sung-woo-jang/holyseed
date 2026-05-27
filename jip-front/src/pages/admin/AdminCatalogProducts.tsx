import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminProducts } from '@/queries/catalog'
import { useToastStore } from '@/stores/toast'

function fmtKRW(n: number) {
  return n.toLocaleString('ko-KR') + '원'
}

export default function AdminCatalogProducts() {
  const navigate = useNavigate()
  const showToast = useToastStore((s) => s.show)
  const [search, setSearch] = useState('')

  const { data: products, isLoading } = useAdminProducts()

  const filtered = (products as any[] ?? []).filter((p) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      p.code?.toLowerCase().includes(q) ||
      p.name?.toLowerCase().includes(q) ||
      p.modelCode?.toLowerCase().includes(q) ||
      p.itemCode?.toLowerCase().includes(q) ||
      p.itemName?.toLowerCase().includes(q)
    )
  })

  if (isLoading) return <div className="empty">불러오는 중...</div>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <h1 className="h2" style={{ flex: 1 }}>제품 관리</h1>
        <input
          className="input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="제품 코드·이름·서비스 검색"
          style={{ width: 220 }}
        />
        <button className="btn primary sm" onClick={() => {
          showToast('PC 제품 등록 페이지로 이동합니다')
          navigate('/admin/pc/products/new')
        }}>
          + 새 제품
        </button>
      </div>
      <p style={{ color: 'var(--ink-3)', fontSize: 14, marginBottom: 24 }}>
        ServiceItem에 연결된 PC 제품 목록입니다. 제품 편집은 PC 제품 상세에서 진행하세요.
      </p>

      <div style={{ display: 'grid', gap: 10 }}>
        {filtered.map((p: any) => (
          <div
            key={p.id}
            className="card card-pad"
            style={{ display: 'flex', gap: 14, alignItems: 'center', cursor: 'pointer', opacity: p.isActive ? 1 : 0.5 }}
            onClick={() => navigate(`/admin/pc/products/${p.id}`)}
          >
            <div style={{ width: 72, height: 56, borderRadius: 6, overflow: 'hidden', background: 'var(--ink-6)', flexShrink: 0 }}>
              {p.imageUrl ? (
                <img src={p.imageUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-4)', fontSize: 10 }}>없음</div>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{p.name}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-4)' }}>
                {p.code || p.modelCode} · {p.brand && `${p.brand} · `}{p.itemName}
              </div>
              {p.categoryName && (
                <div style={{ fontSize: 11, color: 'var(--ink-5)', marginTop: 2 }}>{p.categoryName}</div>
              )}
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 600 }}>
              {p.price != null ? fmtKRW(p.price) : '현장 확정'}
            </div>
            <span style={{ color: 'var(--ink-3)', fontSize: 16 }}>›</span>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="empty">
            {search ? '검색 결과 없음' : 'ServiceItem에 연결된 제품이 없습니다. PC 제품 상세에서 연결하세요.'}
          </div>
        )}
      </div>
    </div>
  )
}
