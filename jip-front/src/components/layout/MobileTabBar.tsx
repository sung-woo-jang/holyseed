import { useLocation, useNavigate } from 'react-router-dom'
import { useCartStore } from '@/stores/cart'

const IconHome = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 10.5L12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" />
  </svg>
)
const IconServices = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
)
const IconCases = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <circle cx="8.5" cy="11" r="1.5" /><path d="M3 17l5-5 4 4 3-3 6 6" />
  </svg>
)
const IconCart = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h2l2.5 11h11L21 9H7" />
    <circle cx="9" cy="20" r="1.4" /><circle cx="17" cy="20" r="1.4" />
  </svg>
)
const IconBookings = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4" />
  </svg>
)

export default function MobileTabBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const cartCount = useCartStore((s) => s.items.length)
  const top = location.pathname.split('/')[1] || 'home'

  if (location.pathname.startsWith('/admin')) return null

  const isOn = (...keys: string[]) => keys.includes(top)

  const tabs = [
    { k: 'home', label: '홈', Icon: IconHome, on: isOn('', 'home'), go: '/' },
    { k: 'services', label: '서비스', Icon: IconServices, on: isOn('services', 'service', 'product'), go: '/services' },
    { k: 'cases', label: '사례', Icon: IconCases, on: isOn('cases', 'case'), go: '/cases' },
    { k: 'cart', label: '견적함', Icon: IconCart, on: isOn('cart', 'request', 'request-done'), go: '/cart', badge: cartCount > 0 ? cartCount : null },
    { k: 'bookings', label: '예약', Icon: IconBookings, on: isOn('bookings', 'booking'), go: '/bookings' },
  ]

  return (
    <nav className="tabbar">
      <div className="tabbar-inner">
        {tabs.map((t) => (
          <button key={t.k} className={`tab-item${t.on ? ' on' : ''}`} onClick={() => navigate(t.go)}>
            <t.Icon />
            <span>{t.label}</span>
            {t.badge && <span className="badge">{t.badge}</span>}
          </button>
        ))}
      </div>
    </nav>
  )
}
