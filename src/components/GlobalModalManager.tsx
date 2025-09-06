'use client'

import React, { useEffect } from 'react'
import { useAppSelector } from '../store/hooks'
import { useModal } from '../hooks/useModal'

const GlobalModalManager: React.FC = () => {
  const modals = useAppSelector((state) => state.modal.modals)
  const modal = useModal()

  useEffect(() => {
    // Handle escape key to close modals
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && modals.length > 0) {
        const topModal = modals[modals.length - 1]
        if (topModal.backdropClick === 'close') {
          if (topModal.onClose) {
            topModal.onClose()
          }
          modal.hide(topModal.id)
        }
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [modals, modal])

  useEffect(() => {
    // Prevent body scroll when modals are open
    if (modals.length > 0) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [modals.length])

  if (modals.length === 0) return null

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4'
  }

  return (
    <>
      {modals.map((modalConfig, index) => {
        const Component = modalConfig.component
        const zIndex = 50 + index // Ensure stacking

        const handleBackdropClick = () => {
          if (modalConfig.backdropClick === 'close') {
            if (modalConfig.onClose) {
              modalConfig.onClose()
            }
            modal.hide(modalConfig.id)
          }
        }

        return (
          <div
            key={modalConfig.id}
            className="fixed inset-0 flex items-center justify-center p-4"
            style={{ zIndex }}
          >
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-all duration-300"
              onClick={handleBackdropClick}
            />
            
            {/* Modal Content */}
            <div
              className={`relative bg-white rounded-2xl shadow-xl ${sizeClasses[modalConfig.size!]} w-full max-h-[90vh] overflow-y-auto overflow-x-visible`}
              onClick={(e) => e.stopPropagation()}
            >
              <Component
                {...modalConfig.props}
                onClose={() => {
                  if (modalConfig.onClose) {
                    modalConfig.onClose()
                  }
                  modal.hide(modalConfig.id)
                }}
              />
            </div>
          </div>
        )
      })}
    </>
  )
}

export default GlobalModalManager