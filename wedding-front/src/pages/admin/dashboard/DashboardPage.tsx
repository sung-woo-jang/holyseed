import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, TOKEN_KEY } from '@/shared/api'
import type { Couple, MediaStats, AttendanceStats } from '@/shared/types'
import styles from './DashboardPage.module.css'

export default function AdminDashboardPage() {
  const [couple, setCouple] = useState<Couple | null>(null)
  const [mediaStats, setMediaStats] = useState<MediaStats>({ total: 0, pending: 0, approved: 0, rejected: 0 })
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats>({ total: 0, attending: 0, notAttending: 0, maybe: 0, totalGuests: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) return

    api.post('/auth/me')
      .then(async (meRes) => {
        const user = meRes.data.data
        setCouple(user.couple)
        const coupleId = user.coupleId

        const [mediaRes, attendanceRes] = await Promise.all([
          api.post('/media/search', { coupleId, limit: 1, offset: 0 }),
          api.post('/attendance/search', { coupleId, limit: 1, offset: 0 }),
        ])
        setMediaStats(mediaRes.data.data?.stats ?? { total: 0, pending: 0, approved: 0, rejected: 0 })
        setAttendanceStats(attendanceRes.data.data?.stats ?? { total: 0, attending: 0, notAttending: 0, maybe: 0, totalGuests: 0 })
      })
      .catch(() => setError('대시보드 데이터를 불러오는데 실패했습니다.'))
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) return <div style={{ padding: '2rem' }}>로딩 중...</div>
  if (error) return <div className={styles.pageContainer}>{error}</div>
  if (!couple) return <div className={styles.pageContainer}>커플 정보를 찾을 수 없습니다.</div>

  const attendTotal = attendanceStats.attending + attendanceStats.notAttending + attendanceStats.maybe
  const pct = (n: number) => (attendTotal > 0 ? Math.round((n / attendTotal) * 100) : 0)

  const statCards = [
    { dot: 'total', label: '전체 미디어', value: mediaStats.total, caption: '업로드된 전체 항목' },
    { dot: 'pending', label: '승인 대기', value: mediaStats.pending, caption: '검토가 필요해요' },
    { dot: 'approved', label: '승인됨', value: mediaStats.approved, caption: '갤러리에 공개됨' },
    { dot: 'total', label: '참석 인원', value: attendanceStats.totalGuests, caption: '총 참석 예정' },
  ]

  const bars = [
    { type: 'attending', label: '참석', count: attendanceStats.attending },
    { type: 'not-attending', label: '불참', count: attendanceStats.notAttending },
    { type: 'maybe', label: '미정', count: attendanceStats.maybe },
  ]

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>대시보드</h1>
        <p className={styles.subtitle}>{couple.groomName} & {couple.brideName}님의 결혼식 관리</p>
      </div>

      <div className={styles.statsGrid}>
        {statCards.map((s, i) => (
          <div key={i} className={styles.statCard}>
            <div className={styles.statHead}>
              <span className={styles.statDot} data-dot={s.dot} />
              <span className={styles.statLabel}>{s.label}</span>
            </div>
            <div className={styles.statValue}>{s.value}</div>
            <div className={styles.statCaption}>{s.caption}</div>
          </div>
        ))}
      </div>

      <div className={styles.split}>
        <div>
          <h2 className={styles.sectionTitle}>빠른 작업</h2>
          <div className={styles.actionsGrid}>
            <Link to="/admin/media" className={styles.actionCard}>
              <div>
                <div className={styles.actionTitle}>미디어 검수</div>
                <div className={styles.actionDesc}>{mediaStats.pending}개의 미디어가 대기 중</div>
              </div>
              <span className={styles.actionArrow}>→</span>
            </Link>
            <Link to="/admin/content-rows" className={styles.actionCard}>
              <div>
                <div className={styles.actionTitle}>콘텐츠 Row 관리</div>
                <div className={styles.actionDesc}>갤러리 섹션 구성하기</div>
              </div>
              <span className={styles.actionArrow}>→</span>
            </Link>
            <Link to="/admin/settings" className={styles.actionCard}>
              <div>
                <div className={styles.actionTitle}>청첩장 설정</div>
                <div className={styles.actionDesc}>정보 및 예식장 관리</div>
              </div>
              <span className={styles.actionArrow}>→</span>
            </Link>
          </div>
        </div>

        <div className={styles.attendanceCard}>
          <div className={styles.attendanceHead}>
            <h2 className={styles.sectionTitle}>참석 현황</h2>
            <span className={styles.attendanceTotal}>총 {attendanceStats.total}건</span>
          </div>
          <div className={styles.barList}>
            {bars.map((b) => (
              <div key={b.type}>
                <div className={styles.barLabelRow}>
                  <span className={styles.barLabel}>{b.label}</span>
                  <span className={styles.barMeta}>{b.count}명 · {pct(b.count)}%</span>
                </div>
                <div className={styles.barTrack}>
                  <div className={styles.barFill} data-type={b.type} style={{ width: `${pct(b.count)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
