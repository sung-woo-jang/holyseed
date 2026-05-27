import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { pcCategoriesApi, pcProductsApi, pcKeys } from '@/queries/pc'
import type { PcCategoryNode } from '@/queries/pc'

function CategoryTree({
  nodes,
  selectedId,
  onSelect,
  level = 0,
}: {
  nodes: PcCategoryNode[]
  selectedId: number | null
  onSelect: (id: number) => void
  level?: number
}) {
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {nodes.map((node) => (
        <li key={node.id}>
          <button
            type="button"
            onClick={() => onSelect(node.id)}
            style={{
              width: '100%',
              textAlign: 'left',
              padding: `6px 12px 6px ${12 + level * 16}px`,
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              background: selectedId === node.id ? 'var(--bg-deep)' : 'transparent',
              color: selectedId === node.id ? 'var(--ink-1)' : 'var(--ink-2)',
              fontWeight: selectedId === node.id ? 700 : 400,
            }}
          >
            {level > 0 && <span style={{ marginRight: 4, color: 'var(--ink-5)' }}>›</span>}
            {node.name}
          </button>
          {node.children.length > 0 && (
            <CategoryTree nodes={node.children} selectedId={selectedId} onSelect={onSelect} level={level + 1} />
          )}
        </li>
      ))}
    </ul>
  )
}

export default function PcComparePage() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const selectedCategoryId = params.get('categoryId') ? Number(params.get('categoryId')) : null
  const [searchText, setSearchText] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const { data: treeData } = useQuery({
    queryKey: pcKeys.categoryTree(),
    queryFn: pcCategoriesApi.tree,
  })

  const { data: compareData, isLoading } = useQuery({
    queryKey: pcKeys.productCompare(selectedCategoryId),
    queryFn: () => selectedCategoryId ? pcProductsApi.compare(selectedCategoryId) : null,
    enabled: !!selectedCategoryId,
  })

  const vendors = compareData?.vendors || []
  const products = (compareData?.products || []).filter((p) =>
    !searchText ||
    p.modelCode.toLowerCase().includes(searchText.toLowerCase()) ||
    p.displayName.toLowerCase().includes(searchText.toLowerCase())
  )

  const getPrice = (productId: number, vendorId: number) => {
    const product = compareData?.products.find((p) => p.id === productId)
    return product?.prices?.find((pr) => pr.vendorId === vendorId)?.price
  }

  const getMinPrice = (productId: number) => {
    const product = compareData?.products.find((p) => p.id === productId)
    if (!product?.prices?.length) return null
    return Math.min(...product.prices.map((p) => Number(p.price)))
  }

  return (
    <div style={{ display: 'flex', gap: 0, height: 'calc(100vh - 100px)', minHeight: 400 }}>
      {/* 카테고리 사이드바 */}
      <aside style={{
        width: 200,
        flexShrink: 0,
        borderRight: '1px solid var(--ink-6)',
        overflowY: 'auto',
        paddingRight: 12,
        marginRight: 24,
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-4)', marginBottom: 8, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          카테고리
        </div>
        {treeData ? (
          <CategoryTree
            nodes={treeData}
            selectedId={selectedCategoryId}
            onSelect={(id) => setParams({ categoryId: String(id) })}
          />
        ) : (
          <div style={{ color: 'var(--ink-4)', fontSize: 13 }}>불러오는 중...</div>
        )}
      </aside>

      {/* 비교 테이블 */}
      <div style={{ flex: 1, overflowX: 'auto', overflowY: 'auto' }}>
        {!selectedCategoryId ? (
          <div className="empty" style={{ paddingTop: 80 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>카테고리를 선택하세요</div>
            <div style={{ fontSize: 13 }}>좌측에서 카테고리를 클릭하면 단가 비교표가 표시됩니다</div>
          </div>
        ) : isLoading ? (
          <div className="empty">불러오는 중...</div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <input
                className="input"
                placeholder="모델코드/이름 검색..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && setSearchText(searchInput)}
                style={{ width: 220, fontSize: 13 }}
              />
              {searchText && (
                <button className="btn ghost sm" onClick={() => { setSearchText(''); setSearchInput('') }}>초기화</button>
              )}
              <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--ink-3)' }}>{products.length}개 제품</span>
            </div>

            {products.length === 0 ? (
              <div className="empty">이 카테고리에 제품이 없습니다.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, background: 'var(--bg)', borderRadius: 8, overflow: 'hidden' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-deep)', borderBottom: '1px solid var(--ink-6)' }}>
                    <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 600, color: 'var(--ink-2)', width: 48 }}>이미지</th>
                    <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 600, color: 'var(--ink-2)' }}>모델코드</th>
                    <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 600, color: 'var(--ink-2)' }}>제품명</th>
                    <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 600, color: 'var(--ink-2)', maxWidth: 160 }}>스펙</th>
                    {vendors.map((v) => (
                      <th key={v.id} style={{ textAlign: 'right', padding: '10px 12px', fontWeight: 600, color: 'var(--ink-2)', minWidth: 90 }}>
                        {v.name}
                      </th>
                    ))}
                    <th style={{ textAlign: 'right', padding: '10px 12px', fontWeight: 600, color: 'var(--ink-2)' }}>최저가</th>
                    <th style={{ width: 40 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => {
                    const minPrice = getMinPrice(product.id)
                    return (
                      <tr
                        key={product.id}
                        onClick={() => navigate(`/admin/pc/products/${product.id}`)}
                        style={{ borderBottom: '1px solid var(--ink-6)', cursor: 'pointer' }}
                        className="pc-compare-row"
                      >
                        <td style={{ padding: '8px 12px' }}>
                          {product.primaryImageUrl ? (
                            <img src={product.primaryImageUrl} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6 }} />
                          ) : (
                            <div style={{ width: 40, height: 40, borderRadius: 6, background: 'var(--ink-6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--ink-4)' }}>없음</div>
                          )}
                        </td>
                        <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: 11, color: 'var(--ink-3)' }}>{product.modelCode}</td>
                        <td style={{ padding: '8px 12px', fontWeight: 600 }}>{product.displayName}</td>
                        <td style={{ padding: '8px 12px', color: 'var(--ink-3)', fontSize: 12, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={product.spec ?? ''}>{product.spec}</td>
                        {vendors.map((v) => {
                          const price = getPrice(product.id, v.id)
                          const isMin = price !== undefined && Number(price) === minPrice
                          return (
                            <td key={v.id} style={{ padding: '8px 12px', textAlign: 'right', fontWeight: isMin ? 700 : 400, color: isMin ? 'var(--color-success, #38a169)' : 'var(--ink-2)' }}>
                              {price !== undefined ? `${Number(price).toLocaleString()}원` : <span style={{ color: 'var(--ink-5)' }}>—</span>}
                            </td>
                          )
                        })}
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 800, color: 'var(--ink-1)' }}>
                          {minPrice !== null ? `${Number(minPrice).toLocaleString()}원` : <span style={{ color: 'var(--ink-5)' }}>—</span>}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                          <button
                            className="btn ghost sm"
                            style={{ fontSize: 11 }}
                            onClick={(e) => { e.stopPropagation(); navigate(`/admin/pc/products/${product.id}/edit`) }}
                          >
                            수정
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>
    </div>
  )
}
