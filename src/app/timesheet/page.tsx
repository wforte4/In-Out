'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import AuthenticatedLayout from '../../components/AuthenticatedLayout'
import Snackbar from '../../components/Snackbar'
import DateTimePicker from '../../components/DateTimePicker'
import SimpleRichTextEditor from '../../components/SimpleRichTextEditor'
import RichTextDisplay from '../../components/RichTextDisplay'

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
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showCreateShiftModal, setShowCreateShiftModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [editFormData, setEditFormData] = useState({
    clockIn: null as Date | null,
    clockOut: null as Date | null,
    description: '',
    projectId: ''
  })
  const [shiftFormData, setShiftFormData] = useState({
    title: '',
    description: '',
    startTime: null as Date | null,
    endTime: null as Date | null,
    userId: '',
    projectId: ''
  })
  const [snackbar, setSnackbar] = useState<{
    show: boolean
    message: string
    type: 'success' | 'error' | 'info'
  }>({ show: false, message: '', type: 'success' })

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

  const getTotalHours = () => {
    return timeEntries.reduce((total, entry) => {
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

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDate || !editFormData.clockIn) return

    try {
      const response = await fetch('/api/time/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clockIn: editFormData.clockIn.toISOString(),
          clockOut: editFormData.clockOut?.toISOString() || null,
          description: editFormData.description,
          projectId: editFormData.projectId || null,
          organizationId: selectedOrgId || null,
          userId: userId || undefined
        })
      })

      if (response.ok) {
        setShowCreateModal(false)
        setSelectedDate(null)
        setEditFormData({ clockIn: null, clockOut: null, description: '', projectId: '' })
        fetchAllData()
        setSnackbar({ show: true, message: 'Time entry created successfully!', type: 'success' })
      } else {
        const data = await response.json()
        setSnackbar({ show: true, message: data.error || 'Failed to create entry', type: 'error' })
      }
    } catch (error) {
      console.error('Error creating entry:', error)
      setSnackbar({ show: true, message: 'Failed to create entry', type: 'error' })
    }
  }

  const handleEditEntry = (entry: TimeEntry) => {
    setEditingEntry(entry)
    setEditFormData({
      clockIn: new Date(entry.clockIn),
      clockOut: entry.clockOut ? new Date(entry.clockOut) : null,
      description: entry.description || '',
      projectId: entry.project?.id || ''
    })
  }

  const handleUpdateEntry = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingEntry || !editFormData.clockIn) return

    try {
      const response = await fetch(`/api/time/entries/${editingEntry.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clockIn: editFormData.clockIn.toISOString(),
          clockOut: editFormData.clockOut?.toISOString() || null,
          description: editFormData.description,
          projectId: editFormData.projectId || null,
          organizationId: editingEntry.organizationId
        })
      })

      if (response.ok) {
        setEditingEntry(null)
        fetchAllData()
        setSnackbar({ show: true, message: 'Time entry updated successfully!', type: 'success' })
      } else {
        const data = await response.json()
        setSnackbar({ show: true, message: data.error || 'Failed to update entry', type: 'error' })
      }
    } catch (error) {
      console.error('Error updating entry:', error)
      setSnackbar({ show: true, message: 'Failed to update entry', type: 'error' })
    }
  }

  const handleDeleteEntry = async (entryId: string, organizationId: string | null) => {
    if (!window.confirm('Are you sure you want to delete this time entry?')) return

    try {
      const url = organizationId 
        ? `/api/time/entries/${entryId}?organizationId=${organizationId}`
        : `/api/time/entries/${entryId}`
      
      const response = await fetch(url, { method: 'DELETE' })

      if (response.ok) {
        fetchAllData()
        setSnackbar({ show: true, message: 'Time entry deleted successfully!', type: 'success' })
      } else {
        const data = await response.json()
        setSnackbar({ show: true, message: data.error || 'Failed to delete entry', type: 'error' })
      }
    } catch (error) {
      console.error('Error deleting entry:', error)
      setSnackbar({ show: true, message: 'Failed to delete entry', type: 'error' })
    }
  }

  const getOrCreateDefaultSchedule = async () => {
    if (!selectedOrgId) return null
    
    try {
      // First try to get existing schedules
      const response = await fetch(`/api/schedules?organizationId=${selectedOrgId}`)
      const data = await response.json()
      
      if (response.ok && data.schedules.length > 0) {
        // Use the first available schedule
        return data.schedules[0].id
      }
      
      // Create a default schedule if none exists
      const createResponse = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Default Schedule',
          description: 'Auto-created schedule for shifts',
          organizationId: selectedOrgId
        })
      })
      
      if (createResponse.ok) {
        const createData = await createResponse.json()
        return createData.schedule.id
      }
      
      return null
    } catch (error) {
      console.error('Error getting/creating schedule:', error)
      return null
    }
  }

  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDate || !selectedOrgId) return

    try {
      const scheduleId = await getOrCreateDefaultSchedule()
      if (!scheduleId) {
        setSnackbar({ show: true, message: 'Could not create or find a schedule', type: 'error' })
        return
      }

      if (!shiftFormData.startTime || !shiftFormData.endTime) {
        setSnackbar({ show: true, message: 'Please select start and end times', type: 'error' })
        return
      }

      const response = await fetch('/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...shiftFormData,
          startTime: shiftFormData.startTime.toISOString(),
          endTime: shiftFormData.endTime.toISOString(),
          scheduleId,
          userId: shiftFormData.userId || null,
          projectId: shiftFormData.projectId || null
        })
      })

      if (response.ok) {
        setShowCreateShiftModal(false)
        setSelectedDate(null)
        setShiftFormData({ title: '', description: '', startTime: null, endTime: null, userId: '', projectId: '' })
        fetchAllData()
        setSnackbar({ show: true, message: 'Shift created successfully!', type: 'success' })
      } else {
        const data = await response.json()
        setSnackbar({ show: true, message: data.error || 'Failed to create shift', type: 'error' })
      }
    } catch (error) {
      console.error('Error creating shift:', error)
      setSnackbar({ show: true, message: 'Failed to create shift', type: 'error' })
    }
  }

  const handleDayClick = (day: CalendarDay) => {
    if (viewMode === 'month' || viewMode === 'week') {
      setCurrentDate(day.date)
      setViewMode('day')
    } else {
      // In day view, clicking should open create modal
      setSelectedDate(day.date)
      const startTime = new Date(day.date)
      startTime.setHours(9, 0, 0, 0)
      const endTime = new Date(day.date)
      endTime.setHours(17, 0, 0, 0)
      setEditFormData({
        clockIn: startTime,
        clockOut: endTime,
        description: '',
        projectId: ''
      })
      setShowCreateModal(true)
    }
  }

  const handleAddShift = (day: CalendarDay) => {
    setSelectedDate(day.date)
    const startTime = new Date(day.date)
    startTime.setHours(9, 0, 0, 0)
    const endTime = new Date(day.date)
    endTime.setHours(17, 0, 0, 0)
    setShiftFormData({
      title: '',
      description: '',
      startTime,
      endTime,
      userId: '',
      projectId: ''
    })
    setShowCreateShiftModal(true)
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
                  {viewingUser ? `${viewingUser}'s Schedule & Timesheet` : 'Schedule & Timesheet'}
                </h1>
                <div className="flex items-center mt-2 space-x-4">
                  <div className="inline-flex items-center px-3 py-1 rounded-xl bg-gradient-to-r from-green-100 to-emerald-100 border border-green-200">
                    <svg className="w-4 h-4 text-green-600 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-semibold text-green-800">Total: {getTotalHours().toFixed(2)} hours</span>
                  </div>
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
                        <button
                          key={org.id}
                          onClick={() => setSelectedOrgId(org.id)}
                          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                            selectedOrgId === org.id
                              ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg transform scale-105'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:shadow-md'
                          }`}
                        >
                          {org.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Calendar Controls */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigateDate('prev')}
                  className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <svg className="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h2 className="text-xl font-semibold text-slate-900 min-w-[300px] text-center">
                  {getDateRangeText()}
                </h2>
                <button
                  onClick={() => navigateDate('next')}
                  className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <svg className="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              <div className="flex items-center space-x-2 bg-slate-100 rounded-lg p-1">
                {(['month', 'week', 'day'] as ViewMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      viewMode === mode
                        ? 'bg-white text-purple-600 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
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
                    <div
                      key={index}
                      onClick={() => handleDayClick(day)}
                      className={`min-h-[100px] p-2 border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors ${
                        !day.isCurrentMonth ? 'bg-slate-50 text-slate-400' : 'bg-white'
                      } ${day.isToday ? 'ring-2 ring-purple-500' : ''}`}
                    >
                      <div className={`text-sm font-semibold mb-2 ${day.isToday ? 'text-purple-600' : 'text-slate-900'}`}>
                        {day.date.getDate()}
                      </div>
                      <div className="space-y-1">
                        {day.totalHours > 0 && (
                          <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            {day.totalHours.toFixed(1)}h logged
                          </div>
                        )}
                        {day.shifts.length > 0 && (
                          <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            {day.shifts.length} shift{day.shifts.length > 1 ? 's' : ''}
                          </div>
                        )}
                        {day.entries.slice(0, 1).map((entry) => (
                          <div key={entry.id} className="text-xs text-green-700 truncate bg-green-50 px-1 py-0.5 rounded">
                            ✓ {formatTime(entry.clockIn)} - {entry.clockOut ? formatTime(entry.clockOut) : 'Active'}
                          </div>
                        ))}
                        {day.shifts.slice(0, 1).map((shift) => (
                          <div key={shift.id} className="text-xs text-blue-700 truncate bg-blue-50 px-1 py-0.5 rounded">
                            📅 {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                          </div>
                        ))}
                        {(day.entries.length + day.shifts.length) > 2 && (
                          <div className="text-xs text-slate-400">
                            +{(day.entries.length + day.shifts.length) - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {viewMode === 'week' && (
              <div className="p-6">
                <div className="grid grid-cols-7 gap-4">
                  {calendarDays.map((day, index) => (
                    <div
                      key={index}
                      onClick={() => handleDayClick(day)}
                      className={`group min-h-[200px] p-4 border border-slate-200 rounded-lg cursor-pointer hover:shadow-lg hover:border-purple-300 transition-all duration-200 transform hover:-translate-y-1 ${
                        day.isToday ? 'ring-2 ring-purple-500 bg-purple-50 shadow-lg' : 'bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className={`text-sm font-semibold ${day.isToday ? 'text-purple-600' : 'text-slate-900'}`}>
                          {day.date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {day.totalHours > 0 && (
                          <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            {day.totalHours.toFixed(1)}h logged
                          </div>
                        )}
                        {day.shifts.length > 0 && (
                          <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            {day.shifts.length} shift{day.shifts.length > 1 ? 's' : ''}
                          </div>
                        )}
                        {day.entries.map((entry) => (
                          <div key={entry.id} className="text-xs p-2 bg-green-50 border border-green-200 rounded text-green-800">
                            <div className="font-medium">
                              ✓ {formatTime(entry.clockIn)} - {entry.clockOut ? formatTime(entry.clockOut) : 'Active'}
                            </div>
                            {entry.description && (
                              <div className="text-green-600 truncate">{entry.description}</div>
                            )}
                          </div>
                        ))}
                        {day.shifts.map((shift) => (
                          <div key={shift.id} className="text-xs p-2 bg-blue-50 border border-blue-200 rounded text-blue-800">
                            <div className="font-medium">
                              📅 {shift.title}
                            </div>
                            <div className="text-blue-600">
                              {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                            </div>
                            {shift.project && (
                              <div className="text-purple-600 truncate text-xs font-medium">
                                Project: {shift.project.name}
                              </div>
                            )}
                            {shift.assignedUser && (
                              <div className="text-blue-500 truncate text-xs">
                                {shift.assignedUser.name || shift.assignedUser.email}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
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
                      <button
                        onClick={() => handleDayClick(calendarDays[0])}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        ✓ Log Time
                      </button>
                      {organizations.some(org => org.isAdmin) && (
                        <button
                          onClick={() => handleAddShift(calendarDays[0])}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          📅 Add Shift
                        </button>
                      )}
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
                              <div key={entry.id} className="p-4 border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-3">
                                  <div className={`w-3 h-3 rounded-full ${
                                    entry.clockOut ? 'bg-slate-400' : 'bg-green-500 animate-pulse'
                                  }`}></div>
                                  <p className="font-medium text-slate-900">
                                    {formatTime(entry.clockIn)} - {entry.clockOut ? formatTime(entry.clockOut) : 'Active'}
                                  </p>
                                </div>
                                {entry.totalHours && (
                                  <div className="inline-flex items-center px-3 py-1 rounded-xl bg-gradient-to-r from-green-100 to-emerald-100 border border-green-200">
                                    <span className="text-sm font-bold text-green-800">
                                      {entry.totalHours.toFixed(2)}h
                                    </span>
                                  </div>
                                )}
                              </div>
                              {(entry.description || entry.project) && (
                                <div className="bg-slate-100/70 rounded-xl p-3 mt-3 space-y-2">
                                  {entry.description && (
                                    <p className="text-sm font-medium text-slate-700">
                                      {entry.description}
                                    </p>
                                  )}
                                  {entry.project && (
                                    <p className="text-sm font-medium text-purple-700">
                                      Project: {entry.project.name}
                                    </p>
                                  )}
                                </div>
                              )}
                              {entry.editedBy && entry.editedAt && (
                                <div className="text-xs text-slate-500 mt-2">
                                  Edited by {entry.editor?.name || entry.editor?.email} on {new Date(entry.editedAt).toLocaleString()}
                                </div>
                              )}
                              <div className="flex space-x-2 mt-4">
                                <button
                                  onClick={() => handleEditEntry(entry)}
                                  className="inline-flex items-center px-3 py-1 text-xs font-semibold text-blue-600 hover:text-white bg-blue-100 hover:bg-blue-600 rounded-lg transition-all duration-200"
                                >
                                  <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteEntry(entry.id, entry.organizationId)}
                                  className="inline-flex items-center px-3 py-1 text-xs font-semibold text-red-600 hover:text-white bg-red-100 hover:bg-red-600 rounded-lg transition-all duration-200"
                                >
                                  <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                              </div>
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
                                        <RichTextDisplay 
                                          content={shift.description} 
                                          className="text-sm text-blue-800"
                                        />
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

          {/* Create Entry Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Add Time Entry</h3>
                <form onSubmit={handleCreateEntry} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Clock In</label>
                    <DateTimePicker
                      selected={editFormData.clockIn}
                      onChange={(date) => setEditFormData({...editFormData, clockIn: date})}
                      showTimeSelect={true}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Clock Out</label>
                    <DateTimePicker
                      selected={editFormData.clockOut}
                      onChange={(date) => setEditFormData({...editFormData, clockOut: date})}
                      showTimeSelect={true}
                      placeholderText="Select end time (optional)"
                      minDate={editFormData.clockIn || undefined}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Project</label>
                    <select
                      value={editFormData.projectId}
                      onChange={(e) => setEditFormData({...editFormData, projectId: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white text-slate-900"
                    >
                      <option value="">No Project</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                    <textarea
                      value={editFormData.description}
                      onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white text-slate-900"
                      rows={3}
                    />
                  </div>
                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      className="px-6 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
                    >
                      Create
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateModal(false)
                        setSelectedDate(null)
                      }}
                      className="px-6 py-2 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Create Shift Modal */}
          {showCreateShiftModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Schedule Shift</h3>
                <form onSubmit={handleCreateShift} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Shift Title</label>
                    <input
                      type="text"
                      value={shiftFormData.title}
                      onChange={(e) => setShiftFormData({...shiftFormData, title: e.target.value})}
                      required
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white text-slate-900"
                      placeholder="e.g., Morning Shift, Customer Service"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                    <SimpleRichTextEditor
                      value={shiftFormData.description}
                      onChange={(value) => setShiftFormData({...shiftFormData, description: value})}
                      placeholder="Optional details about the shift"
                      className="mb-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Project</label>
                    <select
                      value={shiftFormData.projectId}
                      onChange={(e) => setShiftFormData({...shiftFormData, projectId: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white text-slate-900"
                    >
                      <option value="">No Project</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Assign to Employee</label>
                    <select
                      value={shiftFormData.userId}
                      onChange={(e) => setShiftFormData({...shiftFormData, userId: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white text-slate-900"
                    >
                      <option value="">Unassigned</option>
                      {organizations.find(org => org.id === selectedOrgId)?.memberships.map((membership) => (
                        <option key={membership.user.id} value={membership.user.id}>
                          {membership.user.name || membership.user.email}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Start Time</label>
                      <DateTimePicker
                        selected={shiftFormData.startTime}
                        onChange={(date) => setShiftFormData({...shiftFormData, startTime: date})}
                        showTimeSelect={true}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">End Time</label>
                      <DateTimePicker
                        selected={shiftFormData.endTime}
                        onChange={(date) => setShiftFormData({...shiftFormData, endTime: date})}
                        showTimeSelect={true}
                        minDate={shiftFormData.startTime || undefined}
                        required
                      />
                    </div>
                  </div>
                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                    >
                      Schedule Shift
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateShiftModal(false)
                        setSelectedDate(null)
                      }}
                      className="px-6 py-2 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Edit Entry Modal */}
          {editingEntry && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Edit Time Entry</h3>
                <form onSubmit={handleUpdateEntry} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Clock In</label>
                    <DateTimePicker
                      selected={editFormData.clockIn}
                      onChange={(date) => setEditFormData({...editFormData, clockIn: date})}
                      showTimeSelect={true}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Clock Out</label>
                    <DateTimePicker
                      selected={editFormData.clockOut}
                      onChange={(date) => setEditFormData({...editFormData, clockOut: date})}
                      showTimeSelect={true}
                      placeholderText="Select end time (optional)"
                      minDate={editFormData.clockIn || undefined}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Project</label>
                    <select
                      value={editFormData.projectId}
                      onChange={(e) => setEditFormData({...editFormData, projectId: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white text-slate-900"
                    >
                      <option value="">No Project</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                    <textarea
                      value={editFormData.description}
                      onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white text-slate-900"
                      rows={3}
                    />
                  </div>
                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      className="px-6 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
                    >
                      Update
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingEntry(null)}
                      className="px-6 py-2 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      <Snackbar
        message={snackbar.message}
        type={snackbar.type}
        show={snackbar.show}
        onClose={() => setSnackbar({ ...snackbar, show: false })}
      />
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