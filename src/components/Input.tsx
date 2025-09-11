'use client'

import React from 'react'

export interface InputProps {
  label?: string
  type?: 'text' | 'number' | 'email' | 'password' | 'tel' | 'url'
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
  step?: string
  min?: string
  max?: string
  id?: string
  name?: string
}

const Input: React.FC<InputProps> = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  className = '',
  step,
  min,
  max,
  id,
  name
}) => {
  return (
    <div className={`${className}`}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-2" htmlFor={id}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
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
        step={step}
        min={min}
        max={max}
        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white/80 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>
  )
}

export default Input