// import { AppTitle } from './app-title'
// import { AppTitle } from './app-title'
import { NavUser } from '@/shared/ui-kit/nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/shared/ui/sidebar'
import { sidebarData } from '@/widgets/sidebar'
import { useLayout } from '@/features/layout-config'
import { NavGroup } from '../nav-group'
import { TeamSwitcher } from '../team-switcher'

export function AppSidebar() {
  const { collapsible, variant } = useLayout(['collapsible', 'variant'])
  return (
    <Sidebar collapsible={collapsible} variant={variant}>
      <SidebarHeader>
        <TeamSwitcher teams={sidebarData.teams} />

        {/* Replace <TeamSwitch /> with the following <AppTitle />
         /* if you want to use the normal app title instead of TeamSwitch dropdown */}
        {/* <AppTitle /> */}
      </SidebarHeader>
      <SidebarContent>
        {sidebarData.navGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={sidebarData.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
