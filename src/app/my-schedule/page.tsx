'use client'

import { useEffect, useState, useCallback } from 'react'
import AuthenticatedLayout from '../../components/AuthenticatedLayout'
import CustomDropdown from '../../components/CustomDropdown'
import ShiftCard from '../../components/ShiftCard'
import EmptyState from '../../components/EmptyState'
import LoadingState from '../../components/LoadingState'
import SectionCard from '../../components/SectionCard'
import Button from '../../components/Button'
import AddShiftModal from '../../components/modals/AddShiftModal'
import { useModal } from '../../hooks/useModal'

interface User {
  id: string
  name: string | null
  email: string
}

interface Schedule {
  id: string
  name: string
}

interface Shift {
  id: string
  title: string
  description: string | null
  startTime: string
  endTime: string
  isRecurring: boolean
  recurringPattern: string | null
  schedule: Schedule
  assignedUser: User | null
}

interface Project {
  id: string
  name: string
  description?: string | null
  organizationId: string
}

interface Organization {
  id: string
  name: string
  userRole: string
  isAdmin: boolean
  memberships: Array<{
    id: string
    role: string
    user: User
  }>
}

export default function MySchedule() {
  const modal = useModal()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrgId, setSelectedOrgId] = useState<string>('')
  const [shifts, setShifts] = useState<Shift[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [, setDefaultScheduleId] = useState<string>('')
  const [loading, setLoading] = useState(true)

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/organization/members')
      const data = await response.json()
      setOrganizations(data.organizations || [])
      if (data.organizations?.length > 0) {
        setSelectedOrgId(data.organizations[0].id)
      }
    } catch (error) {
      console.error('Error fetching organizations:', error)
    } finally {
      setLoading(false)
    }
  }

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

  const getOrCreateDefaultSchedule = async () => {
    try {
      // First try to get existing schedules
      const response = await fetch(`/api/schedules?organizationId=${selectedOrgId}`)
      const data = await response.json()
      
      if (data.schedules && data.schedules.length > 0) {
        return data.schedules[0].id
      }
      
      // Create a default schedule if none exists
      const createResponse = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Default Schedule',
          description: 'Automatically created schedule',
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

  const fetchMyShifts = useCallback(async () => {
    try {
      const response = await fetch(`/api/shifts?organizationId=${selectedOrgId}`)
      const data = await response.json()
      setShifts(data.shifts || [])
    } catch (error) {
      console.error('Error fetching shifts:', error)
    }
  }, [selectedOrgId])

  useEffect(() => {
    fetchOrganizations()
  }, [])

  useEffect(() => {
    if (selectedOrgId) {
      fetchMyShifts()
      fetchProjects()
    }
  }, [selectedOrgId, fetchMyShifts, fetchProjects])

  const handleAddShift = async () => {
    const scheduleId = await getOrCreateDefaultSchedule()
    if (!scheduleId) {
      return // Error already handled in getOrCreateDefaultSchedule
    }
    
    setDefaultScheduleId(scheduleId)
    
    modal.show(
      'add-shift',
      AddShiftModal,
      {
        selectedOrg: organizations.find(org => org.id === selectedOrgId),
        projects,
        scheduleId,
        onShiftCreated: fetchMyShifts
      },
      {
        size: 'lg'
      }
    )
  }

  const getUpcomingShifts = () => {
    const now = new Date()
    return shifts.filter(shift => new Date(shift.startTime) > now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
  }

  const getTodayShifts = () => {
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

    return shifts.filter(shift => {
      const shiftStart = new Date(shift.startTime)
      return shiftStart >= startOfDay && shiftStart < endOfDay
    })
  }

  if (loading) {
    return (
      <AuthenticatedLayout>
        <LoadingState message="Loading schedule..." />
      </AuthenticatedLayout>
    )
  }

  const selectedOrg = organizations.find(org => org.id === selectedOrgId)
  const todayShifts = getTodayShifts()
  const upcomingShifts = getUpcomingShifts()

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">My Schedule</h1>
            <p className="text-slate-600 mt-2">View your upcoming shifts and schedule</p>
          </div>

          {organizations.length === 0 ? (
            <EmptyState
              title="No organizations found"
              message="You're not part of any organizations yet"
              iconColorScheme="slate"
              icon={
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 8l-2-2m6 0l-2 2m-2-4v8" />
                </svg>
              }
            />
          ) : (
            <div className="space-y-8">
              {organizations.length > 1 && (
                <SectionCard
                  title="Organization Selection"
                  description="Choose which organization's schedule to view"
                  iconColorScheme="blue"
                  icon={
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  }
                >
                  <CustomDropdown
                    label="Select Organization"
                    options={organizations.map(org => ({
                      value: org.id,
                      label: `${org.name} (${org.userRole})`
                    }))}
                    value={selectedOrgId}
                    onChange={setSelectedOrgId}
                    placeholder="Choose an organization"
                    className="block w-full"
                  />
                </SectionCard>
              )}

              {selectedOrg && (
                <div className="space-y-6">
                  {/* Add Shift Button */}
                  {selectedOrg.isAdmin && (
                    <div className="flex justify-end">
                      <Button
                        onClick={handleAddShift}
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
                  )}
                  <SectionCard
                    title="Today's Shifts"
                    description={`${todayShifts.length} shift${todayShifts.length !== 1 ? 's' : ''} scheduled for today`}
                    iconColorScheme="green"
                    icon={
                      <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    }
                  >
                    {todayShifts.length === 0 ? (
                      <p className="text-slate-500 text-center py-8">No shifts scheduled for today</p>
                    ) : (
                      <div className="space-y-4">
                        {todayShifts.map((shift) => (
                          <ShiftCard key={shift.id} shift={shift} variant="today" />
                        ))}
                      </div>
                    )}
                  </SectionCard>

                  <SectionCard
                    title="Upcoming Shifts"
                    description={`${upcomingShifts.length} upcoming shift${upcomingShifts.length !== 1 ? 's' : ''} scheduled`}
                    iconColorScheme="purple"
                    icon={
                      <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 8l-2-2m6 0l-2 2m-2-4v8" />
                      </svg>
                    }
                  >
                    {upcomingShifts.length === 0 ? (
                      <p className="text-slate-500 text-center py-8">No upcoming shifts scheduled</p>
                    ) : (
                      <div className="space-y-4">
                        {upcomingShifts.slice(0, 10).map((shift) => (
                          <ShiftCard key={shift.id} shift={shift} variant="upcoming" />
                        ))}
                      </div>
                    )}
                  </SectionCard>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  )
}