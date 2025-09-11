'use client'

import React from 'react'
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import Button from '../Button'

interface ConfirmationModalProps {
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  loading?: boolean
}

export default function ConfirmationModal({
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false
}: ConfirmationModalProps) {

  const variantStyles = {
    danger: {
      icon: 'text-red-600',
      header: 'text-red-900',
      button: 'danger' as const
    },
    warning: {
      icon: 'text-yellow-600',
      header: 'text-yellow-900', 
      button: 'warning' as const
    },
    info: {
      icon: 'text-blue-600',
      header: 'text-blue-900',
      button: 'primary' as const
    }
  }

  const styles = variantStyles[variant]

  return (
    <>
      <div className="flex items-center justify-between p-6 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            variant === 'danger' ? 'bg-red-100' : 
            variant === 'warning' ? 'bg-yellow-100' : 'bg-blue-100'
          }`}>
            <ExclamationTriangleIcon className={`w-5 h-5 ${styles.icon}`} />
          </div>
          <h3 className={`text-xl font-bold ${styles.header}`}>
            {title}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 transition-colors"
          disabled={loading}
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
      </div>
      
      <div className="p-6">
        <p className="text-slate-700 leading-relaxed">
          {message}
        </p>
      </div>

      <div className="flex items-center justify-end space-x-3 p-6 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
        <Button
          onClick={onClose}
          variant="secondary"
          disabled={loading}
        >
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          variant={styles.button}
          loading={loading}
          disabled={loading}
        >
          {confirmText}
        </Button>
      </div>
    </>
  )
}