import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useSiteAssets } from '@/queries/siteAssets'
import { useToastStore } from '@/stores/toast'

async function saveCaptionOnly(key: string, caption: string) {
  return api.post(`/site-assets/admin/${key}/caption`, { caption })
}

const ASSET_KEYS = [
  { key: 'home.hero',      label: '홈 Hero 사진',       desc: '홈 페이지 상단 대표 사진' },
  { key: 'home.about_cta', label: '홈 About CTA 사진',  desc: '홈 About 섹션 옆 사진' },
  { key: 'about.intro',    label: 'About 인트로 사진',   desc: 'About 페이지 소개 사진' },
  { key: 'about.gallery.1',label: 'About 갤러리 1',     desc: 'About 갤러리 첫 번째' },
  { key: 'about.gallery.2',label: 'About 갤러리 2',     desc: 'About 갤러리 두 번째' },
]

export default function AdminSiteAssets() {
  const { data: assets, isLoading } = useSiteAssets()
  const showToast = useToastStore((s) => s.show)
  const qc = useQueryClient()
  const [uploading, setUploading] = useState<string | null>(null)
  const [savingCaption, setSavingCaption] = useState<string | null>(null)
  const [captions, setCaptions] = useState<Record<string, string>>({})

  const getCaption = (key: string) =>
    captions[key] !== undefined ? captions[key] : (assets?.[key]?.caption ?? '')

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(key)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('assetKey', key)
      fd.append('caption', getCaption(key))
      await api.post('/uploads/site-asset', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      await qc.invalidateQueries({ queryKey: ['site-assets'] })
      showToast('사이트 사진이 업데이트됐어요')
    } catch {
      showToast('업로드 실패', 'error')
    } finally {
      setUploading(null)
      e.target.value = ''
    }
  }

  if (isLoading) return <div className="empty">불러오는 중...</div>

  return (
    <div>
      <h1 className="h2 mb-24">사이트 사진 관리</h1>
      <p style={{ color: 'var(--ink-3)', fontSize: 14, marginBottom: 24 }}>
        홈·About 페이지에 표시되는 대표 사진들입니다. 교체하면 즉시 반영됩니다.
      </p>

      <div style={{ display: 'grid', gap: 16 }}>
        {ASSET_KEYS.map(({ key, label, desc }) => {
          const asset = assets?.[key]
          const isUp = uploading === key
          return (
            <div key={key} className="card card-pad" style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
              <div
                style={{
                  width: 160,
                  height: 110,
                  borderRadius: 8,
                  overflow: 'hidden',
                  background: 'var(--ink-6)',
                  flexShrink: 0,
                }}
              >
                {asset?.imageUrl ? (
                  <img src={asset.imageUrl} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--ink-4)',
                      fontSize: 12,
                    }}
                  >
                    사진 없음
                  </div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 12 }}>{desc}</div>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, color: 'var(--ink-2)' }}>
                    Caption (선택)
                  </div>
                  <input
                    className="input"
                    value={getCaption(key)}
                    onChange={(e) => setCaptions((prev) => ({ ...prev, [key]: e.target.value }))}
                    placeholder="사진 설명 텍스트"
                    style={{ fontSize: 13 }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <label className="btn ghost sm" style={{ cursor: 'pointer' }}>
                    {isUp ? '업로드 중...' : '사진 교체'}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => handleUpload(e, key)}
                      disabled={!!uploading}
                    />
                  </label>
                  {asset && (
                    <button
                      type="button"
                      className="btn ghost sm"
                      disabled={savingCaption === key}
                      onClick={async () => {
                        setSavingCaption(key)
                        try {
                          await saveCaptionOnly(key, getCaption(key))
                          await qc.invalidateQueries({ queryKey: ['site-assets'] })
                          showToast('Caption이 저장됐어요')
                        } catch {
                          showToast('저장 실패', 'error')
                        } finally {
                          setSavingCaption(null)
                        }
                      }}
                    >
                      {savingCaption === key ? '저장 중...' : 'Caption 저장'}
                    </button>
                  )}
                  {asset?.imageUrl && (
                    <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>{key}</span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
