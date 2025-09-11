'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  UsersIcon,
  ClockIcon,
  CurrencyDollarIcon,
  FolderIcon,
  DocumentChartBarIcon,
  EllipsisHorizontalIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'
import AuthenticatedLayout from '../../components/AuthenticatedLayout'
import SearchableSelect from '../../components/SearchableSelect'
import MetricCard from '../../components/dashboard/MetricCard'
import WeeklyActivity from '../../components/dashboard/WeeklyActivity'
import TopPerformers from '../../components/dashboard/TopPerformers'
import ProjectPerformanceTable from '../../components/dashboard/ProjectPerformanceTable'
import RecentActivity from '../../components/dashboard/RecentActivity'
import { useSnackbar } from '../../hooks/useSnackbar'
import { adminService, type DashboardMetrics, type Organization } from '../../services/adminService'

export default function AdminDashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  const snackbar = useSnackbar()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrgId, setSelectedOrgId] = useState<string>('')
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [, setHasAdminAccess] = useState(true) // Start with true to prevent flash
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month')
  const [showAdminMenu, setShowAdminMenu] = useState(false)

  const fetchOrganizations = async () => {
    try {
      const adminOrgs = await adminService.fetchOrganizations()
      setOrganizations(adminOrgs)
      setHasAdminAccess(adminOrgs.length > 0)
      if (adminOrgs.length === 1) {
        setSelectedOrgId(adminOrgs[0].id)
      } else if (adminOrgs.length === 0) {
        // No admin access, redirect silently
        router.push('/dashboard')
        return
      }
    } catch (error) {
      console.error('Error fetching organizations:', error)
      snackbar.error('Failed to load organizations')
      router.push('/dashboard')
    }
  }

  const fetchDashboardMetrics = async () => {
    if (!selectedOrgId) return

    setLoading(true)
    try {
      const dashboardMetrics = await adminService.fetchDashboardMetrics(selectedOrgId, timeRange)
      setMetrics(dashboardMetrics)
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error)
      snackbar.error('Failed to load dashboard metrics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session) {
      fetchOrganizations()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  useEffect(() => {
    fetchDashboardMetrics()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOrgId, timeRange])

  // Close admin menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (showAdminMenu && !target.closest('[data-admin-menu]')) {
        setShowAdminMenu(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showAdminMenu])

  const getDateRangeText = () => {
    const now = new Date()
    switch (timeRange) {
      case 'week':
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - now.getDay())
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
      case 'month':
        return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3) + 1
        return `Q${quarter} ${now.getFullYear()}`
      default:
        return ''
    }
  }

  if (loading && !metrics) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
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
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
                <p className="text-slate-600 mt-2">Overview and analytics for {getDateRangeText()}</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 mt-4 sm:mt-0">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => router.push('/reports')}
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <DocumentChartBarIcon className="w-4 h-4 mr-2" />
                    Advanced Reports
                  </button>
                  
                  {/* Admin Menu */}
                  <div className="relative" data-admin-menu>
                    <button
                      onClick={() => setShowAdminMenu(!showAdminMenu)}
                      className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                      title="Admin Tools"
                    >
                      <EllipsisHorizontalIcon className="w-5 h-5" />
                    </button>
                    
                    {showAdminMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
                        <button
                          onClick={() => {
                            router.push('/admin/audit-logs')
                            setShowAdminMenu(false)
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center"
                        >
                          <ShieldCheckIcon className="w-4 h-4 mr-3 text-slate-400" />
                          Audit Logs
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                {organizations.length > 1 && (
                  <SearchableSelect
                    value={selectedOrgId}
                    onChange={(value) => setSelectedOrgId(value as string)}
                    options={organizations.map(org => ({
                      value: org.id,
                      label: org.name
                    }))}
                    placeholder="Select organization..."
                    className="w-full sm:w-64"
                  />
                )}
                
                {/* Time Range Slider */}
                <div className="flex items-center space-x-1 bg-slate-100 rounded-lg p-1">
                  {(['week', 'month', 'quarter'] as const).map((range) => (
                    <button
                      key={range}
                      onClick={() => setTimeRange(range)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 ${
                        timeRange === range
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                      }`}
                    >
                      {range.charAt(0).toUpperCase() + range.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {!selectedOrgId ? (
            <div className="text-center py-12">
              <p className="text-slate-500">Please select an organization to view the dashboard.</p>
            </div>
          ) : !metrics ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              {/* Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                  title="Total Hours"
                  value={(metrics.totalHours ?? 0).toFixed(1)}
                  subtitle="hours logged"
                  gradient="from-blue-500 to-blue-600"
                  textColor="text-white"
                  icon={<ClockIcon className="w-6 h-6" />}
                />
                <MetricCard
                  title="Revenue"
                  value={`$${(metrics.totalCost ?? 0).toFixed(0)}`}
                  subtitle="this period"
                  gradient="from-green-500 to-green-600"
                  textColor="text-white"
                  icon={<CurrencyDollarIcon className="w-6 h-6" />}
                />
                <MetricCard
                  title="Active Users"
                  value={(metrics.activeUsers ?? 0).toString()}
                  subtitle="team members"
                  gradient="from-purple-500 to-purple-600"
                  textColor="text-white"
                  icon={<UsersIcon className="w-6 h-6" />}
                />
                <MetricCard
                  title="Projects"
                  value={(metrics.activeProjects ?? 0).toString()}
                  subtitle="in progress"
                  gradient="from-orange-500 to-orange-600"
                  textColor="text-white"
                  icon={<FolderIcon className="w-6 h-6" />}
                />
              </div>

              {/* Weekly Activity & Top Performers */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <WeeklyActivity data={metrics.weeklyActivity ?? []} />
                <TopPerformers performers={metrics.topPerformers ?? []} />
              </div>

              {/* Project Performance & Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ProjectPerformanceTable projects={metrics.projectStats ?? []} />
                <RecentActivity activities={metrics.recentActivity ?? []} />
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  )
}