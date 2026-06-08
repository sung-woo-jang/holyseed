import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { pcCategoriesApi, pcProductsApi, pcKeys } from '@/queries/pc'
import type { PcCategoryNode, PcProduct } from '@/queries/pc'

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

function ImageLightbox({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'zoom-out',
      }}
    >
      <img
        src={url}
        alt=""
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8, cursor: 'default', boxShadow: '0 8px 48px rgba(0,0,0,0.5)' }}
      />
      <button
        onClick={onClose}
        style={{ position: 'absolute', top: 20, right: 24, background: 'none', border: 'none', color: '#fff', fontSize: 32, cursor: 'pointer', lineHeight: 1 }}
      >×</button>
    </div>
  )
}

function CatalogGrid({ products, onSelect }: { products: PcProduct[]; onSelect: (p: PcProduct) => void }) {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  return (
    <>
      {lightboxUrl && <ImageLightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
        {products.map((p) => (
          <div
            key={p.id}
            onClick={() => onSelect(p)}
            className="pc-compare-row"
            style={{ border: '1px solid var(--ink-6)', borderRadius: 10, overflow: 'hidden', cursor: 'pointer', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ position: 'relative', aspectRatio: '1/1', background: 'var(--bg-deep)', flexShrink: 0 }}>
              {p.primaryImageUrl ? (
                <img
                  src={p.primaryImageUrl}
                  alt=""
                  onClick={(e) => { e.stopPropagation(); setLightboxUrl(p.primaryImageUrl!) }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', cursor: 'zoom-in' }}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--ink-4)' }}>
                  이미지 없음
                </div>
              )}
            </div>
            <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--ink-4)' }}>{p.modelCode}</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-1)', lineHeight: 1.3 }}>{p.displayName}</div>
              {p.brand && <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>{p.brand}</div>}
              {p.spec && (
                <div style={{ fontSize: 12, color: 'var(--ink-4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.spec}>{p.spec}</div>
              )}
              {p.representativePrice != null && (
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-1)', marginTop: 6 }}>
                  {Number(p.representativePrice).toLocaleString()}원~
                </div>
              )}
            </div>
          </div>
        ))}
        {products.length === 0 && (
          <div className="empty" style={{ gridColumn: '1/-1' }}>제품이 없습니다.</div>
        )}
      </div>
    </>
  )
}

type ViewMode = 'table' | 'catalog'

export default function PcComparePage() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const rawCategoryId = params.get('categoryId')
  const selectedCategoryId = rawCategoryId ? Number(rawCategoryId) : null
  const isAll = rawCategoryId === 'all' || rawCategoryId === null
  const [searchInput, setSearchInput] = useState('')
  const [searchText, setSearchText] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('table')

  const { data: treeData } = useQuery({
    queryKey: pcKeys.categoryTree(),
    queryFn: pcCategoriesApi.tree,
  })

  const { data: compareData, isLoading: compareLoading } = useQuery({
    queryKey: pcKeys.productCompare(selectedCategoryId),
    queryFn: () => pcProductsApi.compare(selectedCategoryId!),
    enabled: !isAll && selectedCategoryId !== null,
  })

  const { data: allData, isLoading: allLoading } = useQuery({
    queryKey: ['pc-products', 'search', { search: searchText }],
    queryFn: () => pcProductsApi.search({ search: searchText || undefined, limit: 200 }),
    enabled: isAll,
  })

  const isLoading = isAll ? allLoading : compareLoading

  const vendors = compareData?.vendors || []
  const filteredCompare = (compareData?.products || []).filter((p) =>
    !searchText ||
    p.modelCode.toLowerCase().includes(searchText.toLowerCase()) ||
    p.displayName.toLowerCase().includes(searchText.toLowerCase())
  )
  const allProducts = allData?.items || []

  const getPrice = (productId: number, vendorId: number) => {
    const product = compareData?.products.find((p) => p.id === productId)
    return product?.prices?.find((pr) => pr.vendorId === vendorId)?.price
  }

  const getMinPrice = (productId: number) => {
    const product = compareData?.products.find((p) => p.id === productId)
    if (!product?.prices?.length) return null
    return Math.min(...product.prices.map((p) => Number(p.price)))
  }

  const handleSearch = () => setSearchText(searchInput)
  const handleReset = () => { setSearchText(''); setSearchInput('') }

  const displayProducts = isAll ? allProducts : filteredCompare

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

        <button
          type="button"
          onClick={() => { setParams({ categoryId: 'all' }); setSearchText(''); setSearchInput('') }}
          style={{
            width: '100%',
            textAlign: 'left',
            padding: '6px 12px',
            borderRadius: 6,
            border: 'none',
            cursor: 'pointer',
            fontSize: 13,
            background: isAll ? 'var(--bg-deep)' : 'transparent',
            color: isAll ? 'var(--ink-1)' : 'var(--ink-2)',
            fontWeight: isAll ? 700 : 400,
            marginBottom: 4,
          }}
        >
          전체
        </button>

        {treeData ? (
          <CategoryTree
            nodes={treeData}
            selectedId={selectedCategoryId}
            onSelect={(id) => { setParams({ categoryId: String(id) }); setSearchText(''); setSearchInput('') }}
          />
        ) : (
          <div style={{ color: 'var(--ink-4)', fontSize: 13 }}>불러오는 중...</div>
        )}
      </aside>

      {/* 메인 영역 */}
      <div style={{ flex: 1, overflowX: 'auto', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <input
            className="input"
            placeholder="모델코드/이름 검색..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            style={{ width: 220, fontSize: 13 }}
          />
          <button className="btn ghost sm" onClick={handleSearch}>검색</button>
          {searchText && (
            <button className="btn ghost sm" onClick={handleReset}>초기화</button>
          )}

          {/* 뷰 토글 */}
          <div style={{ display: 'flex', border: '1px solid var(--ink-5)', borderRadius: 6, overflow: 'hidden' }}>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              style={{
                padding: '5px 12px', fontSize: 12, border: 'none', cursor: 'pointer',
                background: viewMode === 'table' ? 'var(--ink-2)' : 'transparent',
                color: viewMode === 'table' ? 'var(--bg)' : 'var(--ink-3)',
                fontWeight: viewMode === 'table' ? 600 : 400,
              }}
            >
              ☰ 테이블
            </button>
            <button
              type="button"
              onClick={() => setViewMode('catalog')}
              style={{
                padding: '5px 12px', fontSize: 12, border: 'none', borderLeft: '1px solid var(--ink-5)', cursor: 'pointer',
                background: viewMode === 'catalog' ? 'var(--ink-2)' : 'transparent',
                color: viewMode === 'catalog' ? 'var(--bg)' : 'var(--ink-3)',
                fontWeight: viewMode === 'catalog' ? 600 : 400,
              }}
            >
              ⊞ 카탈로그
            </button>
          </div>

          <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--ink-3)' }}>
            {displayProducts.length}개 제품
          </span>
          <button className="btn primary sm" onClick={() => navigate('/admin/pc/products/new')}>+ 새 제품</button>
        </div>

        {isLoading ? (
          <div className="empty">불러오는 중...</div>
        ) : viewMode === 'catalog' ? (
          <CatalogGrid
            products={displayProducts}
            onSelect={(p) => navigate(`/admin/pc/products/${p.id}`)}
          />
        ) : isAll ? (
          /* 전체 목록 테이블 */
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, background: 'var(--bg)', borderRadius: 8, overflow: 'hidden' }}>
            <thead>
              <tr style={{ background: 'var(--bg-deep)', borderBottom: '1px solid var(--ink-6)' }}>
                <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 600, color: 'var(--ink-2)', width: 48 }}></th>
                <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 600, color: 'var(--ink-2)' }}>모델코드</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 600, color: 'var(--ink-2)' }}>제품명</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 600, color: 'var(--ink-2)' }}>카테고리</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 600, color: 'var(--ink-2)' }}>브랜드</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 600, color: 'var(--ink-2)' }}>스펙</th>
                <th style={{ width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {allProducts.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => navigate(`/admin/pc/products/${p.id}`)}
                  style={{ borderBottom: '1px solid var(--ink-6)', cursor: 'pointer' }}
                  className="pc-compare-row"
                >
                  <td style={{ padding: '8px 12px' }}>
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
                    <button className="btn ghost sm" style={{ fontSize: 11 }} onClick={(e) => { e.stopPropagation(); navigate(`/admin/pc/products/${p.id}`) }}>수정</button>
                  </td>
                </tr>
              ))}
              {allProducts.length === 0 && (
                <tr><td colSpan={7} className="empty" style={{ padding: '32px 12px' }}>제품이 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        ) : filteredCompare.length === 0 ? (
          <div className="empty">이 카테고리에 제품이 없습니다.</div>
        ) : (
          /* 비교 테이블 */
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
              {filteredCompare.map((product) => {
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
                        onClick={(e) => { e.stopPropagation(); navigate(`/admin/pc/products/${product.id}`) }}
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
      </div>
    </div>
  )
}
