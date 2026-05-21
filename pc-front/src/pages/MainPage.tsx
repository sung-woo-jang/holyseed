import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { categoriesApi, productsApi } from '@/lib/pc-api'
import type { CategoryNode } from '@/lib/pc-api'
import { qk } from '@/queries/keys'

function CategoryTree({
  nodes,
  selectedId,
  onSelect,
  level = 0,
}: {
  nodes: CategoryNode[]
  selectedId: number | null
  onSelect: (id: number) => void
  level?: number
}) {
  return (
    <ul className="space-y-0.5">
      {nodes.map((node) => (
        <li key={node.id}>
          <button
            onClick={() => onSelect(node.id)}
            className={`w-full text-left px-3 py-1.5 rounded text-sm transition-colors ${
              selectedId === node.id
                ? 'bg-blue-100 text-blue-700 font-medium'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            style={{ paddingLeft: `${12 + level * 16}px` }}
          >
            {level > 0 && <span className="mr-1 text-gray-400">›</span>}
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

export function MainPage() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const selectedCategoryId = params.get('categoryId') ? Number(params.get('categoryId')) : null

  const [searchText, setSearchText] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const { data: treeData } = useQuery({
    queryKey: qk.categoryTree(),
    queryFn: categoriesApi.tree,
  })

  const { data: compareData, isLoading } = useQuery({
    queryKey: qk.compare({ categoryId: selectedCategoryId }),
    queryFn: () => selectedCategoryId ? productsApi.compare(selectedCategoryId) : null,
    enabled: !!selectedCategoryId,
  })

  const vendors = compareData?.vendors || []
  const products = (compareData?.products || []).filter((p) =>
    !searchText || p.modelCode.toLowerCase().includes(searchText.toLowerCase()) || p.displayName.toLowerCase().includes(searchText.toLowerCase())
  )

  const getPrice = (productId: number, vendorId: number) => {
    const product = compareData?.products.find((p) => p.id === productId)
    const price = product?.prices?.find((pr) => pr.vendorId === vendorId)
    return price?.price
  }

  const getMinPrice = (productId: number) => {
    const product = compareData?.products.find((p) => p.id === productId)
    if (!product?.prices?.length) return null
    return Math.min(...product.prices.map((p) => Number(p.price)))
  }

  return (
    <div className="flex h-[calc(100vh-53px)]">
      {/* 사이드바: 카테고리 트리 */}
      <aside className="w-56 bg-white border-r border-gray-200 overflow-y-auto p-3">
        <p className="text-xs font-semibold text-gray-400 uppercase mb-2 px-3">카테고리</p>
        {treeData ? (
          <CategoryTree
              nodes={treeData}
              selectedId={selectedCategoryId}
              onSelect={(id) => setParams({ categoryId: String(id) })}
            />
        ) : (
          <p className="text-sm text-gray-400 px-3">로딩 중...</p>
        )}
      </aside>

      {/* 메인: 비교 테이블 */}
      <div className="flex-1 overflow-auto p-6">
        {!selectedCategoryId ? (
          <div className="flex items-center justify-center h-64 text-gray-400">
            <div className="text-center">
              <p className="text-5xl mb-4">📋</p>
              <p className="text-lg font-medium">카테고리를 선택하세요</p>
              <p className="text-sm mt-1">좌측에서 카테고리를 클릭하면 단가 비교표가 표시됩니다</p>
            </div>
          </div>
        ) : isLoading ? (
          <p className="text-gray-400 text-sm">불러오는 중...</p>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4">
              <input
                type="text"
                placeholder="모델코드/이름 검색..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && setSearchText(searchInput)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {searchText && (
                <button onClick={() => { setSearchText(''); setSearchInput('') }} className="text-sm text-gray-500 hover:text-gray-700">
                  초기화
                </button>
              )}
              <span className="ml-auto text-sm text-gray-500">{products.length}개 제품</span>
            </div>

            {vendors.length === 0 ? (
              <p className="text-gray-400 text-sm">이 카테고리에 제품이 없습니다.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse bg-white rounded-xl shadow-sm overflow-hidden">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-4 py-3 font-semibold text-gray-700 w-12">이미지</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">모델코드</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">제품명</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">스펙</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">설명</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">비고</th>
                      {vendors.map((v) => (
                        <th key={v.id} className="text-right px-4 py-3 font-semibold text-gray-700 min-w-[100px]">
                          {v.name}
                        </th>
                      ))}
                      <th className="text-right px-4 py-3 font-semibold text-gray-700">최저가</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => {
                      const minPrice = getMinPrice(product.id)
                      return (
                        <tr
                          key={product.id}
                          onClick={() => navigate(`/products/${product.id}`)}
                          className="group border-b border-gray-100 hover:bg-blue-50 cursor-pointer"
                        >
                          <td className="px-4 py-3">
                            {product.primaryImageUrl ? (
                              <img src={product.primaryImageUrl} alt="" className="w-10 h-10 object-cover rounded" />
                            ) : (
                              <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">없음</div>
                            )}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-gray-500">{product.modelCode}</td>
                          <td className="px-4 py-3 font-medium text-gray-900">{product.displayName}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs max-w-[180px] truncate" title={product.spec ?? ''}>{product.spec}</td>
                          <td className="px-4 py-3 text-gray-600 text-xs max-w-[200px] truncate" title={product.description ?? ''}>{product.description}</td>
                          <td className="px-4 py-3 text-gray-400 text-xs max-w-[140px] truncate" title={product.note ?? ''}>{product.note}</td>
                          {vendors.map((v) => {
                            const price = getPrice(product.id, v.id)
                            const isMin = price !== undefined && price === minPrice
                            return (
                              <td key={v.id} className={`px-4 py-3 text-right font-medium ${isMin ? 'text-green-600' : 'text-gray-700'}`}>
                                {price !== undefined ? `${Number(price).toLocaleString()}원` : <span className="text-gray-300">—</span>}
                              </td>
                            )
                          })}
                          <td className="px-4 py-3 text-right font-bold text-blue-600">
                            {minPrice !== null ? `${Number(minPrice).toLocaleString()}원` : <span className="text-gray-300">—</span>}
                          </td>
                          <td className="px-2 py-3 w-10">
                            <button
                              onClick={(e) => { e.stopPropagation(); navigate(`/products/${product.id}/edit`) }}
                              className="opacity-0 group-hover:opacity-100 text-xs text-gray-400 hover:text-blue-600 transition-opacity"
                            >
                              수정
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
