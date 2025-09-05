'use client'

import React, { useEffect } from 'react'
import { useAppSelector, useAppDispatch } from '../store/hooks'
import { hideSnackbar } from '../store/slices/snackbarSlice'

export default function GlobalSnackbar() {
  const { show, message, type, duration } = useAppSelector((state) => state.snackbar)
  const dispatch = useAppDispatch()

  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        dispatch(hideSnackbar())
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [show, duration, dispatch])

  if (!show) return null

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-gradient-to-r from-green-500 to-emerald-600'
      case 'error':
        return 'bg-gradient-to-r from-red-500 to-pink-600'
      case 'warning':
        return 'bg-gradient-to-r from-amber-500 to-orange-600'
      case 'info':
      default:
        return 'bg-gradient-to-r from-blue-500 to-indigo-600'
    }
  }

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )
      case 'error':
        return (
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )
      case 'warning':
        return (
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        )
      case 'info':
      default:
        return (
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
      <div className={`${getBackgroundColor()} text-white px-6 py-4 rounded-2xl shadow-xl border border-white/20 backdrop-blur-sm max-w-md`}>
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="flex-1">
            <p className="font-medium text-white">{message}</p>
          </div>
          <button
            onClick={() => dispatch(hideSnackbar())}
            className="flex-shrink-0 ml-4 p-1 rounded-lg hover:bg-white/20 transition-colors duration-200"
          >
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}