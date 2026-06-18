import { useEffect, useState, useCallback } from 'react'
import { api, TOKEN_KEY } from '@/lib/api'
import { AttendanceStats } from '@/components/admin/attendance/AttendanceStats'
import { AttendanceFilters } from '@/components/admin/attendance/AttendanceFilters'
import { AttendanceTable } from '@/components/admin/attendance/AttendanceTable'
import type { Attendance, AttendanceStats as IAttendanceStats } from '@/types'
import styles from './admin-page.module.css'

type AttendanceFilter = 'all' | 'ATTENDING' | 'NOT_ATTENDING' | 'MAYBE'

export default function AdminAttendancePage() {
  const [coupleId, setCoupleId] = useState<string | null>(null)
  const [attendances, setAttendances] = useState<Attendance[]>([])
  const [stats, setStats] = useState<IAttendanceStats>({ total: 0, attending: 0, notAttending: 0, maybe: 0, totalGuests: 0 })
  const [filter, setFilter] = useState<AttendanceFilter>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) return
    api.post('/auth/me')
      .then((res) => setCoupleId(res.data.data?.coupleId ?? null))
      .catch(() => setError('세션을 불러오는데 실패했습니다.'))
  }, [])

  const fetchAttendances = useCallback(async () => {
    if (!coupleId) return
    setLoading(true); setError('')
    try {
      const body: any = { coupleId }
      if (filter !== 'all') body.attendanceStatus = filter
      const res = await api.post('/attendance/search', body)
      setAttendances(res.data.data?.attendances ?? [])
      setStats(res.data.data?.stats ?? { total: 0, attending: 0, notAttending: 0, maybe: 0, totalGuests: 0 })
    } catch {
      setError('참석 응답 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }, [coupleId, filter])

  useEffect(() => { fetchAttendances() }, [fetchAttendances])

  const handleDelete = async (id: string) => {
    try {
      await api.post(`/attendance/${id}/delete`)
      fetchAttendances()
    } catch {
      alert('참석 응답 삭제에 실패했습니다.')
    }
  }

  if (!coupleId && !error) return <div className={styles.loading}>정보를 불러오는 중...</div>

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>참석 응답 관리</h1>
        <p className={styles.description}>하객들의 참석 여부를 확인하고 관리하세요.</p>
      </div>

      {error && <div className={styles.errorContainer}><p className={styles.errorMessage}>{error}</p></div>}

      <AttendanceStats stats={stats} />
      <AttendanceFilters currentFilter={filter} onFilterChange={setFilter} counts={{ total: stats.total, attending: stats.attending, notAttending: stats.notAttending, maybe: stats.maybe }} />
      <AttendanceTable attendances={attendances} onDelete={handleDelete} loading={loading} />
    </div>
  )
}
