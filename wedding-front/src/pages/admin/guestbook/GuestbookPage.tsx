import { useCallback, useEffect, useState } from 'react'
import { api, TOKEN_KEY } from '@/shared/api'
import type { Guestbook } from '@/shared/types'
import { useToast } from '@/shared/ui/toast'
import adminStyles from '../admin-page.module.css'
import styles from './GuestbookPage.module.css'

export default function AdminGuestbookPage() {
  const [coupleId, setCoupleId] = useState<string | null>(null)
  const [entries, setEntries] = useState<Guestbook[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const toast = useToast()

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) return
    api.post('/auth/me')
      .then((res) => setCoupleId(res.data.data?.coupleId ?? null))
      .catch(() => setError('세션을 불러오는데 실패했습니다.'))
  }, [])

  const fetchEntries = useCallback(async () => {
    if (!coupleId) return
    setLoading(true); setError('')
    try {
      const res = await api.post('/guestbook/search', { coupleId, limit: 200 })
      setEntries(res.data.data?.entries ?? [])
    } catch {
      setError('방명록 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }, [coupleId])

  useEffect(() => { fetchEntries() }, [fetchEntries])

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    try {
      await api.post(`/guestbook/${id}/delete`)
      fetchEntries()
    } catch {
      toast.error('방명록 삭제에 실패했습니다.')
    }
  }

  if (!coupleId && !error) return <div className={adminStyles.loading}>정보를 불러오는 중...</div>

  return (
    <div className={adminStyles.pageContainer}>
      <div className={adminStyles.pageHeader}>
        <h1 className={adminStyles.title}>방명록 관리</h1>
        <p className={adminStyles.description}>하객들이 남긴 방명록을 확인하고 관리하세요.</p>
      </div>

      {error && <div className={adminStyles.errorContainer}><p className={adminStyles.errorMessage}>{error}</p></div>}

      {loading ? (
        <div className={styles.loading}>로딩 중...</div>
      ) : entries.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyText}>등록된 방명록이 없습니다</p>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <div className={styles.table}>
            <div className={styles.headRow}>
              <div>작성자</div>
              <div>메시지</div>
              <div>작성일</div>
              <div />
            </div>
            {entries.map((entry) => (
              <div key={entry.id} className={styles.bodyRow}>
                <div className={styles.guestName}>{entry.guestName}</div>
                <div className={styles.message}>{entry.message}</div>
                <div className={styles.dateCell}>{new Date(entry.createdAt).toLocaleDateString('ko-KR')}</div>
                <div className={styles.deleteCell}>
                  <button onClick={() => handleDelete(entry.id)} className={styles.deleteButton} title="삭제">✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
