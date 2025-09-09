'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import AuthenticatedLayout from '../../components/AuthenticatedLayout'
import SearchableSelect from '../../components/SearchableSelect'
import DateTimePicker from '../../components/DateTimePicker'
import Button from '../../components/Button'
import { useSnackbar } from '../../hooks/useSnackbar'

interface Organization {
  id: string
  name: string
  userRole: string
  isAdmin: boolean
}

interface ReportData {
  totalHours: number
  totalCost: number
  employeeBreakdown: Array<{
    userId: string
    userName: string
    userEmail: string
    hours: number
    cost: number
    entries: number
  }>
  projectBreakdown: Array<{
    projectId: string
    projectName: string
    hours: number
    cost: number
    entries: number
  }>
  timeEntries: Array<{
    id: string
    clockIn: string
    clockOut: string
    totalHours: number
    description: string
    user: {
      name: string | null
      email: string
    }
    project?: {
      id: string
      name: string
    } | null
    hourlyRate: number | null
    calculatedCost: number
  }>
}

type ReportType = 'payroll' | 'project-costs' | 'time-summary' | 'detailed-timesheet'
type ExportFormat = 'csv' | 'quickbooks'

export default function Reports() {
  const { data: session } = useSession()
  const snackbar = useSnackbar()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrgId, setSelectedOrgId] = useState<string>('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [reportType, setReportType] = useState<ReportType>('time-summary')
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState<ExportFormat | null>(null)

  const fetchOrganizations = useCallback(async () => {
    try {
      const response = await fetch('/api/organization/members')
      const data = await response.json()
      if (response.ok && data.organizations) {
        const adminOrgs = data.organizations.filter((org: Organization) => org.isAdmin)
        setOrganizations(adminOrgs)
        if (adminOrgs.length === 1) {
          setSelectedOrgId(adminOrgs[0].id)
          setIsAdmin(true)
        }
      }
    } catch (error) {
      console.error('Error fetching organizations:', error)
    }
  }, [])

  const generateReport = useCallback(async () => {
    if (!selectedOrgId || !startDate || !endDate) {
      snackbar.error('Please select organization and date range')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: selectedOrgId,
          reportType,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        })
      })

      const data = await response.json()
      if (response.ok) {
        setReportData(data)
        snackbar.success('Report generated successfully')
      } else {
        snackbar.error(data.error || 'Failed to generate report')
      }
    } catch (error) {
      console.error('Error generating report:', error)
      snackbar.error('Failed to generate report')
    }
    setLoading(false)
  }, [selectedOrgId, reportType, startDate, endDate, snackbar])

  const exportReport = async (format: ExportFormat) => {
    if (!reportData) return

    setExporting(format)
    try {
      const response = await fetch('/api/reports/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportData,
          format,
          reportType,
          organizationId: selectedOrgId,
          startDate: startDate?.toISOString(),
          endDate: endDate?.toISOString()
        })
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${reportType}-report-${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : 'iif'}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        snackbar.success(`Report exported as ${format.toUpperCase()}`)
      } else {
        snackbar.error('Failed to export report')
      }
    } catch (error) {
      console.error('Error exporting report:', error)
      snackbar.error('Failed to export report')
    }
    setExporting(null)
  }

  useEffect(() => {
    fetchOrganizations()
    // Set default date range (current month)
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    setStartDate(startOfMonth)
    setEndDate(endOfMonth)
  }, [fetchOrganizations])

  useEffect(() => {
    const selectedOrg = organizations.find(org => org.id === selectedOrgId)
    setIsAdmin(selectedOrg?.isAdmin || false)
  }, [selectedOrgId, organizations])

  const reportTypeOptions = [
    { value: 'time-summary', label: 'Time Summary Report' },
    { value: 'payroll', label: 'Payroll Report' },
    { value: 'project-costs', label: 'Project Cost Analysis' },
    { value: 'detailed-timesheet', label: 'Detailed Timesheet' }
  ]

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
                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <h3 className="text-lg font-semibold text-amber-900">Admin Access Required</h3>
                  <p className="text-amber-700">You need admin access to an organization to view reports.</p>
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
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Reports & Analytics</h1>
              <p className="text-slate-600 mt-2">Generate detailed reports for payroll, projects, and time tracking</p>
            </div>
          </div>

          {/* Report Configuration */}
          <div className="bg-white/70 backdrop-blur-sm shadow-xl rounded-2xl border border-slate-200/50 p-6 mb-8 relative z-20">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Report Configuration</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {organizations.length > 1 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Organization</label>
                  <SearchableSelect
                    value={selectedOrgId}
                    onChange={setSelectedOrgId}
                    options={organizations.map(org => ({ value: org.id, label: org.name }))}
                    placeholder="Select organization..."
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Report Type</label>
                <SearchableSelect
                  value={reportType}
                  onChange={(value) => setReportType(value as ReportType)}
                  options={reportTypeOptions}
                  placeholder="Select report type..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Start Date</label>
                <DateTimePicker
                  selected={startDate}
                  onChange={(date) => {
                    if (date) {
                      // Set to start of day to avoid selection issues
                      const startOfDay = new Date(date)
                      startOfDay.setHours(0, 0, 0, 0)
                      setStartDate(startOfDay)
                    } else {
                      setStartDate(null)
                    }
                  }}
                  showTimeSelect={false}
                  dateFormat="MM/dd/yyyy"
                  placeholderText="Select start date"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">End Date</label>
                <DateTimePicker
                  selected={endDate}
                  onChange={(date) => {
                    if (date) {
                      // Set to end of day to capture full day
                      const endOfDay = new Date(date)
                      endOfDay.setHours(23, 59, 59, 999)
                      setEndDate(endOfDay)
                    } else {
                      setEndDate(null)
                    }
                  }}
                  showTimeSelect={false}
                  dateFormat="MM/dd/yyyy"
                  placeholderText="Select end date"
                  minDate={startDate || undefined}
                />
              </div>
            </div>

            <Button
              onClick={generateReport}
              loading={loading}
              disabled={!selectedOrgId || !startDate || !endDate}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
            >
              Generate Report
            </Button>
          </div>

          {/* Report Results */}
          {reportData && (
            <div className="bg-white/70 backdrop-blur-sm shadow-xl rounded-2xl border border-slate-200/50 p-6 relative z-10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-900">Report Results</h3>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => exportReport('csv')}
                    loading={exporting === 'csv'}
                    variant="secondary"
                    size="sm"
                    icon={
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    }
                  >
                    Export CSV
                  </Button>
                  <Button
                    onClick={() => exportReport('quickbooks')}
                    loading={exporting === 'quickbooks'}
                    variant="success"
                    size="sm"
                    icon={
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    }
                  >
                    Export to QuickBooks
                  </Button>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">Total Hours</p>
                      <p className="text-2xl font-bold">{reportData.totalHours.toFixed(1)}</p>
                    </div>
                    <svg className="w-8 h-8 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm">Total Cost</p>
                      <p className="text-2xl font-bold">${reportData.totalCost.toFixed(2)}</p>
                    </div>
                    <svg className="w-8 h-8 text-green-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm">Avg Rate/Hour</p>
                      <p className="text-2xl font-bold">${reportData.totalHours > 0 ? (reportData.totalCost / reportData.totalHours).toFixed(2) : '0.00'}</p>
                    </div>
                    <svg className="w-8 h-8 text-purple-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Report Type Specific Content */}
              {reportType === 'payroll' && (
                <div className="mb-6">
                  <h4 className="text-md font-semibold text-slate-900 mb-3">Payroll Summary</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-2 font-medium text-slate-900">Employee</th>
                          <th className="text-right py-2 font-medium text-slate-900">Regular Hours</th>
                          <th className="text-right py-2 font-medium text-slate-900">Overtime Hours</th>
                          <th className="text-right py-2 font-medium text-slate-900">Total Pay</th>
                          <th className="text-right py-2 font-medium text-slate-900">Days Worked</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.employeeBreakdown.map((employee) => {
                          const regularHours = Math.min(employee.hours, 40)
                          const overtimeHours = Math.max(employee.hours - 40, 0)
                          const daysWorked = Math.ceil(employee.hours / 8)
                          return (
                            <tr key={employee.userId} className="border-b border-slate-100">
                              <td className="py-2 text-slate-800 font-medium">{employee.userName || employee.userEmail}</td>
                              <td className="text-right py-2 text-slate-800">{regularHours.toFixed(1)}</td>
                              <td className="text-right py-2 text-slate-800 text-orange-600 font-medium">{overtimeHours > 0 ? overtimeHours.toFixed(1) : '-'}</td>
                              <td className="text-right py-2 text-slate-800 font-semibold">${employee.cost.toFixed(2)}</td>
                              <td className="text-right py-2 text-slate-800">{daysWorked}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {reportType === 'project-costs' && (
                <div className="mb-6">
                  <h4 className="text-md font-semibold text-slate-900 mb-3">Project Cost Analysis</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-2 font-medium text-slate-900">Project</th>
                          <th className="text-right py-2 font-medium text-slate-900">Hours</th>
                          <th className="text-right py-2 font-medium text-slate-900">Total Cost</th>
                          <th className="text-right py-2 font-medium text-slate-900">Avg Rate</th>
                          <th className="text-right py-2 font-medium text-slate-900">Contributors</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.projectBreakdown.map((project) => {
                          const avgRate = project.hours > 0 ? project.cost / project.hours : 0
                          const contributors = reportData.timeEntries
                            .filter(entry => (entry.project?.id || 'no-project') === project.projectId)
                            .reduce((acc, entry) => {
                              if (!acc.includes(entry.user.email)) acc.push(entry.user.email)
                              return acc
                            }, [] as string[]).length
                          return (
                            <tr key={project.projectId} className="border-b border-slate-100">
                              <td className="py-2 text-slate-800 font-medium">{project.projectName}</td>
                              <td className="text-right py-2 text-slate-800">{project.hours.toFixed(1)}</td>
                              <td className="text-right py-2 text-slate-800 font-semibold">${project.cost.toFixed(2)}</td>
                              <td className="text-right py-2 text-slate-800">${avgRate.toFixed(2)}/hr</td>
                              <td className="text-right py-2 text-slate-800">{contributors}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {reportType === 'time-summary' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="text-md font-semibold text-slate-900 mb-3">Employee Summary</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="text-left py-2 font-medium text-slate-900">Employee</th>
                            <th className="text-right py-2 font-medium text-slate-900">Hours</th>
                            <th className="text-right py-2 font-medium text-slate-900">Cost</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.employeeBreakdown.slice(0, 5).map((employee) => (
                            <tr key={employee.userId} className="border-b border-slate-100">
                              <td className="py-2 text-slate-800 font-medium">{employee.userName || employee.userEmail}</td>
                              <td className="text-right py-2 text-slate-800">{employee.hours.toFixed(1)}</td>
                              <td className="text-right py-2 text-slate-800">${employee.cost.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-md font-semibold text-slate-900 mb-3">Top Projects</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="text-left py-2 font-medium text-slate-900">Project</th>
                            <th className="text-right py-2 font-medium text-slate-900">Hours</th>
                            <th className="text-right py-2 font-medium text-slate-900">Cost</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.projectBreakdown.slice(0, 5).map((project) => (
                            <tr key={project.projectId} className="border-b border-slate-100">
                              <td className="py-2 text-slate-800 font-medium">{project.projectName}</td>
                              <td className="text-right py-2 text-slate-800">{project.hours.toFixed(1)}</td>
                              <td className="text-right py-2 text-slate-800">${project.cost.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {reportType === 'detailed-timesheet' && (
                <div className="mb-6">
                  <h4 className="text-md font-semibold text-slate-900 mb-3">Detailed Time Entries</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[900px]">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-2 font-medium text-slate-900 w-20">Date</th>
                          <th className="text-left py-2 font-medium text-slate-900 w-32">Employee</th>
                          <th className="text-left py-2 font-medium text-slate-900 w-28">Project</th>
                          <th className="text-right py-2 font-medium text-slate-900 w-16">Hours</th>
                          <th className="text-right py-2 font-medium text-slate-900 w-16">Rate</th>
                          <th className="text-right py-2 font-medium text-slate-900 w-20">Cost</th>
                          <th className="text-left py-2 font-medium text-slate-900">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.timeEntries.slice(0, 50).map((entry) => (
                          <tr key={entry.id} className="border-b border-slate-100">
                            <td className="py-2 text-slate-800 whitespace-nowrap w-20">{new Date(entry.clockIn).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' })}</td>
                            <td className="py-2 text-slate-800 font-medium w-32">
                              <div className="truncate" title={entry.user.name || entry.user.email}>
                                {(entry.user.name || entry.user.email).split(' ')[0]}
                              </div>
                            </td>
                            <td className="py-2 text-slate-800 w-28">
                              <div className="truncate" title={entry.project?.name || 'No Project'}>
                                {entry.project?.name || 'No Project'}
                              </div>
                            </td>
                            <td className="text-right py-2 text-slate-800 whitespace-nowrap w-16">{entry.totalHours?.toFixed(1)}</td>
                            <td className="text-right py-2 text-slate-800 whitespace-nowrap w-16">${entry.hourlyRate?.toFixed(0)}</td>
                            <td className="text-right py-2 text-slate-800 font-semibold whitespace-nowrap w-20">${entry.calculatedCost.toFixed(2)}</td>
                            <td className="py-2 text-slate-600 text-xs">
                              <div className="max-w-xs truncate" title={entry.description || ''}>
                                {entry.description || '-'}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {reportData.timeEntries.length > 50 && (
                      <div className="mt-3 text-center">
                        <p className="text-sm text-slate-500">
                          Showing first 50 entries of {reportData.timeEntries.length} total. 
                          <span className="text-purple-600 font-medium"> Export for complete data.</span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  )
}