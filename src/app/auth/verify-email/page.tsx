'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
// import { signIn } from 'next-auth/react' // Currently unused
import Link from 'next/link'
import Image from 'next/image'

function VerifyEmailContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [isResending, setIsResending] = useState(false)
  const [canResend, setCanResend] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const token = searchParams.get('token')
    if (token) {
      verifyEmail(token)
    } else {
      setStatus('error')
      setMessage('No verification token provided')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const verifyEmail = async (token: string) => {
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      })

      const data = await response.json()

      if (response.ok) {
        setStatus('success')
        setMessage('Your email has been verified successfully!')
        // Auto-redirect to sign in after 3 seconds
        setTimeout(() => {
          router.push('/auth/signin?message=Email verified. Please sign in.')
        }, 3000)
      } else {
        if (data.error.includes('expired')) {
          setStatus('expired')
          setCanResend(true)
        } else {
          setStatus('error')
        }
        setMessage(data.error)
      }
    } catch (error) {
      console.error('Verification error:', error)
      setStatus('error')
      setMessage('An error occurred during verification')
    }
  }

  const handleResendVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsResending(true)
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (response.ok) {
        setStatus('success')
        setMessage('A new verification email has been sent to your email address.')
        setCanResend(false)
      } else {
        setMessage(data.error)
      }
    } catch (error) {
      console.error('Resend error:', error)
      setMessage('Failed to resend verification email')
    }
    setIsResending(false)
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )
      case 'success':
        return (
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )
      case 'expired':
        return (
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )
      default:
        return (
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )
    }
  }

  const getStatusTitle = () => {
    switch (status) {
      case 'loading':
        return 'Verifying Email...'
      case 'success':
        return 'Email Verified!'
      case 'expired':
        return 'Link Expired'
      default:
        return 'Verification Failed'
    }
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
            </div>

            <div className="text-center">
              {getStatusIcon()}
              
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                {getStatusTitle()}
              </h2>
              
              <p className={`text-lg mb-8 ${
                status === 'success' ? 'text-green-700' : 
                status === 'error' ? 'text-red-700' : 
                status === 'expired' ? 'text-orange-700' :
                'text-slate-600'
              }`}>
                {message}
              </p>

              {status === 'success' && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                  <p className="text-green-800 text-sm">
                    Redirecting you to sign in in a few seconds...
                  </p>
                </div>
              )}

              {status === 'expired' && canResend && (
                <form onSubmit={handleResendVerification} className="space-y-4 mb-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                      Enter your email to get a new verification link
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isResending}
                    className="w-full inline-flex items-center justify-center px-6 py-3 text-lg font-semibold text-white bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl hover:from-orange-600 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                  >
                    {isResending ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Send New Link
                      </>
                    )}
                  </button>
                </form>
              )}

              <div className="flex flex-col space-y-3">
                {status === 'success' && (
                  <Link 
                    href="/auth/signin"
                    className="inline-flex items-center justify-center px-6 py-3 text-lg font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Sign In Now
                  </Link>
                )}
                
                <Link 
                  href="/" 
                  className="inline-flex items-center justify-center text-slate-600 hover:text-purple-700 font-medium transition-colors duration-200"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmail() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg animate-pulse"></div>
          <span className="text-white font-medium">Loading...</span>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}