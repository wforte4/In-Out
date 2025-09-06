'use client'

import React from 'react'

export interface TextInputProps {
  id?: string
  name?: string
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'datetime-local'
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  label?: string
  required?: boolean
  disabled?: boolean
  error?: string
  helperText?: string
  icon?: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  className?: string
}

const TextInput: React.FC<TextInputProps> = ({
  id,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  label,
  required = false,
  disabled = false,
  error,
  helperText,
  icon,
  size = 'md',
  fullWidth = true,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-4 py-3 text-lg'
  }

  const baseInputClasses = 'border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200 bg-white/80'
  const iconPaddingClass = icon ? 'pl-10' : ''
  const widthClass = fullWidth ? 'w-full' : ''
  const errorClass = error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''
  const disabledClass = disabled ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      {helperText && !error && (
        <p className="text-sm text-slate-600">{helperText}</p>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-slate-400">{icon}</span>
          </div>
        )}
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`${baseInputClasses} ${sizeClasses[size]} ${iconPaddingClass} ${widthClass} ${errorClass} ${disabledClass}`}
        />
      </div>
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}

export default TextInput