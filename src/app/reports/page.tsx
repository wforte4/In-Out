'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  DocumentChartBarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ArrowDownTrayIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline'
import AuthenticatedLayout from '../../components/AuthenticatedLayout'
import SearchableSelect from '../../components/SearchableSelect'
import DateRangePicker, { type DateRange } from '../../components/DateRangePicker'
import EmployeeMultiSelect from '../../components/EmployeeMultiSelect'
import ProjectMultiSelect from '../../components/ProjectMultiSelect'
import Button from '../../components/Button'
import { useSnackbar } from '../../hooks/useSnackbar'
import { adminService, type Organization } from '../../services/adminService'

export default function Reports() {
  const { data: session } = useSession()
  const router = useRouter()
  const snackbar = useSnackbar()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrgId, setSelectedOrgId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [, setHasAdminAccess] = useState(true) // Start with true to prevent flash
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month')
  const [generatingReport, setGeneratingReport] = useState<string | null>(null)
  const [showCustomBuilder, setShowCustomBuilder] = useState(false)
  const [selectedReportType, setSelectedReportType] = useState('')
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [reportData, setReportData] = useState<Record<string, unknown>[]>([])
  const [showReportPreview, setShowReportPreview] = useState(false)
  const [currentReportType, setCurrentReportType] = useState('')
  const [reportFilters, setReportFilters] = useState<Record<string, unknown>>({})

  const fetchOrganizations = async () => {
    try {
      const adminOrgs = await adminService.fetchOrganizations()
      setOrganizations(adminOrgs)
      setHasAdminAccess(adminOrgs.length > 0)
      if (adminOrgs.length === 1) {
        setSelectedOrgId(adminOrgs[0].id)
      } else if (adminOrgs.length === 0) {
        // Redirect silently without showing access denied message
        router.push('/dashboard')
        return
      }
    } catch (error) {
      console.error('Error fetching organizations:', error)
      snackbar.error('Failed to load organizations')
      router.push('/dashboard')
    }
    setLoading(false)
  }

  useEffect(() => {
    if (session) {
      fetchOrganizations()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  const generateReportPreview = async (reportType: string, customFilters?: Record<string, unknown>) => {
    if (!selectedOrgId) {
      snackbar.error('Please select an organization first')
      return
    }

    setGeneratingReport(reportType)
    try {
      const filters = customFilters || {
        timeRange: timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 90
      }

      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId: reportType,
          format: 'json', // Always get JSON for preview
          organizationId: selectedOrgId,
          filters
        })
      })

      const result = await response.json()

      if (response.ok) {
        const data = JSON.parse(result.downloadUrl.split(',')[1] || '[]')
        setReportData(data)
        setCurrentReportType(reportType)
        setReportFilters(filters)
        setShowReportPreview(true)
        setShowCustomBuilder(false)
        snackbar.success(`Report generated with ${data.length} records`)
      } else {
        snackbar.error(result.error || 'Failed to generate report')
      }
    } catch (error) {
      console.error('Error generating report:', error)
      snackbar.error('Failed to generate report')
    } finally {
      setGeneratingReport(null)
    }
  }

  const downloadReport = async (format: string) => {
    if (!selectedOrgId || !currentReportType) {
      snackbar.error('No report data available')
      return
    }

    setGeneratingReport(currentReportType)
    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId: currentReportType,
          format,
          organizationId: selectedOrgId,
          filters: reportFilters
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Trigger download
        const link = document.createElement('a')
        link.href = data.downloadUrl
        link.download = data.fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        snackbar.success(`${format.toUpperCase()} report downloaded!`)
      } else {
        snackbar.error(data.error || 'Failed to download report')
      }
    } catch (error) {
      console.error('Error downloading report:', error)
      snackbar.error('Failed to download report')
    } finally {
      setGeneratingReport(null)
    }
  }

  const generateCustomReport = () => {
    const customFilters = {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      employeeIds: selectedEmployees.length > 0 ? selectedEmployees : undefined,
      projectIds: selectedProjects.length > 0 ? selectedProjects : undefined
    }
    generateReportPreview(selectedReportType, customFilters)
  }

  const getReportTitle = (reportType: string) => {
    const titles = {
      'time-tracking-summary': 'Time Tracking Summary',
      'project-profitability': 'Project Profitability',
      'team-utilization': 'Team Utilization',
      'cost-breakdown': 'Cost Breakdown'
    }
    return titles[reportType as keyof typeof titles] || 'Report'
  }

  const renderReportTable = () => {
    if (reportData.length === 0) {
      return (
        <div className="text-center py-8 text-slate-500">
          No data available for the selected criteria
        </div>
      )
    }

    const headers = Object.keys(reportData[0])
    
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {headers.map((header) => (
                <th
                  key={header}
                  className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                >
                  {header.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {reportData.slice(0, 100).map((row, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                {headers.map((header) => (
                  <td key={header} className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    {typeof row[header] === 'object' ? JSON.stringify(row[header]) : String(row[header] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {reportData.length > 100 && (
          <div className="px-6 py-4 text-sm text-slate-500 bg-slate-50">
            Showing first 100 of {reportData.length} records. Download to see all data.
          </div>
        )}
      </div>
    )
  }

  const openCustomBuilder = (reportType: string) => {
    setSelectedReportType(reportType)
    setSelectedEmployees([])
    setSelectedProjects([])
    setShowCustomBuilder(true)
  }

  if (loading) {
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
      <div className="max-w-6xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Reports</h1>
                <p className="text-slate-600 mt-2">Generate and export custom reports</p>
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
                
                {!showCustomBuilder && (
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
                )}
              </div>
            </div>
          </div>

          {!selectedOrgId ? (
            <div className="text-center py-12">
              <p className="text-slate-500">Please select an organization to view reports.</p>
            </div>
          ) : showCustomBuilder ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white/70 backdrop-blur-sm shadow-xl rounded-2xl border border-slate-200/50 p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white mr-4">
                    <AdjustmentsHorizontalIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Custom Report Builder</h3>
                    <p className="text-sm text-slate-600">Configure your report parameters</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCustomBuilder(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Date Range
                    </label>
                    <DateRangePicker
                      value={dateRange}
                      onChange={setDateRange}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Projects
                    </label>
                    <ProjectMultiSelect
                      value={selectedProjects}
                      onChange={setSelectedProjects}
                      organizationId={selectedOrgId}
                      className="w-full"
                      placeholder="All projects (leave empty for all)"
                    />
                  </div>
                </div>

                {(selectedReportType === 'time-tracking-summary' || selectedReportType === 'team-utilization') && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Employees
                    </label>
                    <EmployeeMultiSelect
                      value={selectedEmployees}
                      onChange={setSelectedEmployees}
                      organizationId={selectedOrgId}
                      className="w-full"
                      placeholder="All employees (leave empty for all)"
                    />
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                  <Button
                    onClick={() => setShowCustomBuilder(false)}
                    variant="secondary"
                    size="sm"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={generateCustomReport}
                    variant="primary"
                    size="sm"
                    loading={generatingReport === selectedReportType}
                    disabled={!dateRange.startDate || !dateRange.endDate}
                    icon={<ArrowDownTrayIcon className="w-4 h-4" />}
                  >
                    Generate Report
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : showReportPreview ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white/70 backdrop-blur-sm shadow-xl rounded-2xl border border-slate-200/50 p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white mr-4">
                    <DocumentChartBarIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{getReportTitle(currentReportType)}</h3>
                    <p className="text-sm text-slate-600">{reportData.length} records found</p>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <Button
                    onClick={() => downloadReport('csv')}
                    variant="secondary"
                    size="sm"
                    loading={generatingReport === currentReportType}
                    icon={<ArrowDownTrayIcon className="w-4 h-4" />}
                  >
                    Download CSV
                  </Button>
                  <Button
                    onClick={() => setShowReportPreview(false)}
                    variant="primary"
                    size="sm"
                  >
                    Back to Reports
                  </Button>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                {renderReportTable()}
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              {/* Time Tracking Report */}
              <div className="bg-white/70 backdrop-blur-sm shadow-xl rounded-2xl border border-slate-200/50 p-6">
                <div className="flex items-center mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white mr-4">
                    <ClockIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Time Tracking</h3>
                    <p className="text-sm text-slate-600">Hours logged by team and projects</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => generateReportPreview('time-tracking-summary')}
                    variant="secondary"
                    size="sm"
                    disabled={generatingReport === 'time-tracking-summary'}
                    loading={generatingReport === 'time-tracking-summary'}
                    icon={<ArrowDownTrayIcon className="w-4 h-4" />}
                  >
                    Generate Report
                  </Button>
                  <Button
                    onClick={() => openCustomBuilder('time-tracking-summary')}
                    variant="primary"
                    size="sm"
                    icon={<AdjustmentsHorizontalIcon className="w-4 h-4" />}
                  >
                    Custom
                  </Button>
                </div>
              </div>

              {/* Project Profitability Report */}
              <div className="bg-white/70 backdrop-blur-sm shadow-xl rounded-2xl border border-slate-200/50 p-6">
                <div className="flex items-center mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white mr-4">
                    <CurrencyDollarIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Project Profitability</h3>
                    <p className="text-sm text-slate-600">Revenue vs costs with ROI analysis</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => generateReportPreview('project-profitability')}
                    variant="secondary"
                    size="sm"
                    disabled={generatingReport === 'project-profitability'}
                    loading={generatingReport === 'project-profitability'}
                    icon={<ArrowDownTrayIcon className="w-4 h-4" />}
                  >
                    Generate Report
                  </Button>
                  <Button
                    onClick={() => openCustomBuilder('project-profitability')}
                    variant="primary"
                    size="sm"
                    icon={<AdjustmentsHorizontalIcon className="w-4 h-4" />}
                  >
                    Custom
                  </Button>
                </div>
              </div>

              {/* Team Utilization Report */}
              <div className="bg-white/70 backdrop-blur-sm shadow-xl rounded-2xl border border-slate-200/50 p-6">
                <div className="flex items-center mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white mr-4">
                    <UserGroupIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Team Utilization</h3>
                    <p className="text-sm text-slate-600">Time allocation across projects</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => generateReportPreview('team-utilization')}
                    variant="secondary"
                    size="sm"
                    disabled={generatingReport === 'team-utilization'}
                    loading={generatingReport === 'team-utilization'}
                    icon={<ArrowDownTrayIcon className="w-4 h-4" />}
                  >
                    Generate Report
                  </Button>
                  <Button
                    onClick={() => openCustomBuilder('team-utilization')}
                    variant="primary"
                    size="sm"
                    icon={<AdjustmentsHorizontalIcon className="w-4 h-4" />}
                  >
                    Custom
                  </Button>
                </div>
              </div>

              {/* Cost Breakdown Report */}
              <div className="bg-white/70 backdrop-blur-sm shadow-xl rounded-2xl border border-slate-200/50 p-6">
                <div className="flex items-center mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white mr-4">
                    <DocumentChartBarIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Cost Breakdown</h3>
                    <p className="text-sm text-slate-600">Detailed project expenses</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => generateReportPreview('cost-breakdown')}
                    variant="secondary"
                    size="sm"
                    disabled={generatingReport === 'cost-breakdown'}
                    loading={generatingReport === 'cost-breakdown'}
                    icon={<ArrowDownTrayIcon className="w-4 h-4" />}
                  >
                    Generate Report
                  </Button>
                  <Button
                    onClick={() => openCustomBuilder('cost-breakdown')}
                    variant="primary"
                    size="sm"
                    icon={<AdjustmentsHorizontalIcon className="w-4 h-4" />}
                  >
                    Custom
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  )
}