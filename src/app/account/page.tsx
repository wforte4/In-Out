'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import AuthenticatedLayout from '../../components/AuthenticatedLayout'
import PasswordInput from '../../components/PasswordInput'
import ProfileImageUpload from '../../components/ProfileImageUpload'
import Button from '../../components/Button'
import TextInput from '../../components/TextInput'
import SectionCard from '../../components/SectionCard'
import { useSnackbar } from '../../hooks/useSnackbar'

export default function Account() {
  const { data: session, update: updateSession } = useSession()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const snackbar = useSnackbar()

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || '')
      setEmail(session.user.email || '')
    }
  }, [session])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        snackbar.error(data.error || 'Failed to update profile')
      } else {
        snackbar.success('Profile updated successfully!')
        // Update the session with fresh data
        await updateSession()
      }
    } catch {
      snackbar.error('An error occurred. Please try again.')
    }

    setLoading(false)
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (newPassword !== confirmPassword) {
      snackbar.error('New passwords do not match')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/user/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        snackbar.error(data.error || 'Failed to change password')
      } else {
        snackbar.success('Password changed successfully!')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch {
      snackbar.error('An error occurred. Please try again.')
    }

    setLoading(false)
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-4xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">My Account</h1>
            <p className="text-slate-600 mt-2">Manage your profile and account settings</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Profile Information */}
            <SectionCard
              title="Profile Information"
              description="Update your personal details and photo"
              iconColorScheme="purple"
              icon={
                <ProfileImageUpload 
                  currentImage={session?.user?.image}
                  size="sm"
                  onNotification={(message, type) => {
                    if (type === 'success') snackbar.success(message)
                    else if (type === 'error') snackbar.error(message)
                    else snackbar.info(message)
                  }}
                />
              }
            >
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <TextInput
                  id="name"
                  name="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  label="Full Name"
                  placeholder="John Doe"
                  required
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  }
                />

                <TextInput
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  label="Email Address"
                  placeholder="your@email.com"
                  required
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  }
                />

                <Button
                  type="submit"
                  disabled={loading}
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={loading}
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  }
                >
                  Update Profile
                </Button>
              </form>
            </SectionCard>

            {/* Change Password */}
            <SectionCard
              title="Change Password"
              description="Update your account password"
              iconColorScheme="red"
              icon={
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              }
            >
              <form onSubmit={handleChangePassword} className="space-y-6">
                <PasswordInput
                  id="currentPassword"
                  name="currentPassword"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  label="Current Password"
                  required
                />

                <PasswordInput
                  id="newPassword"
                  name="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  label="New Password"
                  required
                />

                <PasswordInput
                  id="confirmPassword"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  label="Confirm New Password"
                  required
                />

                <Button
                  type="submit"
                  disabled={loading}
                  variant="danger"
                  size="lg"
                  fullWidth
                  loading={loading}
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  }
                >
                  Change Password
                </Button>
              </form>
            </SectionCard>
          </div>

        </div>
      </div>

    </AuthenticatedLayout>
  )
}