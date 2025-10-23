'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import AuthenticatedLayout from '../../components/AuthenticatedLayout'
import SearchableSelect from '../../components/SearchableSelect'
import Button from '../../components/Button'
import TextInput from '../../components/TextInput'
import ActiveTimeEntryCard from '../../components/ActiveTimeEntryCard'
import { useSnackbar } from '../../hooks/useSnackbar'
import { httpClient } from '../../lib/httpClient'
import {
  DocumentTextIcon,
  FolderIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline'

interface TimeEntry {
  id: string
  clockIn: string
  clockOut: string | null
  totalHours: number | null
  description: string | null
  project?: {
    id: string
    name: string
  }
  organization?: {
    id: string
    name: string
  }
}

interface Project {
  id: string
  name: string
  status: string
}

interface Organization {
  id: string
  name: string
}

export default function Dashboard() {
  const router = useRouter()
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null)
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrgId, setSelectedOrgId] = useState<string>('')
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [projectsLoading, setProjectsLoading] = useState(false)
  const [weeklyStats, setWeeklyStats] = useState<{
    hoursThisWeek: number
    entriesThisWeek: number
    todayHours: number
    avgDailyHours: number
  } | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const snackbar = useSnackbar()

  const fetchActiveEntry = async () => {
    try {
      const response = await httpClient.get<{ activeEntry: TimeEntry | null }>('/api/time/clock')
      if (response.success) {
        setActiveEntry(response.data?.activeEntry || null)
        
        // Set selected org and project if user is currently clocked in
        if (response.data?.activeEntry?.organization?.id) {
          setSelectedOrgId(response.data.activeEntry.organization.id)
        }
        if (response.data?.activeEntry?.project?.id) {
          setSelectedProjectId(response.data.activeEntry.project.id)
        }
      }
    } catch (error) {
      console.error('Error fetching active entry:', error)
    }
  }

  const fetchOrganizations = async () => {
    try {
      const response = await httpClient.get<{ organizations: Organization[] }>('/api/organization/members')
      if (response.success && response.data?.organizations) {
        setOrganizations(response.data.organizations)
        if (response.data.organizations.length === 1) {
          setSelectedOrgId(response.data.organizations[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching organizations:', error)
    }
  }

  const fetchProjects = useCallback(async () => {
    if (!selectedOrgId) return
    
    setProjectsLoading(true)
    try {
      // Fetch only projects where the user is assigned
      const response = await httpClient.get<{ projects: Project[] }>(`/api/projects/assigned?organizationId=${selectedOrgId}`)
      if (response.success) {
        setProjects(response.data?.projects || [])
      }
    } catch (error) {
      console.error('Error fetching assigned projects:', error)
    } finally {
      setProjectsLoading(false)
    }
  }, [selectedOrgId])

  useEffect(() => {
    fetchActiveEntry()
    fetchOrganizations()
  }, [])

  useEffect(() => {
    if (selectedOrgId) {
      fetchProjects()
    }
  }, [selectedOrgId, fetchProjects])

  const getWeekStart = (date: Date) => {
    const d = new Date(date)
    const day = d.getDay() // 0 = Sunday, 1 = Monday, etc.
    const diff = d.getDate() - day
    d.setDate(diff)
    // Set to beginning of day to avoid time issues
    d.setHours(0, 0, 0, 0)
    return d
  }

  const fetchWeeklyStats = useCallback(async () => {
    try {
      setStatsLoading(true)
      
      // Fetch ALL time entries like the timesheet page does
      const response = await httpClient.get<{ timeEntries: TimeEntry[] }>('/api/time/entries')
      
      if (response.success) {
        const allEntries = response.data?.timeEntries || []
        const now = new Date()
        
        // Use exact same logic as timesheet page
        const startOfWeek = getWeekStart(now)
        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(startOfWeek.getDate() + 6)
        endOfWeek.setHours(23, 59, 59, 999)

        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

        // Filter for this week - same logic as timesheet
        const weekEntries = allEntries.filter(entry => {
          const entryDate = new Date(entry.clockIn)
          const entryDay = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate())
          return entryDay >= startOfWeek && entryDay <= endOfWeek
        })

        // Filter for today - same logic as timesheet
        const todayEntries = allEntries.filter(entry => {
          const entryDate = new Date(entry.clockIn)
          const entryDay = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate())
          return entryDay.getTime() === today.getTime()
        })

        // Calculate hours using same logic as timesheet: entry.totalHours || 0
        const hoursThisWeek = weekEntries.reduce((total, entry) => total + (entry.totalHours || 0), 0)
        const todayHours = todayEntries.reduce((total, entry) => total + (entry.totalHours || 0), 0)
        const avgDailyHours = hoursThisWeek / 7

        setWeeklyStats({
          hoursThisWeek,
          entriesThisWeek: weekEntries.length,
          todayHours,
          avgDailyHours
        })
      }
    } catch (error) {
      console.error('Error fetching weekly stats:', error)
    } finally {
      setStatsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchActiveEntry()
    fetchOrganizations()
    fetchWeeklyStats()
  }, [fetchWeeklyStats])

  useEffect(() => {
    if (selectedOrgId) {
      fetchProjects()
    }
  }, [selectedOrgId, fetchProjects])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handleClock = async (action: 'in' | 'out') => {
    setLoading(true)
    try {
      const response = await httpClient.post('/api/time/clock', {
        action,
        description: action === 'in' ? description : undefined,
        projectId: action === 'in' ? selectedProjectId || null : undefined,
        organizationId: action === 'in' ? selectedOrgId || null : undefined
      })

      if (response.success) {
        setDescription('')
        setSelectedProjectId('')
        fetchActiveEntry()
        fetchWeeklyStats() // Refresh stats after clocking in/out
      } else if (response.status !== 401) {
        snackbar.error(response.error || 'Clock operation failed')
      }
    } catch {
      snackbar.error('An error occurred')
    }
    setLoading(false)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: true,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }


  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Clock In/Out Card */}
            <div className="lg:col-span-2">
              <div className="bg-white/70 backdrop-blur-sm overflow-hidden shadow-xl rounded-3xl border border-slate-200/50">
                <div className="px-8 py-8">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-bold text-slate-900">
                      Time Clock
                    </h3>
                    {activeEntry && (
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium text-green-700">Active</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-center mb-8">
                    <div className="relative">
                      <div className="text-6xl font-mono font-bold bg-gradient-to-br from-slate-800 to-slate-600 bg-clip-text text-transparent">
                        {formatTime(currentTime)}
                      </div>
                      <div className="text-lg text-slate-500 mt-2 font-medium">
                        {currentTime.toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </div>
                    </div>
                  </div>

                  {activeEntry ? (
                    <div className="space-y-6">
                      <ActiveTimeEntryCard activeEntry={activeEntry} />

                      <Button
                        onClick={() => handleClock('out')}
                        disabled={loading}
                        variant="danger"
                        size="lg"
                        fullWidth
                        loading={loading}
                        icon={
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        }
                      >
                        Clock Out
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {organizations.length > 1 && (
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-slate-700">
                            Organization
                          </label>
                          <SearchableSelect
                            value={selectedOrgId}
                            onChange={setSelectedOrgId}
                            options={organizations.map(org => ({ value: org.id, label: org.name }))}
                            placeholder="Choose an organization..."
                            size="lg"
                          />
                        </div>
                      )}

                      {selectedOrgId && (
                        <div className="space-y-2">
                          {projectsLoading ? (
                            <div className="animate-pulse space-y-2">
                              {/* Project label skeleton */}
                              <div className="h-5 bg-slate-200 rounded w-16"></div>
                              {/* Project description skeleton */}
                              <div className="h-4 bg-slate-200 rounded w-64"></div>
                              {/* Project dropdown skeleton */}
                              <div className="h-12 bg-slate-200 rounded-xl"></div>
                            </div>
                          ) : (
                            <>
                              <label className="block text-sm font-medium text-slate-700">
                                Project
                              </label>
                              <p className="text-sm text-slate-600">Optional: Select a project to track time against</p>
                              <SearchableSelect
                                value={selectedProjectId}
                                onChange={setSelectedProjectId}
                                options={[
                                  { value: '', label: 'No specific project' },
                                  ...projects.map(project => ({ value: project.id, label: project.name }))
                                ]}
                                placeholder="Select a project"
                                size="lg"
                              />
                            </>
                          )}
                        </div>
                      )}

                      <TextInput
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        label="What are you working on today?"
                        helperText="Optional: Add a description to track your tasks"
                        placeholder="Frontend development, Bug fixes, Client meeting..."
                        size="lg"
                      />

                      <Button
                        onClick={() => handleClock('in')}
                        disabled={loading}
                        variant="success"
                        size="lg"
                        fullWidth
                        loading={loading}
                        icon={
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        }
                      >
                        Clock In
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Weekly Overview Card */}
              <div className="bg-white/70 backdrop-blur-sm overflow-hidden shadow-xl rounded-3xl border border-slate-200/50">
                <div className="px-6 py-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">
                    This Week
                  </h3>
                  
                  {statsLoading ? (
                    <div className="space-y-4 animate-pulse">
                      <div className="space-y-2">
                        <div className="h-4 bg-slate-200 rounded w-20"></div>
                        <div className="h-8 bg-slate-200 rounded w-16"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 bg-slate-200 rounded w-24"></div>
                        <div className="h-8 bg-slate-200 rounded w-20"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 bg-slate-200 rounded w-28"></div>
                        <div className="h-8 bg-slate-200 rounded w-16"></div>
                      </div>
                    </div>
                  ) : weeklyStats ? (
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-slate-600">Total Hours</p>
                        <p className="text-2xl font-bold text-slate-900">
                          {weeklyStats.hoursThisWeek.toFixed(1)}h
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-slate-600">Today</p>
                        <p className="text-2xl font-bold text-green-600">
                          {weeklyStats.todayHours.toFixed(1)}h
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-slate-600">Daily Average</p>
                        <p className="text-2xl font-bold text-slate-700">
                          {weeklyStats.avgDailyHours.toFixed(1)}h
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-slate-600">Time Entries</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {weeklyStats.entriesThisWeek}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-slate-500">No data available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions Card */}
              <div className="bg-white/70 backdrop-blur-sm overflow-hidden shadow-xl rounded-3xl border border-slate-200/50">
                <div className="px-6 py-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">
                    Quick Actions
                  </h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => router.push('/timesheet')}
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-200 cursor-pointer"
                    >
                      <span className="font-medium">Timesheet</span>
                      <DocumentTextIcon className="w-5 h-5" />
                    </button>
                    
                    <button
                      onClick={() => router.push('/projects')}
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 transition-all duration-200 cursor-pointer"
                    >
                      <span className="font-medium">Projects</span>
                      <FolderIcon className="w-5 h-5" />
                    </button>
                    
                    <button
                      onClick={() => router.push('/organization')}
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 transition-all duration-200 cursor-pointer"
                    >
                      <span className="font-medium">Organization</span>
                      <BuildingOfficeIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </AuthenticatedLayout>
  )
}