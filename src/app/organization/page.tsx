'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthenticatedLayout from '../../components/AuthenticatedLayout'
import CustomDropdown from '../../components/CustomDropdown'

interface User {
  id: string
  name: string | null
  email: string
}

interface Membership {
  id: string
  role: string
  joinedAt: string
  user: User
}

interface Organization {
  id: string
  name: string
  code: string
  userRole: string
  isAdmin: boolean
  memberships: Membership[]
}

export default function Organization() {
  const router = useRouter()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrgId, setSelectedOrgId] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrganizations()
  }, [])

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


  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0 flex items-center justify-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg animate-pulse"></div>
              <span className="text-slate-600 font-medium">Loading organizations...</span>
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
            <h1 className="text-3xl font-bold text-slate-900">Organization Management</h1>
            <p className="text-slate-600 mt-2">Manage your teams and view member activities</p>
          </div>

          {organizations.length === 0 ? (
            <div className="bg-white/70 backdrop-blur-sm shadow-xl rounded-3xl border border-slate-200/50 overflow-hidden">
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gradient-to-br from-slate-400 to-slate-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
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
                </div>
              )}

              {selectedOrg && (
                <div className="bg-white/70 backdrop-blur-sm shadow-xl rounded-3xl border border-slate-200/50 overflow-hidden">
                  <div className="px-8 py-8 border-b border-slate-200/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-slate-900">
                            {selectedOrg.name}
                          </h3>
                          <div className="flex items-center space-x-4 mt-1">
                            <div className="inline-flex items-center px-2 py-1 rounded-lg bg-slate-100">
                              <svg className="w-3 h-3 text-slate-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                              </svg>
                              <span className="text-xs font-semibold text-slate-600">Code: {selectedOrg.code}</span>
                            </div>
                            <div className={`inline-flex items-center px-2 py-1 rounded-lg ${
                              selectedOrg.userRole === 'ADMIN' 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              <span className="text-xs font-semibold">{selectedOrg.userRole}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="px-8 py-8">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-xl font-bold text-slate-900">Team Members</h4>
                      <div className="inline-flex items-center px-3 py-1 rounded-xl bg-slate-100">
                        <svg className="w-4 h-4 text-slate-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span className="text-sm font-semibold text-slate-700">{selectedOrg.memberships.length} members</span>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {selectedOrg.memberships.map((membership) => (
                        <div key={membership.id} className="bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-2xl p-6 border border-slate-200/50 hover:shadow-lg transition-all duration-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold text-lg">
                                  {(membership.user.name || membership.user.email).charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <div className="text-lg font-bold text-slate-900">
                                  {membership.user.name || 'No name'}
                                </div>
                                <div className="text-sm text-slate-600">{membership.user.email}</div>
                                <div className="flex items-center space-x-2 mt-1">
                                  <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-lg ${
                                    membership.role === 'ADMIN' 
                                      ? 'bg-purple-100 text-purple-800' 
                                      : 'bg-green-100 text-green-800'
                                  }`}>
                                    {membership.role}
                                  </span>
                                  <span className="text-xs text-slate-500">
                                    Joined {new Date(membership.joinedAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {selectedOrg.isAdmin && (
                              <button
                                onClick={() => router.push(`/timesheet?userId=${membership.user.id}`)}
                                className="inline-flex items-center px-4 py-2 text-sm font-semibold text-purple-600 hover:text-white bg-purple-100 hover:bg-purple-600 rounded-xl transition-all duration-200 border border-purple-200 hover:border-purple-600 cursor-pointer"
                              >
                                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                View Timesheet
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
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