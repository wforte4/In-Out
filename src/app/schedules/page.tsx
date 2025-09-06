'use client'

import { useEffect, useState, useCallback } from 'react'
import AuthenticatedLayout from '../../components/AuthenticatedLayout'
import CustomDropdown from '../../components/CustomDropdown'
import Button from '../../components/Button'
import SectionCard from '../../components/SectionCard'
import EmptyState from '../../components/EmptyState'
import LoadingState from '../../components/LoadingState'
import ScheduleShiftCard from '../../components/ScheduleShiftCard'
import CreateScheduleModal from '../../components/modals/CreateScheduleModal'
import AddShiftModal from '../../components/modals/AddShiftModal'
import { useModal } from '../../hooks/useModal'

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
  const modal = useModal()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrgId, setSelectedOrgId] = useState<string>('')
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

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

  const handleCreateSchedule = () => {
    modal.show(
      'create-schedule',
      CreateScheduleModal,
      {
        selectedOrgId,
        onScheduleCreated: fetchSchedules
      },
      {
        size: 'md'
      }
    )
  }

  const handleCreateShift = (scheduleId: string) => {
    const selectedOrg = organizations.find(org => org.id === selectedOrgId)
    modal.show(
      'add-shift',
      AddShiftModal,
      {
        selectedOrg,
        projects,
        scheduleId,
        onShiftCreated: fetchSchedules
      },
      {
        size: 'lg'
      }
    )
  }

  if (loading) {
    return (
      <AuthenticatedLayout>
        <LoadingState message="Loading schedules..." />
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
            <EmptyState
              title="Admin Access Required"
              message="You need admin access to manage schedules"
              iconColorScheme="slate"
              icon={
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              }
            />
          ) : (
            <div className="space-y-8">
              {organizations.length > 1 && (
                <SectionCard
                  title="Organization Selection"
                  description="Choose which organization to manage schedules for"
                  iconColorScheme="blue"
                  icon={
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  }
                >
                  <CustomDropdown
                    label="Select Organization"
                    options={organizations.map(org => ({ value: org.id, label: org.name }))}
                    value={selectedOrgId}
                    onChange={setSelectedOrgId}
                    placeholder="Choose an organization"
                    className="block w-full"
                  />
                </SectionCard>
              )}

              {selectedOrg && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-slate-900">{selectedOrg.name} Schedules</h2>
                    <Button
                      onClick={handleCreateSchedule}
                      variant="primary"
                      icon={
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      }
                    >
                      Create Schedule
                    </Button>
                  </div>


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
                            <Button
                              onClick={() => handleCreateShift(schedule.id)}
                              variant="success"
                              icon={
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                              }
                            >
                              Add Shift
                            </Button>
                          </div>
                        </div>

                        <div className="px-8 py-6">
                          {schedule.shifts.length === 0 ? (
                            <p className="text-slate-500 text-center py-8">No shifts scheduled yet</p>
                          ) : (
                            <div className="space-y-4">
                              {schedule.shifts.map((shift) => (
                                <ScheduleShiftCard
                                  key={shift.id}
                                  shift={shift}
                                />
                              ))}
                            </div>
                          )}
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
    </AuthenticatedLayout>
  )
}