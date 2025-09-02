'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthenticatedLayout from '../../components/AuthenticatedLayout'

interface TimeEntry {
  id: string
  clockIn: string
  clockOut: string | null
  totalHours: number | null
  description: string | null
}

export default function Dashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null)
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    fetchActiveEntry()
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const fetchActiveEntry = async () => {
    try {
      const response = await fetch('/api/time/clock')
      const data = await response.json()
      setActiveEntry(data.activeEntry)
    } catch (error) {
      console.error('Error fetching active entry:', error)
    }
  }

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
          description: action === 'in' ? description : undefined
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error)
      } else {
        setDescription('')
        fetchActiveEntry()
      }
    } catch (error) {
      alert('An error occurred')
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

  const calculateCurrentHours = () => {
    if (!activeEntry) return 0
    const clockIn = new Date(activeEntry.clockIn)
    const now = new Date()
    return Math.round(((now.getTime() - clockIn.getTime()) / (1000 * 60 * 60)) * 100) / 100
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
                      <div className="relative bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200/50 rounded-2xl p-6">
                        <div className="absolute top-4 right-4">
                          <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                        </div>
                        <div className="flex items-start space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-bold text-emerald-900 mb-2">Currently Clocked In</h4>
                            <div className="space-y-1">
                              <p className="text-emerald-800">
                                <span className="font-medium">Started:</span> {new Date(activeEntry.clockIn).toLocaleTimeString()}
                              </p>
                              <p className="text-emerald-800">
                                <span className="font-medium">Hours worked:</span> {calculateCurrentHours()}
                              </p>
                              {activeEntry.description && (
                                <p className="text-emerald-800">
                                  <span className="font-medium">Working on:</span> {activeEntry.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleClock('out')}
                        disabled={loading}
                        className="w-full group relative inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white transition-all duration-200 bg-gradient-to-r from-red-600 to-rose-600 rounded-2xl hover:from-red-700 hover:to-rose-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 cursor-pointer"
                      >
                        <svg className="w-6 h-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {loading ? 'Clocking out...' : 'Clock Out'}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label htmlFor="description" className="block text-lg font-semibold text-slate-800">
                          What are you working on today?
                        </label>
                        <p className="text-sm text-slate-600">Optional: Add a description to track your tasks</p>
                        <input
                          id="description"
                          type="text"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Frontend development, Bug fixes, Client meeting..."
                          className="block w-full px-4 py-3 text-lg border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200 bg-white/80"
                        />
                      </div>

                      <button
                        onClick={() => handleClock('in')}
                        disabled={loading}
                        className="w-full group relative inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white transition-all duration-200 bg-gradient-to-r from-emerald-600 to-green-600 rounded-2xl hover:from-emerald-700 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 cursor-pointer"
                      >
                        <svg className="w-6 h-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {loading ? 'Clocking in...' : 'Clock In'}
                      </button>
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
                  <button
                    onClick={() => router.push('/timesheet')}
                    className="w-full group relative p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/50 rounded-2xl hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform hover:-translate-y-1 hover:shadow-lg cursor-pointer"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 text-left">
                        <div className="text-lg font-bold text-slate-900 group-hover:text-blue-900 transition-colors">View Timesheet</div>
                        <div className="text-slate-600 group-hover:text-blue-700 transition-colors">Review your time entries and total hours</div>
                      </div>
                      <svg className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => router.push('/organization')}
                    className="w-full group relative p-6 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200/50 rounded-2xl hover:from-purple-100 hover:to-pink-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transform hover:-translate-y-1 hover:shadow-lg cursor-pointer"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div className="flex-1 text-left">
                        <div className="text-lg font-bold text-slate-900 group-hover:text-purple-900 transition-colors">Organization</div>
                        <div className="text-slate-600 group-hover:text-purple-700 transition-colors">Manage your team and settings</div>
                      </div>
                      <svg className="w-5 h-5 text-slate-400 group-hover:text-purple-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}