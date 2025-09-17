'use client'

import { signOut } from 'next-auth/react'
import { getSessionManager } from './sessionManager'

// Global flag to prevent multiple concurrent redirects
let isRedirecting = false

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  status: number
}

class HttpClient {
  private baseURL: string

  constructor(baseURL = '') {
    this.baseURL = baseURL
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const isJson = response.headers.get('content-type')?.includes('application/json')
    const data = isJson ? await response.json() : await response.text()

    // Handle 401 Unauthorized responses
    if (response.status === 401) {
      this.handleUnauthorized()
      return {
        success: false,
        error: 'Session expired. Please log in again.',
        status: response.status
      }
    }

    if (!response.ok) {
      return {
        success: false,
        error: data?.error || data?.message || `HTTP ${response.status}`,
        status: response.status
      }
    }

    return {
      success: true,
      data: data,
      status: response.status
    }
  }

  private handleUnauthorized() {
    // Prevent multiple concurrent redirects
    if (isRedirecting) return
    isRedirecting = true

    // Notify session manager to handle cleanup and show appropriate UI
    const sessionManager = getSessionManager()
    if (sessionManager) {
      sessionManager.triggerSessionTimeout()
    } else {
      // Fallback if session manager isn't available
      this.showSessionExpiredNotification()
      
      // Sign out and redirect to login after a brief delay
      setTimeout(async () => {
        try {
          await signOut({ redirect: false })
        } catch (error) {
          console.error('Error during signOut:', error)
        } finally {
          // Redirect to login with expired flag
          window.location.href = '/auth/signin?expired=true'
        }
      }, 2000)
    }
  }

  private showSessionExpiredNotification() {
    // Remove any existing notification
    const existingNotification = document.getElementById('session-expired-notification')
    if (existingNotification) {
      existingNotification.remove()
    }

    // Create and show session expired notification
    const notification = document.createElement('div')
    notification.id = 'session-expired-notification'
    notification.className = `
      fixed top-4 right-4 z-50 bg-red-50 border border-red-200 rounded-lg shadow-lg p-4 max-w-sm
      animate-in slide-in-from-right duration-300
    `
    notification.innerHTML = `
      <div class="flex items-start">
        <div class="flex-shrink-0">
          <svg class="w-5 h-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">Session Expired</h3>
          <p class="mt-1 text-xs text-red-700">
            Your session has expired. Redirecting to login...
          </p>
        </div>
      </div>
    `

    document.body.appendChild(notification)

    // Auto-remove notification after redirect
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove()
      }
    }, 3000)
  }

  async get<T = unknown>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseURL}${url}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    return this.handleResponse<T>(response)
  }

  async post<T = unknown>(url: string, body?: unknown, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseURL}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    })

    return this.handleResponse<T>(response)
  }

  async put<T = unknown>(url: string, body?: unknown, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseURL}${url}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    })

    return this.handleResponse<T>(response)
  }

  async patch<T = unknown>(url: string, body?: unknown, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseURL}${url}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    })

    return this.handleResponse<T>(response)
  }

  async delete<T = unknown>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseURL}${url}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    return this.handleResponse<T>(response)
  }
}

// Export a singleton instance
export const httpClient = new HttpClient()

// Export the HttpClient class for custom instances if needed
export { HttpClient }