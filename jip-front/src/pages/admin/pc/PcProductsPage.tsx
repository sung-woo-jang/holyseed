import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { pcProductsApi, pcCategoriesApi, pcKeys } from '@/queries/pc'
import type { PcCategoryNode } from '@/queries/pc'

export default function PcProductsPage() {
  const navigate = useNavigate()
  const [categoryId, setCategoryId] = useState('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const { data: categories } = useQuery({ queryKey: [...pcKeys.categoriesAll(), 'tree'], queryFn: pcCategoriesApi.tree })

  const { data, isLoading } = useQuery({
    queryKey: ['pc-products', 'search', { categoryId, search }],
    queryFn: () => pcProductsApi.search({
      categoryId: categoryId ? parseInt(categoryId) : undefined,
      includeDescendants: true,
      search: search || undefined,
      limit: 100,
    }),
  })

  const tree = (categories as PcCategoryNode[] | undefined) ?? []
  const products = data?.items || []

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 className="h2">제품 목록</h1>
        <button className="btn primary sm" onClick={() => navigate('/admin/pc/products/new')}>+ 새 제품</button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <select
          className="input"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          style={{ width: 200, fontSize: 13 }}
        >
          <option value="">전체 카테고리</option>
          {tree.map((parent) =>
            parent.children && parent.children.length > 0 ? (
              <optgroup key={parent.id} label={parent.name}>
                <option value={parent.id}>— 전체</option>
                {parent.children.map((child) => (
                  <option key={child.id} value={child.id}>{child.name}</option>
                ))}
              </optgroup>
            ) : (
              <option key={parent.id} value={parent.id}>{parent.name}</option>
            )
          )}
        </select>
        <input
          className="input"
          placeholder="모델코드/이름 검색..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && setSearch(searchInput)}
          style={{ flex: 1, fontSize: 13 }}
        />
        <button className="btn ghost sm" onClick={() => setSearch(searchInput)}>검색</button>
        {search && (
          <button className="btn ghost sm" onClick={() => { setSearch(''); setSearchInput('') }}>초기화</button>
        )}
      </div>

      {isLoading ? (
        <div className="empty">불러오는 중...</div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--bg-deep)', borderBottom: '1px solid var(--ink-6)' }}>
                {['', '모델코드', '제품명', '카테고리', '브랜드', '스펙', ''].map((h, i) => (
                  <th key={i} style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 600, color: 'var(--ink-2)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => navigate(`/admin/pc/products/${p.id}`)}
                  style={{ borderBottom: '1px solid var(--ink-6)', cursor: 'pointer' }}
                  className="pc-compare-row"
                >
                  <td style={{ padding: '8px 12px', width: 48 }}>
                    {p.primaryImageUrl ? (
                      <img src={p.primaryImageUrl} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6 }} />
                    ) : (
                      <div style={{ width: 40, height: 40, borderRadius: 6, background: 'var(--ink-6)' }} />
                    )}
                  </td>
                  <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: 11, color: 'var(--ink-3)' }}>{p.modelCode}</td>
                  <td style={{ padding: '8px 12px', fontWeight: 600 }}>{p.displayName}</td>
                  <td style={{ padding: '8px 12px', color: 'var(--ink-3)' }}>{p.category?.name || '—'}</td>
                  <td style={{ padding: '8px 12px', color: 'var(--ink-3)' }}>{p.brand || '—'}</td>
                  <td style={{ padding: '8px 12px', color: 'var(--ink-3)', fontSize: 12, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.spec || '—'}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                    <button className="btn ghost sm" style={{ fontSize: 11 }} onClick={(e) => { e.stopPropagation(); navigate(`/admin/pc/products/${p.id}/edit`) }}>수정</button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr><td colSpan={7} className="empty" style={{ padding: '32px 12px' }}>제품이 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {data && (
        <div style={{ marginTop: 12, fontSize: 13, color: 'var(--ink-4)', textAlign: 'right' }}>
          {products.length}개 / 전체 {data.total}개
        </div>
      )}
    </div>
  )
}
