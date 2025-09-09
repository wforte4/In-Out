'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { 
  ExclamationTriangleIcon,
  UsersIcon,
  ClockIcon,
  CurrencyDollarIcon,
  FolderIcon
} from '@heroicons/react/24/outline'
import AuthenticatedLayout from '../../components/AuthenticatedLayout'
import SearchableSelect from '../../components/SearchableSelect'
import { useSnackbar } from '../../hooks/useSnackbar'

interface Organization {
  id: string
  name: string
  userRole: string
  isAdmin: boolean
  memberCount: number
  createdAt: string
}

interface DashboardMetrics {
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
  hourlyTrends: Array<{
    hour: number
    count: number
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

export default function AdminDashboard() {
  const { data: session } = useSession()
  const snackbar = useSnackbar()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrgId, setSelectedOrgId] = useState<string>('')
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month')

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/organization/members')
      const data = await response.json()
      if (response.ok && data.organizations) {
        const adminOrgs = data.organizations.filter((org: Organization) => org.isAdmin)
        setOrganizations(adminOrgs)
        if (adminOrgs.length === 1) {
          setSelectedOrgId(adminOrgs[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching organizations:', error)
    }
  }

  const fetchDashboardMetrics = async () => {
    if (!selectedOrgId) return

    setLoading(true)
    try {
      const response = await fetch('/api/admin/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: selectedOrgId,
          timeRange
        })
      })

      const data = await response.json()
      if (response.ok) {
        setMetrics(data)
      } else {
        snackbar.error(data.error || 'Failed to load dashboard metrics')
      }
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error)
      snackbar.error('Failed to load dashboard metrics')
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchOrganizations()
  }, [])

  useEffect(() => {
    if (selectedOrgId) {
      fetchDashboardMetrics()
    }
  }, [selectedOrgId, timeRange])

  if (!session) {
    return <AuthenticatedLayout><div>Loading...</div></AuthenticatedLayout>
  }

  if (organizations.length === 0) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
              <div className="flex items-center space-x-3">
                <ExclamationTriangleIcon className="w-5 h-5 text-amber-600" />
                <div>
                  <h3 className="text-lg font-semibold text-amber-900">Admin Access Required</h3>
                  <p className="text-amber-700">You need admin access to an organization to view the dashboard.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AuthenticatedLayout>
    )
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <motion.div 
            className="flex items-center justify-between mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
              <p className="text-slate-600 mt-2">Monitor your organization's performance and activity</p>
              {metrics?.dateRange && (
                <p className="text-slate-500 text-sm mt-1">
                  Data from {new Date(metrics.dateRange.startDate).toLocaleDateString()} to {new Date(metrics.dateRange.endDate).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {/* Time Range Selector */}
              <div className="bg-white rounded-xl border border-slate-200 p-1">
                {(['week', 'month', 'quarter'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
                      timeRange === range
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {range.charAt(0).toUpperCase() + range.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Organization Selector */}
          {organizations.length > 1 && (
            <motion.div 
              className="bg-white/70 backdrop-blur-sm shadow-lg rounded-2xl border border-slate-200/50 p-6 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Select Organization</h3>
              <SearchableSelect
                value={selectedOrgId}
                onChange={setSelectedOrgId}
                options={organizations.map(org => ({ 
                  value: org.id, 
                  label: `${org.name} (${org.memberCount} members)` 
                }))}
                placeholder="Choose an organization..."
              />
            </motion.div>
          )}

          {loading && selectedOrgId ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg animate-pulse"></div>
                <span className="text-slate-600 font-medium">Loading dashboard...</span>
              </div>
            </div>
          ) : metrics && selectedOrgId ? (
            <div className="space-y-8">
              {/* Key Metrics Cards */}
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium">Total Users</p>
                      <p className="text-3xl font-bold">{metrics.totalUsers}</p>
                      <p className="text-blue-200 text-xs mt-1">{metrics.activeUsers} active</p>
                    </div>
                    <UsersIcon className="w-10 h-10 text-blue-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm font-medium">Total Hours</p>
                      <p className="text-3xl font-bold">{metrics.totalHours.toFixed(0)}</p>
                      <p className="text-green-200 text-xs mt-1">{metrics.avgHoursPerUser.toFixed(1)} avg/user</p>
                    </div>
                    <ClockIcon className="w-10 h-10 text-green-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm font-medium">Total Revenue</p>
                      <p className="text-3xl font-bold">${metrics.totalCost.toFixed(0)}</p>
                      <p className="text-purple-200 text-xs mt-1">${(metrics.totalCost / metrics.totalHours).toFixed(0)}/hr avg</p>
                    </div>
                    <CurrencyDollarIcon className="w-10 h-10 text-purple-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm font-medium">Active Projects</p>
                      <p className="text-3xl font-bold">{metrics.activeProjects}</p>
                      <p className="text-orange-200 text-xs mt-1">of {metrics.totalProjects} total</p>
                    </div>
                    <FolderIcon className="w-10 h-10 text-orange-200" />
                  </div>
                </div>
              </motion.div>

              {/* Charts and Analytics Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Weekly Activity Chart */}
                <motion.div 
                  className="bg-white/70 backdrop-blur-sm shadow-xl rounded-2xl border border-slate-200/50 p-6"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Weekly Activity</h3>
                  <div className="space-y-3">
                    {metrics.weeklyActivity.map((day, index) => (
                      <div key={day.day} className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700 w-16">{day.day}</span>
                        <div className="flex-1 mx-4">
                          <div className="bg-slate-200 rounded-full h-2">
                            <motion.div 
                              className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min((day.hours / Math.max(...metrics.weeklyActivity.map(d => d.hours))) * 100, 100)}%` }}
                              transition={{ duration: 0.8, delay: 0.5 + index * 0.1 }}
                            />
                          </div>
                        </div>
                        <span className="text-sm text-slate-600 w-12 text-right">{day.hours.toFixed(1)}h</span>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Top Performers */}
                <motion.div 
                  className="bg-white/70 backdrop-blur-sm shadow-xl rounded-2xl border border-slate-200/50 p-6"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Top Performers</h3>
                  <div className="space-y-3">
                    {metrics.topPerformers.slice(0, 5).map((performer, index) => (
                      <div key={performer.userId} className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                          index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-600' : 'bg-slate-400'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">{performer.userName || performer.userEmail}</p>
                          <p className="text-sm text-slate-600">{performer.hours.toFixed(1)}h • ${performer.cost.toFixed(0)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Project Stats & Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Project Performance */}
                <motion.div 
                  className="lg:col-span-2 bg-white/70 backdrop-blur-sm shadow-xl rounded-2xl border border-slate-200/50 p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Project Performance</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-2 font-medium text-slate-900">Project</th>
                          <th className="text-right py-2 font-medium text-slate-900">Hours</th>
                          <th className="text-right py-2 font-medium text-slate-900">Revenue</th>
                          <th className="text-right py-2 font-medium text-slate-900">Team</th>
                          <th className="text-right py-2 font-medium text-slate-900">Progress</th>
                        </tr>
                      </thead>
                      <tbody>
                        {metrics.projectStats.slice(0, 8).map((project) => (
                          <tr key={project.projectId} className="border-b border-slate-100">
                            <td className="py-2 text-slate-800 font-medium">{project.projectName}</td>
                            <td className="text-right py-2 text-slate-800">{project.hours.toFixed(1)}</td>
                            <td className="text-right py-2 text-slate-800 font-semibold">${project.cost.toFixed(0)}</td>
                            <td className="text-right py-2 text-slate-800">{project.contributors}</td>
                            <td className="text-right py-2">
                              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                project.completion >= 100 ? 'bg-green-100 text-green-800' :
                                project.completion >= 75 ? 'bg-blue-100 text-blue-800' :
                                project.completion >= 50 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-slate-100 text-slate-800'
                              }`}>
                                {project.completion.toFixed(0)}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>

                {/* Recent Activity */}
                <motion.div 
                  className="bg-white/70 backdrop-blur-sm shadow-xl rounded-2xl border border-slate-200/50 p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    {metrics.recentActivity.slice(0, 8).map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          activity.type === 'time_entry' ? 'bg-green-500' :
                          activity.type === 'project_created' ? 'bg-blue-500' :
                          activity.type === 'user_joined' ? 'bg-purple-500' :
                          'bg-orange-500'
                        }`} />
                        <div className="flex-1">
                          <p className="text-sm text-slate-800">{activity.description}</p>
                          <p className="text-xs text-slate-500">{new Date(activity.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          ) : selectedOrgId ? (
            <div className="text-center py-12">
              <p className="text-slate-500">No data available for the selected time range.</p>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-500">Please select an organization to view the dashboard.</p>
            </div>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  )
}