'use client'

import { useEffect, useState, useCallback } from 'react'
import AuthenticatedLayout from '../../components/AuthenticatedLayout'
import SearchableSelect from '../../components/SearchableSelect'
import Snackbar from '../../components/Snackbar'

interface User {
  id: string
  name: string | null
  email: string
}

interface Organization {
  name: string
}

interface Invitation {
  id: string
  email: string
  role: string
  status: string
  token: string
  expiresAt: string
  createdAt: string
  organization: Organization
  inviter: User
}

interface OrganizationWithAdmin {
  id: string
  name: string
  code: string
  userRole: string
  isAdmin: boolean
}

export default function Invitations() {
  const [organizations, setOrganizations] = useState<OrganizationWithAdmin[]>([])
  const [selectedOrgId, setSelectedOrgId] = useState<string>('')
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    role: 'EMPLOYEE'
  })
  const [snackbar, setSnackbar] = useState<{
    show: boolean
    message: string
    type: 'success' | 'error' | 'info'
  }>({ show: false, message: '', type: 'success' })

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/organization/members')
      const data = await response.json()
      const adminOrgs = data.organizations?.filter((org: OrganizationWithAdmin) => org.isAdmin) || []
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

  const fetchInvitations = useCallback(async () => {
    try {
      const response = await fetch(`/api/invitations?organizationId=${selectedOrgId}`)
      const data = await response.json()
      setInvitations(data.invitations || [])
    } catch (error) {
      console.error('Error fetching invitations:', error)
    }
  }, [selectedOrgId])

  useEffect(() => {
    fetchOrganizations()
  }, [])

  useEffect(() => {
    if (selectedOrgId) {
      fetchInvitations()
    }
  }, [selectedOrgId, fetchInvitations])

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          organizationId: selectedOrgId
        })
      })
      
      if (response.ok) {
        setFormData({ email: '', role: 'EMPLOYEE' })
        setShowInviteForm(false)
        fetchInvitations()
        setSnackbar({ show: true, message: 'Invitation sent successfully!', type: 'success' })
      } else {
        const errorData = await response.json()
        setSnackbar({ show: true, message: errorData.error || 'Failed to send invitation', type: 'error' })
      }
    } catch (error) {
      console.error('Error sending invitation:', error)
      setSnackbar({ show: true, message: 'Failed to send invitation', type: 'error' })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'ACCEPTED': return 'bg-green-100 text-green-800'
      case 'EXPIRED': return 'bg-red-100 text-red-800'
      case 'CANCELLED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const copyInvitationLink = (invitation: Invitation) => {
    const baseUrl = window.location.origin
    const inviteUrl = `${baseUrl}/auth/signup?invitation=${invitation.token}`
    navigator.clipboard.writeText(inviteUrl)
    setSnackbar({ show: true, message: 'Invitation link copied to clipboard!', type: 'info' })
  }

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0 flex items-center justify-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg animate-pulse"></div>
              <span className="text-slate-600 font-medium">Loading invitations...</span>
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
            <h1 className="text-3xl font-bold text-slate-900">Team Invitations</h1>
            <p className="text-slate-600 mt-2">Invite new members to your organization</p>
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
                <p className="text-slate-500">You need admin access to manage invitations</p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {organizations.length > 1 && (
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-6">
                  <SearchableSelect
                    options={organizations.map(org => ({ value: org.id, label: org.name }))}
                    value={selectedOrgId}
                    onChange={setSelectedOrgId}
                    label="Select Organization"
                    placeholder="Search organizations..."
                  />
                </div>
              )}

              {selectedOrg && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-slate-900">{selectedOrg.name} Invitations</h2>
                    <button
                      onClick={() => setShowInviteForm(true)}
                      className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-xl hover:bg-purple-700 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Invite Member
                    </button>
                  </div>

                  {showInviteForm && (
                    <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-6">
                      <h3 className="text-lg font-semibold text-slate-900 mb-4">Send Invitation</h3>
                      <form onSubmit={handleSendInvitation} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            required
                            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="user@example.com"
                          />
                        </div>
                        <div>
                          <SearchableSelect
                            options={[
                              { value: 'EMPLOYEE', label: 'Employee' },
                              { value: 'ADMIN', label: 'Admin' }
                            ]}
                            value={formData.role}
                            onChange={(role) => setFormData({...formData, role})}
                            label="Role"
                            placeholder="Select role..."
                          />
                        </div>
                        <div className="flex space-x-4">
                          <button
                            type="submit"
                            className="px-6 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
                          >
                            Send Invitation
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowInviteForm(false)}
                            className="px-6 py-2 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  <div className="bg-white/70 backdrop-blur-sm shadow-xl rounded-3xl border border-slate-200/50 overflow-hidden">
                    <div className="px-8 py-6 border-b border-slate-200/50">
                      <h3 className="text-xl font-bold text-slate-900">Invitation History</h3>
                    </div>
                    <div className="px-8 py-6">
                      {invitations.length === 0 ? (
                        <p className="text-slate-500 text-center py-8">No invitations sent yet</p>
                      ) : (
                        <div className="space-y-4">
                          {invitations.map((invitation) => (
                            <div key={invitation.id} className="bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-2xl p-6 border border-slate-200/50">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="flex items-center space-x-3">
                                    <h4 className="font-semibold text-slate-900">{invitation.email}</h4>
                                    <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-lg ${getStatusColor(invitation.status)}`}>
                                      {invitation.status}
                                    </span>
                                    <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-lg ${
                                      invitation.role === 'ADMIN' 
                                        ? 'bg-purple-100 text-purple-800' 
                                        : 'bg-green-100 text-green-800'
                                    }`}>
                                      {invitation.role}
                                    </span>
                                  </div>
                                  <div className="text-sm text-slate-600 mt-1">
                                    Invited by {invitation.inviter.name || invitation.inviter.email} on {new Date(invitation.createdAt).toLocaleDateString()}
                                  </div>
                                  <div className="text-sm text-slate-500">
                                    Expires: {new Date(invitation.expiresAt).toLocaleDateString()}
                                  </div>
                                </div>
                                {invitation.status === 'PENDING' && (
                                  <button
                                    onClick={() => copyInvitationLink(invitation)}
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
                                  >
                                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    Copy Link
                                  </button>
                                )}
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

      <Snackbar
        message={snackbar.message}
        type={snackbar.type}
        show={snackbar.show}
        onClose={() => setSnackbar({ ...snackbar, show: false })}
      />
    </AuthenticatedLayout>
  )
}