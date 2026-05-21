import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productsApi, pricesApi, vendorsApi } from '@/lib/pc-api'
import { qk } from '@/queries/keys'

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const productId = parseInt(id!)
  const qc = useQueryClient()
  const navigate = useNavigate()

  const [showAddPrice, setShowAddPrice] = useState(false)
  const [newPrice, setNewPrice] = useState({ vendorId: '', price: '', note: '' })
  const [uploading, setUploading] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: qk.productDetail(productId),
    queryFn: () => productsApi.one(productId),
  })

  const { data: vendors } = useQuery({
    queryKey: qk.vendorsAll(),
    queryFn: vendorsApi.all,
  })

  const upsertPrice = useMutation({
    mutationFn: () =>
      pricesApi.upsert({
        productId,
        vendorId: parseInt(newPrice.vendorId),
        price: parseFloat(newPrice.price),
        note: newPrice.note || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.productDetail(productId) })
      setShowAddPrice(false)
      setNewPrice({ vendorId: '', price: '', note: '' })
    },
  })

  const deletePrice = useMutation({
    mutationFn: (priceId: number) => pricesApi.delete(priceId),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.productDetail(productId) }),
  })

  const deleteImage = useMutation({
    mutationFn: (imageId: number) => productsApi.deleteImage(productId, imageId),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.productDetail(productId) }),
  })

  const setPrimary = useMutation({
    mutationFn: (imageId: number) => productsApi.setPrimaryImage(productId, imageId),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.productDetail(productId) }),
  })

  const deleteProduct = useMutation({
    mutationFn: () => productsApi.delete(productId),
    onSuccess: () => navigate('/'),
  })

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const hasImages = (data?.images?.length ?? 0) === 0
      await productsApi.uploadImage(productId, file, hasImages, 0)
      qc.invalidateQueries({ queryKey: qk.productDetail(productId) })
    } finally {
      setUploading(false)
    }
  }

  if (isLoading) return <div className="p-6 text-gray-400">로딩 중...</div>
  if (!data) return <div className="p-6 text-gray-400">제품을 찾을 수 없습니다.</div>

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => navigate(-1)} className="text-sm text-gray-500 hover:text-gray-700">← 뒤로</button>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-900 font-medium">{data.modelCode}</span>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{data.displayName}</h1>
            <p className="text-sm text-gray-500 font-mono mt-1">{data.modelCode}</p>
            {data.category && (
              <p className="text-xs text-blue-600 mt-1 bg-blue-50 inline-block px-2 py-0.5 rounded">{data.category.name}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/products/${productId}/edit`)}
              className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md"
            >
              수정
            </button>
            <button
              onClick={() => { if (confirm('제품을 삭제할까요? (이미지/가격 포함)')) deleteProduct.mutate() }}
              className="text-sm text-red-500 hover:text-red-700"
            >
              삭제
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-sm">
          {data.brand && <div><span className="text-gray-400">브랜드</span><p className="font-medium">{data.brand}</p></div>}
          {data.spec && <div><span className="text-gray-400">스펙</span><p className="font-medium">{data.spec}</p></div>}
          {data.unit && <div><span className="text-gray-400">단위</span><p className="font-medium">{data.unit}</p></div>}
          {data.note && <div className="col-span-3"><span className="text-gray-400">비고</span><p>{data.note}</p></div>}
          {data.description && (
            <div className="col-span-3 mt-2 p-3 bg-amber-50 rounded-lg border border-amber-100">
              <span className="text-xs text-amber-600 font-medium">설명 (메모)</span>
              <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{data.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* 이미지 */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">이미지</h2>
          <label className={`cursor-pointer text-sm bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
            {uploading ? '업로드 중...' : '+ 이미지 추가'}
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
          </label>
        </div>
        <div className="flex flex-wrap gap-3">
          {data.images?.map((img) => (
            <div key={img.id} className="relative group">
              <img
                src={img.url}
                alt=""
                className={`w-24 h-24 object-cover rounded-lg border-2 ${img.isPrimary ? 'border-blue-500' : 'border-gray-200'}`}
              />
              {img.isPrimary && (
                <span className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-1 py-0.5 rounded">대표</span>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 rounded-lg flex items-center justify-center gap-2">
                {!img.isPrimary && (
                  <button
                    onClick={() => setPrimary.mutate(img.id)}
                    className="text-white text-xs bg-blue-600 px-2 py-1 rounded"
                  >
                    대표
                  </button>
                )}
                <button
                  onClick={() => { if (confirm('이미지를 삭제할까요?')) deleteImage.mutate(img.id) }}
                  className="text-white text-xs bg-red-600 px-2 py-1 rounded"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
          {(!data.images || data.images.length === 0) && (
            <p className="text-sm text-gray-400">이미지 없음</p>
          )}
        </div>
      </div>

      {/* 업체별 가격 */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">업체별 가격</h2>
          <button
            onClick={() => setShowAddPrice(true)}
            className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700"
          >
            + 가격 추가
          </button>
        </div>

        {showAddPrice && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex gap-3 items-end">
              <div>
                <label className="block text-xs text-gray-500 mb-1">업체</label>
                <select
                  value={newPrice.vendorId}
                  onChange={(e) => setNewPrice((p) => ({ ...p, vendorId: e.target.value }))}
                  className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">선택...</option>
                  {vendors?.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">가격 (원)</label>
                <input
                  type="number"
                  value={newPrice.price}
                  onChange={(e) => setNewPrice((p) => ({ ...p, price: e.target.value }))}
                  className="border border-gray-300 rounded px-2 py-1.5 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">비고</label>
                <input
                  type="text"
                  value={newPrice.note}
                  onChange={(e) => setNewPrice((p) => ({ ...p, note: e.target.value }))}
                  className="border border-gray-300 rounded px-2 py-1.5 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="택배비포함 등"
                />
              </div>
              <button
                onClick={() => upsertPrice.mutate()}
                disabled={!newPrice.vendorId || !newPrice.price || upsertPrice.isPending}
                className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                저장
              </button>
              <button onClick={() => setShowAddPrice(false)} className="text-sm text-gray-500">취소</button>
            </div>
          </div>
        )}

        {data.prices && data.prices.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 text-gray-500 font-medium">업체</th>
                <th className="text-right py-2 text-gray-500 font-medium">가격</th>
                <th className="text-left py-2 pl-4 text-gray-500 font-medium">비고</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {[...data.prices].sort((a, b) => Number(a.price) - Number(b.price)).map((price) => (
                <tr key={price.id} className="border-b border-gray-100">
                  <td className="py-2 font-medium text-gray-900">{price.vendor?.name || `업체 #${price.vendorId}`}</td>
                  <td className="py-2 text-right font-bold text-blue-700">{Number(price.price).toLocaleString()}원</td>
                  <td className="py-2 pl-4 text-gray-500">{price.note}</td>
                  <td className="py-2 text-right">
                    <button
                      onClick={() => { if (confirm('가격을 삭제할까요?')) deletePrice.mutate(price.id) }}
                      className="text-xs text-red-400 hover:text-red-600"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-gray-400">등록된 가격 없음</p>
        )}
      </div>
    </div>
  )
}
