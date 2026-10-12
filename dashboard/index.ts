import {dashboardTool} from '@sanity/dashboard'
import {DashboardIcon} from '@sanity/icons/Dashboard'
import {OverviewDashboard} from './OverviewDashboard'

export const overviewDashboard = dashboardTool({
  name: 'dashboard',
  title: 'Overview',
  icon: DashboardIcon,
  widgets: [{name: 'content-overview', component: OverviewDashboard, layout: {width: 'full'}}],
})
