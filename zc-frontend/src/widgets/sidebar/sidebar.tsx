import { NavLink } from 'react-router-dom';
import { cn } from '@/shared/lib/utils';
import { useFetchSites } from '@/features/sites/api/fetch-sites';

interface NavSection {
  title: string;
  items: NavItem[];
}

interface NavItem {
  to: string;
  label: string;
}

const staticSections: NavSection[] = [
  {
    title: '제품 관리',
    items: [
      { to: '/products', label: '전체 제품' },
      { to: '/models', label: '제품 모델' },
      { to: '/matching', label: '제품 매칭' },
    ],
  },
  {
    title: '견적 관리',
    items: [
      { to: '/quotes', label: '견적서' },
    ],
  },
  {
    title: '설정',
    items: [
      { to: '/categories', label: '카테고리' },
      { to: '/brands', label: '브랜드' },
    ],
  },
];

export function Sidebar() {
  const { data: sites, isLoading } = useFetchSites();

  const activeSites = sites?.filter((site) => site.isActive) || [];

  return (
    <aside className="w-64 border-r bg-white min-h-[calc(100vh-64px)] overflow-y-auto">
      <nav className="p-4">
        {/* 대시보드 */}
        <div className="mb-6">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              cn(
                'block px-4 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-white'
                  : 'text-gray-700 hover:bg-accent hover:text-gray-900'
              )
            }
          >
            📊 대시보드
          </NavLink>
        </div>

        {/* 사이트별 탐색 */}
        <div className="mb-6">
          <h3 className="px-4 mb-2 text-xs font-semibold text-gray-500 uppercase">
            사이트별 탐색
          </h3>
          <ul className="space-y-1">
            {isLoading ? (
              <li className="px-4 py-2 text-sm text-gray-500">로딩 중...</li>
            ) : activeSites.length === 0 ? (
              <li className="px-4 py-2 text-sm text-gray-500">사이트 없음</li>
            ) : (
              activeSites.map((site) => (
                <li key={site.id}>
                  <NavLink
                    to={`/sites/${site.code}/products`}
                    className={({ isActive }) =>
                      cn(
                        'block px-4 py-2 rounded-md text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary text-white'
                          : 'text-gray-700 hover:bg-accent hover:text-gray-900'
                      )
                    }
                  >
                    📦 {site.name}
                  </NavLink>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* 정적 섹션들 */}
        {staticSections.map((section) => (
          <div key={section.title} className="mb-6">
            <h3 className="px-4 mb-2 text-xs font-semibold text-gray-500 uppercase">
              {section.title}
            </h3>
            <ul className="space-y-1">
              {section.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      cn(
                        'block px-4 py-2 rounded-md text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary text-white'
                          : 'text-gray-700 hover:bg-accent hover:text-gray-900'
                      )
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
