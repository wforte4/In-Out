'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import PasswordInput from '../../../components/PasswordInput'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [needsVerification, setNeedsVerification] = useState(false)
  const [resendingVerification, setResendingVerification] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setNeedsVerification(false)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        if (result.error === 'EMAIL_NOT_VERIFIED') {
          setNeedsVerification(true)
          setError('Please verify your email address before signing in. Check your email for a verification link.')
        } else {
          setError('Invalid credentials')
        }
      } else {
        // Check if user is admin of any organization
        try {
          const adminResponse = await fetch('/api/admin/dashboard', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          })
          
          if (adminResponse.ok) {
            const adminData = await adminResponse.json()
            if (adminData.organizations && adminData.organizations.length > 0) {
              // User is admin, redirect to admin dashboard
              router.push('/admin')
            } else {
              // User is not admin, redirect to clock in page
              router.push('/dashboard')
            }
          } else {
            // Fallback to regular dashboard if admin check fails
            router.push('/dashboard')
          }
        } catch {
          // Fallback to regular dashboard if admin check fails
          router.push('/dashboard')
        }
      }
    } catch {
      setError('An error occurred. Please try again.')
    }

    setLoading(false)
  }

  const handleResendVerification = async () => {
    if (!email) {
      setError('Please enter your email address first')
      return
    }

    setResendingVerification(true)
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (response.ok) {
        setError('')
        setNeedsVerification(false)
        // Show success message
        setError('Verification email sent! Please check your email.')
      } else {
        setError(data.error || 'Failed to send verification email')
      }
    } catch (error) {
      console.error('Resend verification error:', error)
      setError('Failed to send verification email')
    }
    setResendingVerification(false)
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
                Welcome back
              </h2>
              <p className="text-slate-600">Sign in to In&Out</p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                    Email address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white/80 text-slate-900"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>
                
                <PasswordInput
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  label="Password"
                  required
                />
              </div>

              {error && (
                <div className={`border rounded-xl p-4 ${
                  error.includes('sent') ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-start">
                    <svg className={`w-5 h-5 mr-2 flex-shrink-0 mt-0.5 ${
                      error.includes('sent') ? 'text-green-500' : 'text-red-500'
                    }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {error.includes('sent') ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      )}
                    </svg>
                    <div className="flex-1">
                      <span className={`text-sm font-medium ${
                        error.includes('sent') ? 'text-green-700' : 'text-red-700'
                      }`}>{error}</span>
                      {needsVerification && (
                        <div className="mt-3">
                          <button
                            onClick={handleResendVerification}
                            disabled={resendingVerification}
                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-orange-700 bg-orange-100 hover:bg-orange-200 rounded-lg border border-orange-200 hover:border-orange-300 transition-all duration-200 disabled:opacity-50"
                          >
                            {resendingVerification ? (
                              <>
                                <svg className="animate-spin -ml-0.5 mr-1.5 h-3 w-3 text-orange-700" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Sending...
                              </>
                            ) : (
                              <>
                                <svg className="w-3 h-3 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                Resend Verification Email
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
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
                    Signing in...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Sign In
                  </>
                )}
              </button>

              <div className="text-center pt-4 space-y-3">
                <div>
                  <Link 
                    href="/auth/forgot-password" 
                    className="text-slate-600 hover:text-purple-600 text-sm font-medium transition-colors duration-200"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <div>
                  <Link 
                    href="/auth/signup" 
                    className="inline-flex items-center text-purple-600 hover:text-purple-700 font-medium transition-colors duration-200"
                  >
                    Don&apos;t have an account? 
                    <span className="ml-1 font-semibold">Sign up</span>
                    <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}