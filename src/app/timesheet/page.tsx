'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import AuthenticatedLayout from '../../components/AuthenticatedLayout'

interface TimeEntry {
  id: string
  clockIn: string
  clockOut: string | null
  totalHours: number | null
  description: string | null
  user: {
    name: string | null
    email: string
  }
}

export default function Timesheet() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [viewingUser, setViewingUser] = useState<string | null>(null)

  const userId = searchParams.get('userId')

  useEffect(() => {
    fetchTimeEntries()
  }, [userId])

  const fetchTimeEntries = async () => {
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
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

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

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  {viewingUser ? `${viewingUser}'s Timesheet` : 'Your Timesheet'}
                </h1>
                <div className="flex items-center mt-2 space-x-4">
                  <div className="inline-flex items-center px-3 py-1 rounded-xl bg-gradient-to-r from-green-100 to-emerald-100 border border-green-200">
                    <svg className="w-4 h-4 text-green-600 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-semibold text-green-800">Total: {getTotalHours().toFixed(2)} hours</span>
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
          </div>

          <div className="bg-white/70 backdrop-blur-sm shadow-xl rounded-3xl border border-slate-200/50 overflow-hidden">
            {timeEntries.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gradient-to-br from-slate-400 to-slate-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-xl font-semibold text-slate-600 mb-4">No time entries yet</p>
                <p className="text-slate-500 mb-6">Start tracking your time to see entries here</p>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Start Tracking Time
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-200/50">
                {timeEntries.map((entry) => (
                  <div key={entry.id} className="px-8 py-6 hover:bg-slate-50/50 transition-colors duration-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${
                              entry.clockOut ? 'bg-slate-400' : 'bg-green-500 animate-pulse'
                            }`}></div>
                            <p className="text-lg font-bold text-slate-900">
                              {formatDate(entry.clockIn)}
                            </p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="text-right">
                              <p className="text-sm font-medium text-slate-600">
                                {formatTime(entry.clockIn)} - {entry.clockOut ? formatTime(entry.clockOut) : 'Active'}
                              </p>
                            </div>
                            {entry.totalHours ? (
                              <div className="inline-flex items-center px-3 py-1 rounded-xl bg-gradient-to-r from-green-100 to-emerald-100 border border-green-200">
                                <svg className="w-4 h-4 text-green-600 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-sm font-bold text-green-800">
                                  {entry.totalHours.toFixed(2)}h
                                </span>
                              </div>
                            ) : (
                              <div className="inline-flex items-center px-3 py-1 rounded-xl bg-gradient-to-r from-blue-100 to-indigo-100 border border-blue-200">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-2"></div>
                                <span className="text-sm font-bold text-blue-800">Active</span>
                              </div>
                            )}
                          </div>
                        </div>
                        {entry.description && (
                          <div className="bg-slate-100/70 rounded-xl p-3 mt-3">
                            <p className="text-sm font-medium text-slate-700">
                              <svg className="w-4 h-4 inline mr-2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              {entry.description}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}