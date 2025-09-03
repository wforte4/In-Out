'use client'

import { useEffect, useState, useCallback } from 'react'
import AuthenticatedLayout from '../../components/AuthenticatedLayout'

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

interface Organization {
  id: string
  name: string
  userRole: string
}

export default function MySchedule() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrgId, setSelectedOrgId] = useState<string>('')
  const [shifts, setShifts] = useState<Shift[]>([])
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
    }
  }, [selectedOrgId, fetchMyShifts])

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
        <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0 flex items-center justify-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg animate-pulse"></div>
              <span className="text-slate-600 font-medium">Loading schedule...</span>
            </div>
          </div>
        </div>
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
            <div className="bg-white/70 backdrop-blur-sm shadow-xl rounded-3xl border border-slate-200/50 overflow-hidden">
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gradient-to-br from-slate-400 to-slate-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 8l-2-2m6 0l-2 2m-2-4v8" />
                  </svg>
                </div>
                <p className="text-xl font-semibold text-slate-600 mb-4">No organizations found</p>
                <p className="text-slate-500">You&apos;re not part of any organizations yet</p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {organizations.length > 1 && (
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-6">
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Select Organization
                  </label>
                  <select
                    value={selectedOrgId}
                    onChange={(e) => setSelectedOrgId(e.target.value)}
                    className="block w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white/80 text-slate-900"
                  >
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name} ({org.userRole})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedOrg && (
                <div className="space-y-6">
                  <div className="bg-white/70 backdrop-blur-sm shadow-xl rounded-3xl border border-slate-200/50 overflow-hidden">
                    <div className="px-8 py-6 border-b border-slate-200/50">
                      <h2 className="text-xl font-bold text-slate-900">Today&apos;s Shifts</h2>
                    </div>
                    <div className="px-8 py-6">
                      {todayShifts.length === 0 ? (
                        <p className="text-slate-500 text-center py-8">No shifts scheduled for today</p>
                      ) : (
                        <div className="space-y-4">
                          {todayShifts.map((shift) => (
                            <div key={shift.id} className="bg-gradient-to-r from-green-50 to-green-100/50 rounded-2xl p-6 border border-green-200/50">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h3 className="text-lg font-semibold text-slate-900">{shift.title}</h3>
                                  {shift.description && (
                                    <p className="text-slate-600 mt-1">{shift.description}</p>
                                  )}
                                  <p className="text-sm text-slate-500 mt-2">Schedule: {shift.schedule.name}</p>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-bold text-green-700">
                                    {new Date(shift.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(shift.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                  </div>
                                  <div className="text-sm text-slate-500 mt-1">
                                    Duration: {Math.round((new Date(shift.endTime).getTime() - new Date(shift.startTime).getTime()) / (1000 * 60 * 60) * 10) / 10}h
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white/70 backdrop-blur-sm shadow-xl rounded-3xl border border-slate-200/50 overflow-hidden">
                    <div className="px-8 py-6 border-b border-slate-200/50">
                      <h2 className="text-xl font-bold text-slate-900">Upcoming Shifts</h2>
                    </div>
                    <div className="px-8 py-6">
                      {upcomingShifts.length === 0 ? (
                        <p className="text-slate-500 text-center py-8">No upcoming shifts scheduled</p>
                      ) : (
                        <div className="space-y-4">
                          {upcomingShifts.slice(0, 10).map((shift) => (
                            <div key={shift.id} className="bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-2xl p-6 border border-slate-200/50">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h3 className="text-lg font-semibold text-slate-900">{shift.title}</h3>
                                  {shift.description && (
                                    <p className="text-slate-600 mt-1">{shift.description}</p>
                                  )}
                                  <p className="text-sm text-slate-500 mt-2">Schedule: {shift.schedule.name}</p>
                                  {shift.isRecurring && (
                                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs font-semibold mt-2">
                                      Recurring: {shift.recurringPattern}
                                    </span>
                                  )}
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-bold text-slate-700">
                                    {new Date(shift.startTime).toLocaleDateString()}
                                  </div>
                                  <div className="text-sm text-slate-600">
                                    {new Date(shift.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(shift.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                  </div>
                                  <div className="text-sm text-slate-500 mt-1">
                                    Duration: {Math.round((new Date(shift.endTime).getTime() - new Date(shift.startTime).getTime()) / (1000 * 60 * 60) * 10) / 10}h
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
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