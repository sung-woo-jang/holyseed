import { useCallback, useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { api } from '@/shared/api'
import type { Guestbook } from '@/shared/types'
import GuestbookForm from '@/features/guestbook/GuestbookForm'
import styles from './GuestbookSection.module.css'

const PAGE_SIZE = 10

interface GuestbookSectionProps {
  coupleId: string
}

export function GuestbookSection({ coupleId }: GuestbookSectionProps) {
  const [entries, setEntries] = useState<Guestbook[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchEntries = useCallback(async (offset: number, reset: boolean) => {
    setLoading(true)
    try {
      const res = await api.post('/guestbook/search', { coupleId, limit: PAGE_SIZE, offset })
      const { entries: items, total: totalCount } = res.data.data
      setEntries((prev) => (reset ? items : [...prev, ...items]))
      setTotal(totalCount)
    } catch {
      console.error('방명록 목록 조회 실패')
    } finally {
      setLoading(false)
    }
  }, [coupleId])

  useEffect(() => { fetchEntries(0, true) }, [fetchEntries])

  const handleNewEntry = (entry: Guestbook) => {
    setEntries((prev) => [entry, ...prev])
    setTotal((prev) => prev + 1)
  }

  const handleLoadMore = () => fetchEntries(entries.length, false)

  return (
    <div className={styles.container}>
      <GuestbookForm coupleId={coupleId} onSuccess={handleNewEntry} />

      {entries.length === 0 && !loading && (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>아직 남겨진 메시지가 없어요</p>
          <p className={styles.emptyDesc}>첫 번째 메시지를 남겨보세요!</p>
        </div>
      )}

      <div className={styles.list}>
        {entries.map((entry) => (
          <div key={entry.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.guestName}>{entry.guestName}</span>
              <span className={styles.date}>{format(new Date(entry.createdAt), 'yyyy.MM.dd', { locale: ko })}</span>
            </div>
            <p className={styles.message}>{entry.message}</p>
          </div>
        ))}
      </div>

      {entries.length < total && (
        <button type="button" onClick={handleLoadMore} disabled={loading} className={styles.loadMoreButton}>
          {loading ? '불러오는 중...' : '더보기'}
        </button>
      )}
    </div>
  )
}
