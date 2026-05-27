import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { pcProductsApi, pcVendorsApi, pcPricesApi, pcKeys } from '@/queries/pc'
import { useServiceItems } from '@/queries/catalog'
import { useToastStore } from '@/stores/toast'

export default function PcProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const productId = parseInt(id!)
  const navigate = useNavigate()
  const qc = useQueryClient()
  const showToast = useToastStore((s) => s.show)

  const [showAddPrice, setShowAddPrice] = useState(false)
  const [newPrice, setNewPrice] = useState({ vendorId: '', price: '', note: '' })
  const [uploading, setUploading] = useState(false)
  const [linkForm, setLinkForm] = useState({ serviceItemId: '', code: '', illustKind: '', sortOrder: '0' })
  const [linkSaving, setLinkSaving] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: pcKeys.productDetail(productId),
    queryFn: () => pcProductsApi.one(productId),
  })

  const { data: vendors } = useQuery({
    queryKey: pcKeys.vendorsAll(),
    queryFn: pcVendorsApi.all,
  })

  const { data: serviceItems } = useServiceItems()

  const invalidate = () => qc.invalidateQueries({ queryKey: pcKeys.productDetail(productId) })

  const upsertPrice = useMutation({
    mutationFn: () =>
      pcPricesApi.upsert({
        productId,
        vendorId: parseInt(newPrice.vendorId),
        price: parseFloat(newPrice.price),
        note: newPrice.note || undefined,
      }),
    onSuccess: () => {
      invalidate()
      setShowAddPrice(false)
      setNewPrice({ vendorId: '', price: '', note: '' })
      showToast('가격이 저장됐어요')
    },
    onError: () => showToast('저장 실패', 'error'),
  })

  const deletePrice = useMutation({
    mutationFn: (priceId: number) => pcPricesApi.delete(priceId),
    onSuccess: () => { invalidate(); showToast('가격이 삭제됐어요') },
    onError: () => showToast('삭제 실패', 'error'),
  })

  const deleteImage = useMutation({
    mutationFn: (imageId: number) => pcProductsApi.deleteImage(productId, imageId),
    onSuccess: () => { invalidate(); showToast('이미지가 삭제됐어요') },
    onError: () => showToast('삭제 실패', 'error'),
  })

  const setPrimary = useMutation({
    mutationFn: (imageId: number) => pcProductsApi.setPrimaryImage(productId, imageId),
    onSuccess: () => { invalidate(); showToast('대표 이미지가 변경됐어요') },
  })

  const deleteProduct = useMutation({
    mutationFn: () => pcProductsApi.delete(productId),
    onSuccess: () => { showToast('제품이 삭제됐어요'); navigate('/admin/pc/products') },
    onError: () => showToast('삭제 실패', 'error'),
  })

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const isFirst = (data?.images?.length ?? 0) === 0
      await pcProductsApi.uploadImage(productId, file, isFirst, 0)
      invalidate()
      showToast('이미지가 업로드됐어요')
    } catch {
      showToast('업로드 실패', 'error')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleLinkSave = async () => {
    setLinkSaving(true)
    try {
      await pcProductsApi.linkServiceItem(productId, {
        serviceItemId: linkForm.serviceItemId ? parseInt(linkForm.serviceItemId) : null,
        code: linkForm.code || null,
        illustKind: linkForm.illustKind || undefined,
        sortOrder: parseInt(linkForm.sortOrder) || 0,
      })
      await invalidate()
      showToast('연결 정보가 저장됐어요')
    } catch {
      showToast('저장 실패', 'error')
    } finally {
      setLinkSaving(false)
    }
  }

  if (isLoading) return <div className="empty">불러오는 중...</div>
  if (!data) return <div className="empty">제품을 찾을 수 없습니다.</div>

  return (
    <div>
      <div className="steps mb-16">
        <span className="link" style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/pc/products')}>제품</span>
        <span className="sep">›</span>
        <b>{data.modelCode}</b>
      </div>

      {/* 기본 정보 */}
      <div className="card card-pad mb-16">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h1 className="h2" style={{ marginBottom: 4 }}>{data.displayName}</h1>
            <div style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--ink-3)' }}>{data.modelCode}</div>
            {data.category && (
              <div style={{ display: 'inline-block', marginTop: 6, padding: '2px 8px', background: 'var(--bg-deep)', borderRadius: 4, fontSize: 12, color: 'var(--ink-2)' }}>
                {data.category.name}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn ghost sm" onClick={() => navigate(`/admin/pc/products/${productId}/edit`)}>수정</button>
            <button
              className="btn ghost sm"
              style={{ color: 'var(--ink-3)' }}
              onClick={() => { if (confirm('제품을 삭제할까요? (이미지·가격 포함)')) deleteProduct.mutate() }}
            >
              삭제
            </button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, fontSize: 13 }}>
          {data.brand && <div><div style={{ color: 'var(--ink-3)', marginBottom: 2 }}>브랜드</div><div style={{ fontWeight: 600 }}>{data.brand}</div></div>}
          {data.spec && <div><div style={{ color: 'var(--ink-3)', marginBottom: 2 }}>스펙</div><div>{data.spec}</div></div>}
          {data.unit && <div><div style={{ color: 'var(--ink-3)', marginBottom: 2 }}>단위</div><div>{data.unit}</div></div>}
          {data.note && (
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ color: 'var(--ink-3)', marginBottom: 2 }}>비고</div>
              <div>{data.note}</div>
            </div>
          )}
          {data.description && (
            <div style={{ gridColumn: '1 / -1', padding: 12, background: 'var(--bg-deep)', borderRadius: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-3)', marginBottom: 4 }}>설명 (메모)</div>
              <div style={{ fontSize: 13, whiteSpace: 'pre-wrap' }}>{data.description}</div>
            </div>
          )}
        </div>
      </div>

      {/* 고객 사이트 연결 */}
      <div className="card card-pad mb-16">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 className="h3">고객 사이트 연결</h3>
          {data.serviceItemId ? (
            <span style={{ fontSize: 12, padding: '3px 8px', background: 'var(--color-primary, #3182ce)', color: '#fff', borderRadius: 4 }}>연결됨</span>
          ) : (
            <span style={{ fontSize: 12, padding: '3px 8px', background: 'var(--ink-5)', color: 'var(--ink-2)', borderRadius: 4 }}>미연결 (고객 미노출)</span>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          <label>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>ServiceItem</div>
            <select
              className="input"
              value={linkForm.serviceItemId || String(data.serviceItemId ?? '')}
              onChange={(e) => setLinkForm((f) => ({ ...f, serviceItemId: e.target.value }))}
            >
              <option value="">연결 안 함</option>
              {serviceItems?.map((si) => (
                <option key={si.id} value={si.id}>{si.name} ({si.code})</option>
              ))}
            </select>
          </label>
          <label>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>URL 코드 (고유)</div>
            <input
              className="input"
              placeholder="예: k1-1"
              defaultValue={data.code ?? ''}
              onChange={(e) => setLinkForm((f) => ({ ...f, code: e.target.value }))}
            />
          </label>
          <label>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>일러스트 종류</div>
            <input
              className="input"
              placeholder="예: hood"
              defaultValue={data.illustKind ?? 'default'}
              onChange={(e) => setLinkForm((f) => ({ ...f, illustKind: e.target.value }))}
            />
          </label>
          <label>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>노출 순서</div>
            <input
              type="number"
              className="input"
              defaultValue={data.sortOrder ?? 0}
              onChange={(e) => setLinkForm((f) => ({ ...f, sortOrder: e.target.value }))}
            />
          </label>
        </div>
        {data.representativePrice != null && (
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 10 }}>
            대표가 (캐시): <b style={{ color: 'var(--ink-1)' }}>{data.representativePrice.toLocaleString()}원</b>
          </div>
        )}
        <button className="btn primary sm" onClick={handleLinkSave} disabled={linkSaving}>
          {linkSaving ? '저장 중...' : '연결 저장'}
        </button>
      </div>

      {/* 이미지 */}
      <div className="card card-pad mb-16">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 className="h3">이미지</h3>
          <label className="btn ghost sm">
            {uploading ? '업로드 중...' : '+ 이미지 추가'}
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} disabled={uploading} />
          </label>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {data.images?.map((img) => (
            <div key={img.id} style={{ position: 'relative' }}>
              <img
                src={img.url}
                alt=""
                style={{
                  width: 96, height: 96, objectFit: 'cover', borderRadius: 8,
                  border: `2px solid ${img.isPrimary ? 'var(--color-primary, #3182ce)' : 'var(--ink-6)'}`,
                }}
              />
              {img.isPrimary && (
                <div style={{ position: 'absolute', top: 4, left: 4, background: 'var(--color-primary, #3182ce)', color: '#fff', fontSize: 10, padding: '1px 4px', borderRadius: 3 }}>
                  대표
                </div>
              )}
              <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                {!img.isPrimary && (
                  <button className="btn ghost sm" style={{ fontSize: 11, padding: '2px 6px' }} onClick={() => setPrimary.mutate(img.id)}>대표</button>
                )}
                <button
                  className="btn ghost sm"
                  style={{ fontSize: 11, padding: '2px 6px', color: 'var(--ink-3)' }}
                  onClick={() => { if (confirm('이미지를 삭제할까요?')) deleteImage.mutate(img.id) }}
                >삭제</button>
              </div>
            </div>
          ))}
          {(!data.images || data.images.length === 0) && (
            <div style={{ color: 'var(--ink-4)', fontSize: 13 }}>이미지 없음</div>
          )}
        </div>
      </div>

      {/* 업체별 가격 */}
      <div className="card card-pad">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 className="h3">업체별 가격</h3>
          <button className="btn ghost sm" onClick={() => setShowAddPrice(true)}>+ 가격 추가</button>
        </div>

        {showAddPrice && (
          <div className="card card-pad mb-16" style={{ background: 'var(--bg-deep)' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>업체</div>
                <select
                  className="input"
                  value={newPrice.vendorId}
                  onChange={(e) => setNewPrice((p) => ({ ...p, vendorId: e.target.value }))}
                >
                  <option value="">선택...</option>
                  {vendors?.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>가격 (원)</div>
                <input
                  type="number"
                  className="input"
                  value={newPrice.price}
                  onChange={(e) => setNewPrice((p) => ({ ...p, price: e.target.value }))}
                  placeholder="0"
                  style={{ width: 120 }}
                />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>비고</div>
                <input
                  className="input"
                  value={newPrice.note}
                  onChange={(e) => setNewPrice((p) => ({ ...p, note: e.target.value }))}
                  placeholder="택배비포함 등"
                  style={{ width: 120 }}
                />
              </div>
              <button
                className="btn primary sm"
                onClick={() => upsertPrice.mutate()}
                disabled={!newPrice.vendorId || !newPrice.price || upsertPrice.isPending}
              >
                저장
              </button>
              <button className="btn ghost sm" onClick={() => setShowAddPrice(false)}>취소</button>
            </div>
          </div>
        )}

        {data.prices && data.prices.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--ink-6)' }}>
                {['업체', '가격', '비고', ''].map((h, i) => (
                  <th key={i} style={{ textAlign: i === 1 ? 'right' : 'left', padding: '8px 0', fontWeight: 600, color: 'var(--ink-3)', paddingLeft: i === 2 ? 16 : 0 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...data.prices].sort((a, b) => Number(a.price) - Number(b.price)).map((price) => (
                <tr key={price.id} style={{ borderBottom: '1px solid var(--ink-6)' }}>
                  <td style={{ padding: '10px 0', fontWeight: 600 }}>{price.vendor?.name || `업체 #${price.vendorId}`}</td>
                  <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: 700, color: 'var(--ink-1)' }}>{Number(price.price).toLocaleString()}원</td>
                  <td style={{ padding: '10px 0', color: 'var(--ink-3)', paddingLeft: 16 }}>{price.note}</td>
                  <td style={{ padding: '10px 0', textAlign: 'right' }}>
                    <button
                      className="btn ghost sm"
                      style={{ fontSize: 11, color: 'var(--ink-3)' }}
                      onClick={() => { if (confirm('가격을 삭제할까요?')) deletePrice.mutate(price.id) }}
                    >삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ color: 'var(--ink-4)', fontSize: 13 }}>등록된 가격이 없습니다.</div>
        )}
      </div>
    </div>
  )
}
