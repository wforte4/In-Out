'use client'

import React from 'react'

export interface IconButtonProps {
  children: React.ReactNode
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const IconButton: React.FC<IconButtonProps> = ({
  children,
  onClick,
  type = 'button',
  disabled = false,
  className = '',
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3'
  }

  const baseClasses = 'inline-flex items-center justify-center rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed'

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </button>
  )
}

export default IconButton