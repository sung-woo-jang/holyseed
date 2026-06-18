import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, TOKEN_KEY } from '@/shared/api'
import type { Couple, MediaStats, AttendanceStats } from '@/shared/types'
import styles from './dashboardPage.module.css'

export default function AdminDashboardPage() {
  const [couple, setCouple] = useState<Couple | null>(null)
  const [mediaStats, setMediaStats] = useState<MediaStats>({ total: 0, pending: 0, approved: 0, rejected: 0 })
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats>({ total: 0, attending: 0, notAttending: 0, maybe: 0, totalGuests: 0 })
  const [isLoading, setIsLoading] = useState(true)

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
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) return <div style={{ padding: '2rem' }}>로딩 중...</div>
  if (!couple) return <div className={styles.pageContainer}>커플 정보를 찾을 수 없습니다.</div>

  const attendTotal = attendanceStats.attending + attendanceStats.notAttending + attendanceStats.maybe
  const pct = (n: number) => (attendTotal > 0 ? Math.round((n / attendTotal) * 100) : 0)

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>대시보드</h1>
        <p className={styles.subtitle}>{couple.groomName} & {couple.brideName}님의 결혼식 관리</p>
      </div>

      <section className={styles.section}>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}><dt className={styles.statLabel}>전체 미디어</dt><dd className={styles.statValue}>{mediaStats.total}</dd></div>
          <div className={styles.statCard} data-stat-type="pending"><dt className={styles.statLabel}>승인 대기</dt><dd className={styles.statValue}>{mediaStats.pending}</dd></div>
          <div className={styles.statCard} data-stat-type="approved"><dt className={styles.statLabel}>승인됨</dt><dd className={styles.statValue}>{mediaStats.approved}</dd></div>
          <div className={styles.statCard} data-stat-type="attention"><dt className={styles.statLabel}>참석 인원</dt><dd className={styles.statValue}>{attendanceStats.totalGuests}</dd></div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>빠른 작업</h2>
        <div className={styles.actionsGrid}>
          <Link to="/admin/media" className={styles.actionCard}><p className={styles.actionTitle}>미디어 검수</p><p className={styles.actionDesc}>{mediaStats.pending}개의 미디어가 대기 중</p></Link>
          <Link to="/admin/content-rows" className={styles.actionCard}><p className={styles.actionTitle}>콘텐츠 Row 관리</p><p className={styles.actionDesc}>갤러리 섹션 구성하기</p></Link>
          <Link to="/admin/settings" className={styles.actionCard}><p className={styles.actionTitle}>청첩장 설정</p><p className={styles.actionDesc}>정보 및 테마 관리</p></Link>
          {couple.slug && <a href={`/${couple.slug}`} target="_blank" rel="noreferrer" className={styles.actionCard}><p className={styles.actionTitle}>청첩장 보기</p><p className={styles.actionDesc}>하객용 페이지 확인</p></a>}
        </div>
      </section>

      <section className={styles.attendanceSection}>
        <h2 className={styles.sectionTitle}>참석 현황</h2>
        <div className={styles.barChartContainer}>
          <div className={styles.barChart}>
            {[
              { type: 'attending', label: '참석', count: attendanceStats.attending, delay: '0s' },
              { type: 'not-attending', label: '불참', count: attendanceStats.notAttending, delay: '0.2s' },
              { type: 'maybe', label: '미정', count: attendanceStats.maybe, delay: '0.4s' },
            ].map(({ type, label, count, delay }) => (
              <div key={type} className={styles.barSegment} data-type={type} style={{ animationDelay: delay }}>
                <span className={styles.barLabel}><span>{label}</span><span>{count}명</span></span>
                <span className={styles.barPercent}>{pct(count)}%</span>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.legend}>
          {[
            { type: 'attending', label: `참석 (${pct(attendanceStats.attending)}%)` },
            { type: 'not-attending', label: `불참 (${pct(attendanceStats.notAttending)}%)` },
            { type: 'maybe', label: `미정 (${pct(attendanceStats.maybe)}%)` },
          ].map(({ type, label }) => (
            <div key={type} className={styles.legendItem}>
              <div className={styles.legendColor} data-type={type} />
              <span className={styles.legendLabel}>{label}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
