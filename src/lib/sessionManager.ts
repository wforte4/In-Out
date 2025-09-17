'use client'

import { signOut } from 'next-auth/react'

export class SessionManager {
  private warningTimer: NodeJS.Timeout | null = null
  private timeoutTimer: NodeJS.Timeout | null = null
  private warningShown = false
  
  // Session configuration
  private readonly SESSION_TIMEOUT = 8 * 60 * 60 * 1000 // 8 hours
  private readonly WARNING_TIME = 15 * 60 * 1000 // 15 minutes before timeout
  
  constructor() {
    this.setupEventListeners()
    this.resetTimers()
  }
  
  private setupEventListeners() {
    // Reset timers on user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    
    events.forEach(event => {
      document.addEventListener(event, this.resetTimers.bind(this), { passive: true })
    })
    
    // Handle visibility change (tab switching)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.resetTimers()
      }
    })
    
    // Handle beforeunload to cleanup timers
    window.addEventListener('beforeunload', this.cleanup.bind(this))
  }
  
  private resetTimers() {
    this.clearTimers()
    this.warningShown = false
    
    // Set warning timer
    this.warningTimer = setTimeout(() => {
      this.showSessionWarning()
    }, this.SESSION_TIMEOUT - this.WARNING_TIME)
    
    // Set timeout timer
    this.timeoutTimer = setTimeout(() => {
      this.handleSessionTimeout()
    }, this.SESSION_TIMEOUT)
  }
  
  private clearTimers() {
    if (this.warningTimer) {
      clearTimeout(this.warningTimer)
      this.warningTimer = null
    }
    
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer)
      this.timeoutTimer = null
    }
  }
  
  private showSessionWarning() {
    if (this.warningShown) return
    
    this.warningShown = true
    
    const warningDiv = document.createElement('div')
    warningDiv.id = 'session-warning'
    warningDiv.className = `
      fixed top-4 right-4 z-50 bg-yellow-50 border border-yellow-200 rounded-lg shadow-lg p-4 max-w-sm
      animate-in slide-in-from-right duration-300
    `
    warningDiv.innerHTML = `
      <div class="flex items-start">
        <div class="flex-shrink-0">
          <svg class="w-5 h-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-yellow-800">Session Expiring</h3>
          <p class="mt-1 text-xs text-yellow-700">
            Your session will expire in 15 minutes due to inactivity.
          </p>
          <div class="mt-3 flex gap-2">
            <button id="extend-session" class="text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-2 py-1 rounded">
              Stay Logged In
            </button>
            <button id="logout-now" class="text-xs text-yellow-700 hover:text-yellow-900 px-2 py-1">
              Logout
            </button>
          </div>
        </div>
        <button id="close-warning" class="ml-auto flex-shrink-0 text-yellow-400 hover:text-yellow-500">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    `
    
    document.body.appendChild(warningDiv)
    
    // Event listeners for warning dialog
    document.getElementById('extend-session')?.addEventListener('click', () => {
      this.extendSession()
      this.hideSessionWarning()
    })
    
    document.getElementById('logout-now')?.addEventListener('click', () => {
      this.handleSessionTimeout()
    })
    
    document.getElementById('close-warning')?.addEventListener('click', () => {
      this.hideSessionWarning()
    })
  }
  
  private hideSessionWarning() {
    const warningDiv = document.getElementById('session-warning')
    if (warningDiv) {
      warningDiv.remove()
    }
    this.warningShown = false
  }
  
  private extendSession() {
    // Reset timers to extend session
    this.resetTimers()
    
    // Make a request to keep session alive
    fetch('/api/auth/session', { method: 'GET' })
      .then(response => {
        if (response.status === 401) {
          // Session is already expired, handle immediately
          this.handleSessionTimeout()
        }
      })
      .catch(() => {
        // Ignore network errors, session refresh is best effort
      })
  }
  
  private async handleSessionTimeout() {
    this.clearTimers()
    this.hideSessionWarning()
    
    // Show logout message
    const logoutDiv = document.createElement('div')
    logoutDiv.className = `
      fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50
    `
    logoutDiv.innerHTML = `
      <div class="bg-white rounded-lg shadow-xl p-6 max-w-sm mx-4">
        <div class="flex items-center mb-4">
          <svg class="w-6 h-6 text-red-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 class="text-lg font-semibold text-gray-900">Session Expired</h3>
        </div>
        <p class="text-gray-600 mb-4">Your session has expired due to inactivity. Please log in again to continue.</p>
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto"></div>
      </div>
    `
    
    document.body.appendChild(logoutDiv)
    
    // Sign out after a brief delay with redirect set to false to prevent loops
    setTimeout(async () => {
      try {
        await signOut({ redirect: false })
        // Manually redirect to avoid NextAuth redirect loops
        window.location.href = '/auth/signin?expired=true'
      } catch (error) {
        console.error('Error during signOut:', error)
        // Fallback: force redirect
        window.location.href = '/auth/signin?expired=true'
      }
    }, 1500)
  }
  
  cleanup() {
    this.clearTimers()
    this.hideSessionWarning()
    
    // Remove event listeners
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    events.forEach(event => {
      document.removeEventListener(event, this.resetTimers.bind(this))
    })
    
    document.removeEventListener('visibilitychange', this.resetTimers.bind(this))
    window.removeEventListener('beforeunload', this.cleanup.bind(this))
  }
  
  // Public method to check if session is still valid
  isSessionValid(): boolean {
    return this.timeoutTimer !== null
  }
  
  // Public method to get remaining session time
  getRemainingTime(): number {
    if (!this.timeoutTimer) return 0
    
    // This is an approximation since we don't have the exact start time
    return Math.max(0, this.SESSION_TIMEOUT)
  }
  
  // Public method to trigger session timeout manually (called by HTTP client on 401)
  triggerSessionTimeout(): void {
    if (!this.isSessionValid()) return // Already handled
    this.handleSessionTimeout()
  }
}

// Global session manager instance
let sessionManager: SessionManager | null = null

export function initializeSessionManager(): SessionManager {
  if (typeof window === 'undefined') return {} as SessionManager
  
  if (!sessionManager) {
    sessionManager = new SessionManager()
  }
  
  return sessionManager
}

export function getSessionManager(): SessionManager | null {
  return sessionManager
}

export function cleanupSessionManager(): void {
  if (sessionManager) {
    sessionManager.cleanup()
    sessionManager = null
  }
}