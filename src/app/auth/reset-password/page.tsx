'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import PasswordInput from '../../../components/PasswordInput'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

function ResetPasswordContent() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const resetToken = searchParams.get('token')
    if (!resetToken) {
      setError('Invalid reset link. Please request a new password reset.')
    } else {
      setToken(resetToken)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        // Redirect to sign in after 3 seconds
        setTimeout(() => {
          router.push('/auth/signin')
        }, 3000)
      } else {
        setError(data.error || 'An error occurred')
      }
    } catch {
      setError('An error occurred. Please try again.')
    }

    setLoading(false)
  }

  if (!token && !error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg animate-pulse"></div>
          <span className="text-white font-medium">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-900/20 to-black/20"></div>
      <div className="relative w-full max-w-md mx-4">
        <div className="bg-white/90 backdrop-blur-sm shadow-2xl rounded-3xl border border-slate-200/50 overflow-hidden">
          <div className="px-8 py-10">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center mb-4">
                <Image 
                  src="/logo_simple.png" 
                  alt="In&Out Logo" 
                  width={64} 
                  height={64}
                  className="object-contain"
                />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">
                Reset Your Password
              </h2>
              <p className="text-slate-600">
                Enter your new password below
              </p>
            </div>

            {success ? (
              <div className="text-center">
                <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
                  <div className="flex flex-col items-center">
                    <svg className="w-12 h-12 text-green-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-green-700 font-medium mb-2">Password Reset Successfully!</p>
                    <p className="text-green-600 text-sm text-center">You will be redirected to sign in shortly...</p>
                  </div>
                </div>
                
                <Link 
                  href="/auth/signin" 
                  className="inline-flex items-center text-purple-600 hover:text-purple-700 font-medium transition-colors duration-200"
                >
                  <ArrowLeftIcon className="w-4 h-4 mr-1" />
                  Go to Sign In
                </Link>
              </div>
            ) : error && !token ? (
              <div className="text-center">
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
                  <div className="flex flex-col items-center">
                    <svg className="w-12 h-12 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-red-700 font-medium mb-2">Invalid Reset Link</p>
                    <p className="text-red-600 text-sm text-center">{error}</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Link 
                    href="/auth/forgot-password" 
                    className="block w-full text-center bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-xl transition-colors duration-200"
                  >
                    Request New Reset Link
                  </Link>
                  <Link 
                    href="/auth/signin" 
                    className="inline-flex items-center text-purple-600 hover:text-purple-700 font-medium transition-colors duration-200"
                  >
                    <ArrowLeftIcon className="w-4 h-4 mr-1" />
                    Back to Sign In
                  </Link>
                </div>
              </div>
            ) : (
              <form className="space-y-6" onSubmit={handleSubmit}>
                <PasswordInput
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-red-700 text-sm font-medium">{error}</span>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full group relative inline-flex items-center justify-center px-6 py-3 text-lg font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Resetting Password...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Reset Password
                    </>
                  )}
                </button>

                <div className="text-center pt-4">
                  <Link 
                    href="/auth/signin" 
                    className="inline-flex items-center text-purple-600 hover:text-purple-700 font-medium transition-colors duration-200"
                  >
                    <ArrowLeftIcon className="w-4 h-4 mr-1" />
                    Back to Sign In
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ResetPassword() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg animate-pulse"></div>
          <span className="text-white font-medium">Loading...</span>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}