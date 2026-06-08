import { Link, useLocation } from 'react-router-dom'

const TECH_PHONE = '010-1234-5678'

export default function Footer() {
  const location = useLocation()
  if (location.pathname.startsWith('/admin')) return null

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Link
              to="/"
              className="brand"
              style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}
            >
              <div className="brand-mark">집</div>
              <span>집수리</span>
            </Link>
            <p style={{ color: 'var(--ink-3)', fontSize: 14, lineHeight: 1.7, margin: '0 0 16px', maxWidth: 320 }}>
              주방·화장실·필름까지.
              <br />한 사람이 처음부터 끝까지 책임지는 동네 시공.
            </p>
            <div style={{ fontSize: 13, color: 'var(--ink-3)', fontWeight: 600 }}>{TECH_PHONE}</div>
          </div>
          <div>
            <h5>서비스</h5>
            <ul>
              <li>
                <Link to="/services?cat=kitchen">주방</Link>
              </li>
              <li>
                <Link to="/services?cat=bath">화장실</Link>
              </li>
              <li>
                <Link to="/services?cat=film">인테리어 필름</Link>
              </li>
            </ul>
          </div>
          <div>
            <h5>안내</h5>
            <ul>
              <li>
                <Link to="/cases">시공사례</Link>
              </li>
              {/*<li>*/}
              {/*  <Link to="/about">시공자 소개</Link>*/}
              {/*</li>*/}
              <li>
                <Link to="/bookings">예약 확인</Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 집수리 · 1인 시공자 김장인</span>
          <span>서울 전 지역 · 경기 일부 · 평일 9–19시</span>
        </div>
      </div>
    </footer>
  )
}
