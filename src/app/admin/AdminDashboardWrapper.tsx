'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import {
  UsersIcon,
  ClockIcon,
  CurrencyDollarIcon,
  FolderIcon
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

interface AdminDashboardWrapperProps {
  initialOrganizations: Organization[]
}

export default function AdminDashboardWrapper({ initialOrganizations }: AdminDashboardWrapperProps) {
  const { data: session } = useSession()
  const snackbar = useSnackbar()
  const [organizations] = useState<Organization[]>(initialOrganizations)
  const [selectedOrgId, setSelectedOrgId] = useState<string>(
    initialOrganizations.length === 1 ? initialOrganizations[0].id : ''
  )
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month')

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
    fetchDashboardMetrics()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOrgId, timeRange])

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
                <SearchableSelect
                  value={timeRange}
                  onChange={(value) => setTimeRange(value as typeof timeRange)}
                  options={[
                    { value: 'week', label: 'This Week' },
                    { value: 'month', label: 'This Month' },
                    { value: 'quarter', label: 'This Quarter' }
                  ]}
                  placeholder="Select time range..."
                  className="w-full sm:w-48"
                />
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