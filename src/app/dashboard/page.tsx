'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import AuthenticatedLayout from '../../components/AuthenticatedLayout'
import SearchableSelect from '../../components/SearchableSelect'
import Button from '../../components/Button'
import NavigationCard from '../../components/NavigationCard'
import TextInput from '../../components/TextInput'
import ActiveTimeEntryCard from '../../components/ActiveTimeEntryCard'
import { useSnackbar } from '../../hooks/useSnackbar'

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
  const snackbar = useSnackbar()

  const fetchActiveEntry = async () => {
    try {
      const response = await fetch('/api/time/clock')
      const data = await response.json()
      setActiveEntry(data.activeEntry)
      
      // Set selected org and project if user is currently clocked in
      if (data.activeEntry?.organization?.id) {
        setSelectedOrgId(data.activeEntry.organization.id)
      }
      if (data.activeEntry?.project?.id) {
        setSelectedProjectId(data.activeEntry.project.id)
      }
    } catch (error) {
      console.error('Error fetching active entry:', error)
    }
  }

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/organization/members')
      const data = await response.json()
      if (response.ok && data.organizations) {
        setOrganizations(data.organizations)
        if (data.organizations.length === 1) {
          setSelectedOrgId(data.organizations[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching organizations:', error)
    }
  }

  const fetchProjects = useCallback(async () => {
    if (!selectedOrgId) return
    
    try {
      // Fetch only projects where the user is assigned
      const response = await fetch(`/api/projects/assigned?organizationId=${selectedOrgId}`)
      const data = await response.json()
      if (response.ok) {
        setProjects(data.projects || [])
      }
    } catch (error) {
      console.error('Error fetching assigned projects:', error)
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

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handleClock = async (action: 'in' | 'out') => {
    setLoading(true)
    try {
      const response = await fetch('/api/time/clock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          description: action === 'in' ? description : undefined,
          projectId: action === 'in' ? selectedProjectId || null : undefined,
          organizationId: action === 'in' ? selectedOrgId || null : undefined
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        snackbar.error(data.error || 'Clock operation failed')
      } else {
        setDescription('')
        setSelectedProjectId('')
        fetchActiveEntry()
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
                          <label className="block text-lg font-semibold text-slate-800">
                            Organization
                          </label>
                          <SearchableSelect
                            value={selectedOrgId}
                            onChange={setSelectedOrgId}
                            options={organizations.map(org => ({ value: org.id, label: org.name }))}
                            placeholder="Choose an organization..."
                          />
                        </div>
                      )}

                      {selectedOrgId && projects.length > 0 && (
                        <div className="space-y-2">
                          <label className="block text-lg font-semibold text-slate-800">
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
                            placeholder="Choose a project..."
                          />
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

            {/* Quick Actions Card */}
            <div className="bg-white/70 backdrop-blur-sm overflow-hidden shadow-xl rounded-3xl border border-slate-200/50">
              <div className="px-8 py-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-8">
                  Quick Actions
                </h3>
                <div className="space-y-4">
                  <NavigationCard
                    title="View Timesheet"
                    description="Review your time entries and total hours"
                    onClick={() => router.push('/timesheet')}
                    colorScheme="blue"
                    icon={
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    }
                  />
                  
                  <NavigationCard
                    title="Projects"
                    description="Manage and track project progress"
                    onClick={() => router.push('/projects')}
                    colorScheme="orange"
                    icon={
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 00-2 2v2" />
                      </svg>
                    }
                  />
                  
                  <NavigationCard
                    title="Organization"
                    description="Manage your team and settings"
                    onClick={() => router.push('/organization')}
                    colorScheme="purple"
                    icon={
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </AuthenticatedLayout>
  )
}