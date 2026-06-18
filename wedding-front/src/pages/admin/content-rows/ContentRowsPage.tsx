import { useState, useEffect, useCallback } from 'react'
import { api, TOKEN_KEY } from '@/shared/api'
import { ContentRowList } from '@/widgets/admin-content-rows/ContentRowList'
import { ContentRowForm } from '@/widgets/admin-content-rows/ContentRowForm'
import type { ContentRow } from '@/shared/types'
import styles from './ContentRowsPage.module.css'

export default function AdminContentRowsPage() {
  const [rows, setRows] = useState<ContentRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingRow, setEditingRow] = useState<ContentRow | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [coupleId, setCoupleId] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) return
    api.post('/auth/me')
      .then((res) => setCoupleId(res.data.data?.coupleId ?? null))
      .catch(() => setError('세션을 불러오는데 실패했습니다.'))
  }, [])

  const fetchContentRows = useCallback(async () => {
    if (!coupleId) return
    setIsLoading(true); setError(null)
    try {
      const res = await api.post('/content-rows/search', { coupleId, includeHidden: true })
      setRows(res.data.data ?? [])
    } catch {
      setError('콘텐츠 행을 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [coupleId])

  useEffect(() => { fetchContentRows() }, [fetchContentRows])

  const handleDelete = async (id: string) => {
    if (!confirm('이 콘텐츠 Row를 삭제하시겠습니까?')) return
    try {
      await api.post(`/content-rows/${id}/delete`)
      await fetchContentRows()
    } catch {
      alert('삭제에 실패했습니다.')
    }
  }

  if (!coupleId) return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}><h1 className={styles.title}>콘텐츠 Row 관리</h1><p className={styles.description}>세션을 불러오는 중...</p></div>
    </div>
  )

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div>
            <h1 className={styles.title}>콘텐츠 Row 관리</h1>
            <p className={styles.description}>청첩장 페이지의 갤러리 섹션을 구성하세요</p>
          </div>
          <button className={styles.createButton} onClick={() => { setEditingRow(null); setShowForm(true) }} disabled={showForm}>
            <span className={styles.buttonIcon}>+</span> 새 Row 추가
          </button>
        </div>
      </div>

      {error && <div className={styles.errorContainer}><p className={styles.errorMessage}>{error}</p></div>}

      {showForm && (
        <div className={styles.formSection}>
          <ContentRowForm
            coupleId={coupleId}
            row={editingRow}
            onSubmit={() => { setShowForm(false); setEditingRow(null); fetchContentRows() }}
            onCancel={() => { setShowForm(false); setEditingRow(null) }}
          />
        </div>
      )}

      {isLoading ? (
        <div className={styles.loading}><div className={styles.spinner} /><p>콘텐츠 Row를 불러오는 중...</p></div>
      ) : (
        <div className={styles.contentSection}>
          <ContentRowList rows={rows} onEdit={(row) => { setEditingRow(row); setShowForm(true) }} onDelete={handleDelete} />
        </div>
      )}
    </div>
  )
}
