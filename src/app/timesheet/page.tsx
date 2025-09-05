'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import AuthenticatedLayout from '../../components/AuthenticatedLayout'
import Snackbar from '../../components/Snackbar'

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

function TimesheetContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [viewingUser, setViewingUser] = useState<string | null>(null)
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null)
  const [editFormData, setEditFormData] = useState({
    clockIn: '',
    clockOut: '',
    description: ''
  })
  const [snackbar, setSnackbar] = useState<{
    show: boolean
    message: string
    type: 'success' | 'error' | 'info'
  }>({ show: false, message: '', type: 'success' })

  const userId = searchParams.get('userId')

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
    } finally {
      setLoading(false)
    }
  }, [userId, router])

  useEffect(() => {
    fetchTimeEntries()
  }, [fetchTimeEntries])

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

  const handleEditEntry = (entry: TimeEntry) => {
    setEditingEntry(entry)
    setEditFormData({
      clockIn: new Date(entry.clockIn).toISOString().slice(0, 16),
      clockOut: entry.clockOut ? new Date(entry.clockOut).toISOString().slice(0, 16) : '',
      description: entry.description || ''
    })
  }

  const handleUpdateEntry = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingEntry) return

    try {
      const response = await fetch(`/api/time/entries/${editingEntry.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clockIn: editFormData.clockIn,
          clockOut: editFormData.clockOut || null,
          description: editFormData.description,
          organizationId: editingEntry.organizationId
        })
      })

      if (response.ok) {
        setEditingEntry(null)
        fetchTimeEntries()
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
        fetchTimeEntries()
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
                  className="inline-flex items-center px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
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
                        {(entry.description || entry.project) && (
                          <div className="bg-slate-100/70 rounded-xl p-3 mt-3 space-y-2">
                            {entry.description && (
                              <p className="text-sm font-medium text-slate-700">
                                <svg className="w-4 h-4 inline mr-2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                {entry.description}
                              </p>
                            )}
                            {entry.project && (
                              <p className="text-sm font-medium text-purple-700">
                                <svg className="w-4 h-4 inline mr-2 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 00-2 2v2" />
                                </svg>
                                Project: {entry.project.name}
                              </p>
                            )}
                            {entry.organization && (
                              <p className="text-sm font-medium text-blue-700">
                                <svg className="w-4 h-4 inline mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                Organization: {entry.organization.name}
                              </p>
                            )}
                          </div>
                        )}
                        {entry.editedBy && entry.editedAt && (
                          <div className="text-xs text-slate-500 mt-2">
                            Edited by {entry.editor?.name || entry.editor?.email} on {new Date(entry.editedAt).toLocaleString()}
                          </div>
                        )}
                        {userId && (
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
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {editingEntry && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Edit Time Entry</h3>
                <form onSubmit={handleUpdateEntry} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Clock In</label>
                    <input
                      type="datetime-local"
                      value={editFormData.clockIn}
                      onChange={(e) => setEditFormData({...editFormData, clockIn: e.target.value})}
                      required
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Clock Out</label>
                    <input
                      type="datetime-local"
                      value={editFormData.clockOut}
                      onChange={(e) => setEditFormData({...editFormData, clockOut: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                    <textarea
                      value={editFormData.description}
                      onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
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