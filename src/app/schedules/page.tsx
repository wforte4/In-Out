'use client'

import { useEffect, useState, useCallback } from 'react'
import AuthenticatedLayout from '../../components/AuthenticatedLayout'
import SimpleRichTextEditor from '../../components/SimpleRichTextEditor'
import RichTextDisplay from '../../components/RichTextDisplay'
import CustomDropdown from '../../components/CustomDropdown'
import { useSnackbar } from '../../hooks/useSnackbar'

interface User {
  id: string
  name: string | null
  email: string
}

interface Shift {
  id: string
  title: string
  description: string | null
  startTime: string
  endTime: string
  isRecurring: boolean
  recurringPattern: string | null
  assignedUser: User | null
  project?: {
    id: string
    name: string
  } | null
}

interface Schedule {
  id: string
  name: string
  description: string | null
  createdAt: string
  creator: User
  shifts: Shift[]
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
    user: User
  }>
}

interface Project {
  id: string
  name: string
  description?: string | null
  organizationId: string
}

export default function Schedules() {
  const snackbar = useSnackbar()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrgId, setSelectedOrgId] = useState<string>('')
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showShiftForm, setShowShiftForm] = useState(false)
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('')
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })
  const [shiftFormData, setShiftFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    userId: '',
    projectId: '',
    isRecurring: false,
    recurringPattern: '',
    recurringEndDate: ''
  })

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/organization/members')
      const data = await response.json()
      const adminOrgs = data.organizations?.filter((org: Organization) => org.isAdmin) || []
      setOrganizations(adminOrgs)
      if (adminOrgs.length > 0) {
        setSelectedOrgId(adminOrgs[0].id)
      }
    } catch (error) {
      console.error('Error fetching organizations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSchedules = useCallback(async () => {
    try {
      const response = await fetch(`/api/schedules?organizationId=${selectedOrgId}`)
      const data = await response.json()
      setSchedules(data.schedules || [])
    } catch (error) {
      console.error('Error fetching schedules:', error)
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

  useEffect(() => {
    fetchOrganizations()
  }, [])

  useEffect(() => {
    if (selectedOrgId) {
      fetchSchedules()
      fetchProjects()
    }
  }, [selectedOrgId, fetchSchedules, fetchProjects])

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          organizationId: selectedOrgId
        })
      })
      
      if (response.ok) {
        setFormData({ name: '', description: '' })
        setShowCreateForm(false)
        fetchSchedules()
        snackbar.success('Schedule created successfully!')
      } else {
        const data = await response.json()
        snackbar.error(data.error || 'Failed to create schedule')
      }
    } catch (error) {
      console.error('Error creating schedule:', error)
      snackbar.error('Failed to create schedule')
    }
  }

  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...shiftFormData,
          scheduleId: selectedScheduleId,
          userId: shiftFormData.userId || null,
          projectId: shiftFormData.projectId || null
        })
      })
      
      if (response.ok) {
        setShiftFormData({
          title: '',
          description: '',
          startTime: '',
          endTime: '',
          userId: '',
          projectId: '',
          isRecurring: false,
          recurringPattern: '',
          recurringEndDate: ''
        })
        setShowShiftForm(false)
        fetchSchedules()
        snackbar.success('Shift created successfully!')
      } else {
        const data = await response.json()
        snackbar.error(data.error || 'Failed to create shift')
      }
    } catch (error) {
      console.error('Error creating shift:', error)
      snackbar.error('Failed to create shift')
    }
  }

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0 flex items-center justify-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg animate-pulse"></div>
              <span className="text-slate-600 font-medium">Loading schedules...</span>
            </div>
          </div>
        </div>
      </AuthenticatedLayout>
    )
  }

  const selectedOrg = organizations.find(org => org.id === selectedOrgId)

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Schedule Management</h1>
            <p className="text-slate-600 mt-2">Create and manage employee schedules</p>
          </div>

          {organizations.length === 0 ? (
            <div className="bg-white/70 backdrop-blur-sm shadow-xl rounded-3xl border border-slate-200/50 overflow-hidden">
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gradient-to-br from-slate-400 to-slate-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <p className="text-xl font-semibold text-slate-600 mb-4">Admin Access Required</p>
                <p className="text-slate-500">You need admin access to manage schedules</p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {organizations.length > 1 && (
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-6">
                  <CustomDropdown
                    label="Select Organization"
                    options={organizations.map(org => ({ value: org.id, label: org.name }))}
                    value={selectedOrgId}
                    onChange={setSelectedOrgId}
                    placeholder="Choose an organization"
                    className="block w-full"
                  />
                </div>
              )}

              {selectedOrg && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-slate-900">{selectedOrg.name} Schedules</h2>
                    <button
                      onClick={() => setShowCreateForm(true)}
                      className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-xl hover:bg-purple-700 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Create Schedule
                    </button>
                  </div>

                  {showCreateForm && (
                    <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-6">
                      <h3 className="text-lg font-semibold text-slate-900 mb-4">Create New Schedule</h3>
                      <form onSubmit={handleCreateSchedule} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Name</label>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            required
                            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                          <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                            onClick={() => setShowCreateForm(false)}
                            className="px-6 py-2 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  <div className="space-y-6">
                    {schedules.map((schedule) => (
                      <div key={schedule.id} className="bg-white/70 backdrop-blur-sm shadow-xl rounded-3xl border border-slate-200/50 overflow-hidden">
                        <div className="px-8 py-6 border-b border-slate-200/50">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-xl font-bold text-slate-900">{schedule.name}</h3>
                              {schedule.description && (
                                <p className="text-slate-600 mt-1">{schedule.description}</p>
                              )}
                              <p className="text-sm text-slate-500 mt-2">
                                Created by {schedule.creator.name || schedule.creator.email} on {new Date(schedule.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                setSelectedScheduleId(schedule.id)
                                setShowShiftForm(true)
                              }}
                              className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition-colors"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              Add Shift
                            </button>
                          </div>
                        </div>

                        <div className="px-8 py-6">
                          {schedule.shifts.length === 0 ? (
                            <p className="text-slate-500 text-center py-8">No shifts scheduled yet</p>
                          ) : (
                            <div className="space-y-4">
                              {schedule.shifts.map((shift) => (
                                <div key={shift.id} className="bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-2xl p-4 border border-slate-200/50">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h4 className="font-semibold text-slate-900">{shift.title}</h4>
                                      {shift.description && (
                                        <div className="text-sm text-slate-600 mt-1">
                                          <RichTextDisplay content={shift.description} />
                                        </div>
                                      )}
                                      {shift.project && (
                                        <p className="text-xs text-purple-600 mt-1 font-medium">
                                          Project: {shift.project.name}
                                        </p>
                                      )}
                                      <div className="flex items-center space-x-4 mt-2 text-sm text-slate-500">
                                        <span>{new Date(shift.startTime).toLocaleString()}</span>
                                        <span>→</span>
                                        <span>{new Date(shift.endTime).toLocaleString()}</span>
                                        {shift.isRecurring && (
                                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs font-semibold">
                                            {shift.recurringPattern}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      {shift.assignedUser ? (
                                        <div>
                                          <p className="font-semibold text-slate-900">{shift.assignedUser.name || 'No name'}</p>
                                          <p className="text-sm text-slate-600">{shift.assignedUser.email}</p>
                                        </div>
                                      ) : (
                                        <p className="text-slate-500 italic">Unassigned</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {showShiftForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Add New Shift</h3>
                        <form onSubmit={handleCreateShift} className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
                            <input
                              type="text"
                              value={shiftFormData.title}
                              onChange={(e) => setShiftFormData({...shiftFormData, title: e.target.value})}
                              required
                              className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white text-slate-900"
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
                          <CustomDropdown
                            label="Project"
                            options={[
                              { value: '', label: 'No Project' },
                              ...projects.map(project => ({ value: project.id, label: project.name }))
                            ]}
                            value={shiftFormData.projectId}
                            onChange={(value) => setShiftFormData({...shiftFormData, projectId: value})}
                            placeholder="Select a project"
                            className="w-full"
                          />
                          <CustomDropdown
                            label="Assign to Employee"
                            options={[
                              { value: '', label: 'Unassigned' },
                              ...(selectedOrg?.memberships.map(membership => ({
                                value: membership.user.id,
                                label: membership.user.name || membership.user.email
                              })) || [])
                            ]}
                            value={shiftFormData.userId}
                            onChange={(value) => setShiftFormData({...shiftFormData, userId: value})}
                            placeholder="Select an employee"
                            className="w-full"
                          />
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">Start Time</label>
                              <input
                                type="datetime-local"
                                value={shiftFormData.startTime}
                                onChange={(e) => setShiftFormData({...shiftFormData, startTime: e.target.value})}
                                required
                                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white text-slate-900"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">End Time</label>
                              <input
                                type="datetime-local"
                                value={shiftFormData.endTime}
                                onChange={(e) => setShiftFormData({...shiftFormData, endTime: e.target.value})}
                                required
                                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white text-slate-900"
                              />
                            </div>
                          </div>
                          <div className="flex space-x-4">
                            <button
                              type="submit"
                              className="px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                            >
                              Add Shift
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowShiftForm(false)}
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
              )}
            </div>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  )
}