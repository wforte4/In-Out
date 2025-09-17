'use client'

import { useState, Fragment, useRef, useEffect } from 'react'
import { Transition } from '@headlessui/react'

interface Option {
  value: string
  label: string
}

interface SearchableSelectProps {
  options: Option[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  className?: string
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  label,
  className = "",
  disabled = false,
  size = 'md'
}: SearchableSelectProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const filteredOptions = 
    query === ''
      ? options
      : options.filter((option) =>
          option.label
            .toLowerCase()
            .replace(/\s+/g, '')
            .includes(query.toLowerCase().replace(/\s+/g, ''))
        )

  const selectedOption = options.find(option => option.value === value)
  const isEmptySelection = !value || value === '' || 
    selectedOption?.label?.includes('No specific') || 
    selectedOption?.label?.includes('All team') ||
    selectedOption?.label?.includes('No name') ||
    selectedOption?.label?.includes('Choose')

  // Size classes to match TextInput
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-4 py-3 text-lg'
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setQuery('')
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 0)
    }
  }, [isOpen])

  const handleToggle = () => {
    if (disabled) return
    setIsOpen(!isOpen)
  }

  const handleOptionSelect = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
    setQuery('')
  }

  return (
    <div className={className} ref={containerRef}>
      {label && (
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        {/* Selected Value Display */}
        <button
          type="button"
          onClick={handleToggle}
          disabled={disabled}
          className={`relative w-full cursor-pointer rounded-xl bg-white/80 text-left shadow-sm border border-slate-300 transition-colors duration-200 pr-10 ${sizeClasses[size]} ${
            disabled 
              ? 'bg-slate-50 text-slate-500 cursor-not-allowed' 
              : isOpen 
                ? 'border-purple-500 ring-2 ring-purple-500 focus:outline-none' 
                : 'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500'
          }`}
        >
          <span className={`block truncate ${
            isEmptySelection 
              ? 'text-slate-400 italic' 
              : 'text-slate-900'
          }`}>
            {selectedOption?.label || placeholder}
          </span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <svg 
              className={`h-4 w-4 transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-purple-600' : 'text-slate-400'
              }`} 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
          </span>
        </button>

        {/* Dropdown Menu */}
        <Transition
          as={Fragment}
          show={isOpen}
          enter="transition ease-out duration-100"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
        >
          <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl bg-white shadow-xl border border-slate-200">
            {/* Search Input - only show if more than 5 options */}
            {options.length > 5 && (
              <div className="p-3 border-b border-slate-100 bg-slate-50/50">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    ref={searchInputRef}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                    placeholder="Search options..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
              </div>
            )}
            
            {/* Options List */}
            <div className={`overflow-auto ${
              options.length > 5 ? 'max-h-48' : 'max-h-60'
            }`}>
              {filteredOptions.length === 0 && query !== '' ? (
                <div className="relative cursor-default select-none py-4 px-4 text-slate-500 text-center text-sm">
                  <svg className="w-5 h-5 text-slate-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div className="font-medium">No options found</div>
                  <div className="text-xs text-slate-400">Try adjusting your search</div>
                </div>
              ) : (
                filteredOptions.map((option) => {
                  const isEmptyOption = !option.value || option.value === '' || 
                    option.label.includes('No specific') || 
                    option.label.includes('All team') ||
                    option.label.includes('No name') ||
                    option.label.includes('Choose')
                  const isSelected = value === option.value
                  
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleOptionSelect(option.value)}
                      className={`w-full text-left px-4 py-3 cursor-pointer transition-colors border-b border-slate-50 last:border-b-0 ${
                        isSelected 
                          ? 'bg-purple-50 text-purple-900 font-semibold' 
                          : 'hover:bg-slate-50 text-slate-900'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`block truncate ${sizeClasses[size].split(' ')[2]} ${
                          isEmptyOption ? 'text-slate-400 italic' : ''
                        }`}>
                          {option.label}
                        </span>
                        {isSelected && (
                          <svg className="h-4 w-4 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </Transition>
      </div>
    </div>
  )
}