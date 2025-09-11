export interface DashboardMetrics {
  totalUsers: number
  activeUsers: number
  totalProjects: number
  activeProjects: number
  totalHours: number
  totalCost: number
  avgHoursPerUser: number
  topPerformers: Array<{
    userId: string
    userName: string
    userEmail: string
    hours: number
    cost: number
  }>
  recentActivity: Array<{
    id: string
    type: 'time_entry' | 'project_created' | 'user_joined' | 'admin_action'
    description: string
    user: {
      name: string | null
      email: string
    }
    timestamp: string
  }>
  projectStats: Array<{
    projectId: string
    projectName: string
    hours: number
    cost: number
    contributors: number
    completion: number
  }>
  weeklyActivity: Array<{
    day: string
    hours: number
    entries: number
  }>
  dateRange: {
    startDate: string
    endDate: string
    timeRange: string
  }
}

export interface Organization {
  id: string
  name: string
  userRole: string
  isAdmin: boolean
  memberCount: number
  createdAt: string
}

export const adminService = {
  async fetchOrganizations(): Promise<Organization[]> {
    const response = await fetch('/api/organization/members')
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch organizations')
    }
    return data.organizations?.filter((org: Organization) => org.isAdmin) || []
  },

  async fetchDashboardMetrics(organizationId: string, timeRange: 'week' | 'month' | 'quarter'): Promise<DashboardMetrics> {
    const response = await fetch('/api/admin/dashboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organizationId,
        timeRange
      })
    })

    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch dashboard metrics')
    }
    return data
  }
}