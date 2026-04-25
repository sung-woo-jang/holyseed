import { ConfigDrawer } from '@/shared/ui-kit/config-drawer'
import { ProfileDropdown } from '@/shared/ui-kit/profile-dropdown'
import { Search } from '@/shared/ui-kit/search'
import { ThemeSwitch } from '@/shared/ui-kit/theme-switch'
import { Header, Main } from '@/widgets/header'

export function Dashboard() {
  return (
    <>
      <Header>
        <div className='flex flex-1 items-center justify-between'>
          <h1 className='text-2xl font-bold tracking-tight'>대시보드</h1>
          <div className='ms-auto flex items-center space-x-4'>
            <Search />
            <ThemeSwitch />
            <ConfigDrawer />
            <ProfileDropdown />
          </div>
        </div>
      </Header>

      <Main>
        <div className='flex h-[600px] items-center justify-center'>
          <p className='text-muted-foreground'>
            새 프로젝트를 시작하려면 여기에 내용을 추가하세요.
          </p>
        </div>
      </Main>
    </>
  )
}
