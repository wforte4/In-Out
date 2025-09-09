'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import AuthenticatedLayout from '../../components/AuthenticatedLayout'
import Button from '../../components/Button'
import IconButton from '../../components/IconButton'
import CalendarDay from '../../components/CalendarDay'
import TimeEntryCard from '../../components/TimeEntryCard'
import CreateTimeEntryModal from '../../components/modals/CreateTimeEntryModal'
import EditTimeEntryModal from '../../components/modals/EditTimeEntryModal'
import { useModal } from '../../hooks/useModal'

interface TimeEntry {
  id: string
  clockIn: string
  clockOut: string | null
  totalHours: number | null
  description: string | null
  organizationId: string | null
  editedBy: string | null
  editedAt: string | null
  user: {
    name: string | null
    email: string
  }
  project?: {
    id: string
    name: string
  } | null
  organization?: {
    id: string
    name: string
  } | null
  editor?: {
    name: string | null
    email: string
  } | null
}

interface Shift {
  id: string
  title: string
  description: string | null
  startTime: string
  endTime: string
  isRecurring: boolean
  recurringPattern: string | null
  assignedUser?: {
    id: string
    name: string | null
    email: string
  } | null
  project?: {
    id: string
    name: string
  } | null
  schedule: {
    id: string
    name: string
  }
}

interface Organization {
  id: string
  name: string
  code: string
  userRole: string
  isAdmin: boolean
  memberships: Array<{
    id: string
    role: string
    user: {
      id: string
      name: string | null
      email: string
    }
  }>
}

interface Project {
  id: string
  name: string
  description?: string | null
  organizationId: string
  totalHours?: number
}

type ViewMode = 'day' | 'week' | 'month'

interface CalendarDay {
  date: Date
  entries: TimeEntry[]
  shifts: Shift[]
  totalHours: number
  isToday: boolean
  isCurrentMonth: boolean
}

function TimesheetContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [shifts, setShifts] = useState<Shift[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedOrgId, setSelectedOrgId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [viewingUser, setViewingUser] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const modal = useModal()

  const userId = searchParams.get('userId')

  const fetchOrganizations = useCallback(async () => {
    try {
      const response = await fetch('/api/organization/members')
      const data = await response.json()
      if (response.ok) {
        const allOrgs = data.organizations || []
        setOrganizations(allOrgs)
        if (allOrgs.length > 0 && !selectedOrgId) {
          setSelectedOrgId(allOrgs[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching organizations:', error)
    }
  }, [selectedOrgId])

  const fetchProjects = useCallback(async () => {
    if (!selectedOrgId) return
    try {
      const response = await fetch(`/api/projects?organizationId=${selectedOrgId}`)
      const data = await response.json()
      if (response.ok) {
        setProjects(data.projects || [])
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    }
  }, [selectedOrgId])

  const fetchTimeEntries = useCallback(async () => {
    try {
      const url = userId ? `/api/time/entries?userId=${userId}` : '/api/time/entries'
      const response = await fetch(url)
      const data = await response.json()

      if (response.ok) {
        setTimeEntries(data.timeEntries || [])
        if (userId && data.timeEntries?.[0]?.user) {
          setViewingUser(data.timeEntries[0].user.name || data.timeEntries[0].user.email)
        }
      } else {
        console.error('Error:', data.error)
        if (data.error === 'Forbidden') {
          router.push('/timesheet')
        }
      }
    } catch (error) {
      console.error('Error fetching time entries:', error)
    }
  }, [userId, router])

  const fetchShifts = useCallback(async () => {
    if (!selectedOrgId) return
    try {
      const url = userId
        ? `/api/shifts?organizationId=${selectedOrgId}&userId=${userId}`
        : `/api/shifts?organizationId=${selectedOrgId}`
      const response = await fetch(url)
      const data = await response.json()

      if (response.ok) {
        setShifts(data.shifts || [])
      } else {
        console.error('Error fetching shifts:', data.error)
      }
    } catch (error) {
      console.error('Error fetching shifts:', error)
    }
  }, [selectedOrgId, userId])

  const fetchAllData = useCallback(async () => {
    setLoading(true)
    await Promise.all([
      fetchTimeEntries(),
      fetchShifts(),
      fetchProjects()
    ])
    setLoading(false)
  }, [fetchTimeEntries, fetchShifts, fetchProjects])

  useEffect(() => {
    fetchOrganizations()
  }, [fetchOrganizations])

  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])


  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const calculateHours = (clockIn: string, clockOut: string | null): number => {
    if (!clockOut) return 0
    const start = new Date(clockIn)
    const end = new Date(clockOut)
    return Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60))
  }

  const getHoursForPeriod = (period: 'today' | 'week' | 'month') => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    let startDate: Date
    let endDate: Date

    if (period === 'today') {
      startDate = today
      endDate = today
    } else if (period === 'week') {
      // Get the start of the current week (Sunday)
      const dayOfWeek = now.getDay() // 0 = Sunday, 1 = Monday, etc.
      startDate = new Date(today)
      startDate.setDate(today.getDate() - dayOfWeek) // Go back to Sunday

      // End of week (Saturday)
      endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 6)
    } else {
      startDate = new Date(today.getFullYear(), today.getMonth(), 1) // Start of current month
      endDate = today
    }

    return timeEntries.filter(entry => {
      const entryDate = new Date(entry.clockIn)
      const entryDay = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate())
      return entryDay >= startDate && entryDay <= endDate
    }).reduce((total, entry) => {
      return total + (entry.totalHours || 0)
    }, 0)
  }

  // Calendar utility functions
  const isSameDay = (date1: Date, date2: Date) => {
    return date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
  }

  const isShiftOnDay = (shift: Shift, day: Date) => {
    const shiftStart = new Date(shift.startTime)
    return isSameDay(shiftStart, day)
  }

  const getWeekStart = (date: Date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day
    return new Date(d.setDate(diff))
  }

  const getMonthStart = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1)
  }

  const getMonthEnd = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0)
  }

  const getCalendarDays = (): CalendarDay[] => {
    const days: CalendarDay[] = []
    const today = new Date()

    if (viewMode === 'month') {
      const monthStart = getMonthStart(currentDate)
      const monthEnd = getMonthEnd(currentDate)
      const calendarStart = getWeekStart(monthStart)

      const current = new Date(calendarStart)
      while (current <= monthEnd || current.getDay() !== 0) {
        const dayEntries = timeEntries.filter(entry =>
          isSameDay(new Date(entry.clockIn), current)
        )
        const dayShifts = shifts.filter(shift =>
          isShiftOnDay(shift, current)
        )
        const totalHours = dayEntries.reduce((sum, entry) => sum + (entry.totalHours || 0), 0)

        days.push({
          date: new Date(current),
          entries: dayEntries,
          shifts: dayShifts,
          totalHours,
          isToday: isSameDay(current, today),
          isCurrentMonth: current.getMonth() === currentDate.getMonth()
        })

        current.setDate(current.getDate() + 1)
      }
    } else if (viewMode === 'week') {
      const weekStart = getWeekStart(currentDate)
      for (let i = 0; i < 7; i++) {
        const current = new Date(weekStart)
        current.setDate(weekStart.getDate() + i)

        const dayEntries = timeEntries.filter(entry =>
          isSameDay(new Date(entry.clockIn), current)
        )
        const dayShifts = shifts.filter(shift =>
          isShiftOnDay(shift, current)
        )
        const totalHours = dayEntries.reduce((sum, entry) => sum + (entry.totalHours || 0), 0)

        days.push({
          date: new Date(current),
          entries: dayEntries,
          shifts: dayShifts,
          totalHours,
          isToday: isSameDay(current, today),
          isCurrentMonth: true
        })
      }
    } else {
      const dayEntries = timeEntries.filter(entry =>
        isSameDay(new Date(entry.clockIn), currentDate)
      )
      const dayShifts = shifts.filter(shift =>
        isShiftOnDay(shift, currentDate)
      )
      const totalHours = dayEntries.reduce((sum, entry) => sum + (entry.totalHours || 0), 0)

      days.push({
        date: new Date(currentDate),
        entries: dayEntries,
        shifts: dayShifts,
        totalHours,
        isToday: isSameDay(currentDate, today),
        isCurrentMonth: true
      })
    }

    return days
  }

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1))
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
    } else {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1))
    }
    setCurrentDate(newDate)
  }

  const handleCreateEntry = (selectedDate?: Date) => {
    modal.show(
      'create-time-entry',
      CreateTimeEntryModal,
      {
        selectedDate,
        organizations,
        projects,
        onEntryCreated: fetchAllData
      },
      {
        size: 'md'
      }
    )
  }

  const handleEditEntry = (entry: TimeEntry) => {
    modal.show(
      'edit-time-entry',
      EditTimeEntryModal,
      {
        entry,
        projects,
        onEntryUpdated: fetchAllData
      },
      {
        size: 'md'
      }
    )
  }




  const handleDayClick = (day: CalendarDay) => {
    if (viewMode === 'month' || viewMode === 'week') {
      setCurrentDate(day.date)
      setViewMode('day')
    } else {
      // In day view, clicking should open create modal
      const startTime = new Date(day.date)
      startTime.setHours(9, 0, 0, 0)
      handleCreateEntry(startTime)
    }
  }


  const getDateRangeText = () => {
    if (viewMode === 'month') {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    } else if (viewMode === 'week') {
      const weekStart = getWeekStart(currentDate)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)
      return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    } else {
      return currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    }
  }

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0 flex items-center justify-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg animate-pulse"></div>
              <span className="text-slate-600 font-medium">Loading timesheet...</span>
            </div>
          </div>
        </div>
      </AuthenticatedLayout>
    )
  }

  const calendarDays = getCalendarDays()

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  {viewingUser ? `${viewingUser}'s Timesheet` : 'Timesheet'}
                </h1>
                <div className="flex items-center mt-2 space-x-4">
                  <div className="inline-flex items-center px-3 py-1 rounded-xl bg-gradient-to-r from-blue-100 to-blue-200 border border-blue-200">
                    <svg className="w-4 h-4 text-blue-600 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-semibold text-blue-800">Today: {getHoursForPeriod('today').toFixed(1)}h</span>
                  </div>
                  {(viewMode === 'week' || viewMode === 'month') && (
                    <div className="inline-flex items-center px-3 py-1 rounded-xl bg-gradient-to-r from-purple-100 to-purple-200 border border-purple-200">
                      <svg className="w-4 h-4 text-purple-600 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 0H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4 0V7zM9 11h6m-6 4h6" />
                      </svg>
                      <span className="text-sm font-semibold text-purple-800">Week: {getHoursForPeriod('week').toFixed(1)}h</span>
                    </div>
                  )}
                  {viewMode === 'month' && (
                    <div className="inline-flex items-center px-3 py-1 rounded-xl bg-gradient-to-r from-green-100 to-emerald-100 border border-green-200">
                      <svg className="w-4 h-4 text-green-600 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm font-semibold text-green-800">Month: {getHoursForPeriod('month').toFixed(1)}h</span>
                    </div>
                  )}
                  <div className="inline-flex items-center px-3 py-1 rounded-xl bg-gradient-to-r from-blue-100 to-indigo-100 border border-blue-200">
                    <svg className="w-4 h-4 text-blue-600 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 012-2h4a1 1 0 012 2v4m0 0V3h4a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2h4v4z" />
                    </svg>
                    <span className="text-sm font-semibold text-blue-800">{shifts.length} scheduled shifts</span>
                  </div>
                  {viewingUser && (
                    <Link
                      href="/organization"
                      className="inline-flex items-center px-3 py-1 text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors duration-200"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      Back to organization
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {organizations.length > 1 && (
              <div className="mb-6">
                <div className="bg-white/70 backdrop-blur-sm shadow-lg rounded-2xl border border-slate-200/50 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">Organization</h3>
                        <p className="text-sm text-slate-600">Select which organization to view</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {organizations.map((org) => (
                        <Button
                          key={org.id}
                          onClick={() => setSelectedOrgId(org.id)}
                          variant={selectedOrgId === org.id ? 'primary' : 'secondary'}
                          size="sm"
                        >
                          {org.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Calendar Controls */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <IconButton onClick={() => navigateDate('prev')}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </IconButton>
                <h2 className="text-xl font-semibold text-slate-900 min-w-[300px] text-center">
                  {getDateRangeText()}
                </h2>
                <IconButton onClick={() => navigateDate('next')}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </IconButton>
              </div>

              <div className="flex items-center space-x-1 bg-slate-100 rounded-lg p-1">
                {(['month', 'week', 'day'] as ViewMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 ${viewMode === mode
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                      }`}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="bg-white/70 backdrop-blur-sm shadow-xl rounded-3xl border border-slate-200/50 overflow-hidden">
            {viewMode === 'month' && (
              <div className="p-6">
                {/* Month Header */}
                <div className="grid grid-cols-7 gap-px mb-4">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className="p-3 text-center text-sm font-semibold text-slate-500 bg-slate-50 rounded-lg">
                      {day}
                    </div>
                  ))}
                </div>
                {/* Month Grid */}
                <div className="grid grid-cols-7 gap-px">
                  {calendarDays.map((day, index) => (
                    <CalendarDay
                      key={index}
                      day={day}
                      viewMode="month"
                      onClick={handleDayClick}
                      formatTime={formatTime}
                    />
                  ))}
                </div>
              </div>
            )}

            {viewMode === 'week' && (
              <div className="p-6">
                <div className="grid grid-cols-7 gap-4">
                  {calendarDays.map((day, index) => (
                    <CalendarDay
                      key={index}
                      day={day}
                      viewMode="week"
                      onClick={handleDayClick}
                      formatTime={formatTime}
                    />
                  ))}
                </div>
              </div>
            )}

            {viewMode === 'day' && (
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-900">
                      {calendarDays[0]?.totalHours > 0
                        ? `Total: ${calendarDays[0].totalHours.toFixed(2)} hours logged`
                        : 'No time logged'
                      }
                      {calendarDays[0]?.shifts.length > 0 && (
                        <span className="text-blue-700 text-base font-semibold ml-3">
                          • {calendarDays[0].shifts.length} shift{calendarDays[0].shifts.length > 1 ? 's' : ''} scheduled
                        </span>
                      )}
                    </h3>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => handleCreateEntry(calendarDays[0].date)}
                        variant="success"
                        size="sm"
                        icon={
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        }
                      >
                        Log Time
                      </Button>
                    </div>
                  </div>

                  {(calendarDays[0]?.entries.length === 0 && calendarDays[0]?.shifts.length === 0) ? (
                    <div className="text-center py-12 text-slate-500">
                      No time entries or shifts for this day
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Time Entries Section */}
                      {calendarDays[0]?.entries.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-green-800 mb-2 flex items-center">
                            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                            Time Logged ({calendarDays[0].entries.length})
                          </h4>
                          <div className="space-y-2">
                            {calendarDays[0]?.entries.map((entry) => (
                              <TimeEntryCard
                                key={entry.id}
                                entry={entry}
                                onEdit={handleEditEntry}
                                formatTime={formatTime}
                                calculateHours={calculateHours}
                                showUserInfo={!!userId}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Scheduled Shifts Section */}
                      {calendarDays[0]?.shifts.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-blue-800 mb-2 flex items-center">
                            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                            Scheduled Shifts ({calendarDays[0].shifts.length})
                          </h4>
                          <div className="space-y-2">
                            {calendarDays[0]?.shifts.map((shift) => (
                              <div key={shift.id} className="p-4 border border-blue-200 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center space-x-3">
                                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                        <p className="font-semibold text-blue-900">{shift.title}</p>
                                      </div>
                                      <div className="text-sm text-blue-700">
                                        {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                                      </div>
                                    </div>
                                    {shift.description && (
                                      <div className="bg-blue-100/70 rounded-xl p-3 mt-3">
                                        <div className="text-sm text-blue-800">
                                          {shift.description}
                                        </div>
                                      </div>
                                    )}
                                    {shift.project && (
                                      <div className="text-xs text-purple-600 mt-2 font-medium">
                                        Project: {shift.project.name}
                                      </div>
                                    )}
                                    {shift.assignedUser && (
                                      <div className="text-xs text-blue-600 mt-2">
                                        Assigned to: {shift.assignedUser.name || shift.assignedUser.email}
                                      </div>
                                    )}
                                    <div className="text-xs text-blue-500 mt-1">
                                      Schedule: {shift.schedule.name}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>



        </div>
      </div>

    </AuthenticatedLayout>
  )
}

export default function Timesheet() {
  return (
    <Suspense fallback={
      <AuthenticatedLayout>
        <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0 flex items-center justify-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg animate-pulse"></div>
              <span className="text-slate-600 font-medium">Loading timesheet...</span>
            </div>
          </div>
        </div>
      </AuthenticatedLayout>
    }>
      <TimesheetContent />
    </Suspense>
  )
}