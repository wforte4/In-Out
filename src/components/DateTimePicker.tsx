'use client'

import React, { forwardRef } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

interface DateTimePickerProps {
  selected: Date | null
  onChange: (date: Date | null) => void
  showTimeSelect?: boolean
  dateFormat?: string
  placeholderText?: string
  className?: string
  required?: boolean
  minDate?: Date
  maxDate?: Date
  disabled?: boolean
}

// Custom input component that matches our app styling
interface CustomInputProps {
  value?: string
  onClick?: () => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

const CustomInput = forwardRef<HTMLInputElement, CustomInputProps>(({ value, onClick, placeholder, className, disabled }, ref) => (
  <div className="relative w-full">
    <input
      ref={ref}
      value={value}
      onClick={onClick}
      placeholder={placeholder}
      readOnly
      disabled={disabled}
      className={`w-full px-4 py-2 pr-10 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white text-slate-900 cursor-pointer ${disabled ? 'bg-slate-100 cursor-not-allowed' : 'hover:border-purple-300'
        } ${className || ''}`}
    />
    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
      <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 012-2h4a1 1 0 012 2v4m0 0V3h4a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2h4v4z" />
      </svg>
    </div>
  </div>
))

CustomInput.displayName = 'CustomInput'

export default function DateTimePicker({
  selected,
  onChange,
  showTimeSelect = true,
  dateFormat = showTimeSelect ? 'MM/dd/yyyy h:mm aa' : 'MM/dd/yyyy',
  placeholderText = showTimeSelect ? 'Select date and time' : 'Select date',
  className = '',
  required = false,
  minDate,
  maxDate,
  disabled = false
}: DateTimePickerProps) {
  return (
    <div className="date-picker-wrapper w-full">
      <DatePicker
        selected={selected}
        onChange={onChange}
        showTimeSelect={showTimeSelect}
        dateFormat={dateFormat}
        customInput={<CustomInput className={`w-full ${className}`} disabled={disabled} />}
        placeholderText={placeholderText}
        minDate={minDate}
        maxDate={maxDate}
        disabled={disabled}
        popperClassName="custom-datepicker-popper"
        calendarClassName="custom-datepicker-calendar"
        required={required}
        // Enhanced time selection with 5-minute increments
        timeIntervals={5} // 5 minute intervals
        timeCaption="Time"
        // Add some nice UX features
        selectsStart={false}
        selectsEnd={false}
        shouldCloseOnSelect={!showTimeSelect}
        showPopperArrow={false}
        fixedHeight
        // Allow proper positioning outside modal bounds
        popperPlacement="bottom-start"
        // Prevent pre-selection issues
        highlightDates={[]}
        excludeDates={[]}
        includeDates={undefined}
        // Clear keyboard selection behavior
        preventOpenOnFocus={false}
        showWeekNumbers={false}
      />

      <style jsx global>{`
        .react-datepicker-wrapper {
          width: 100% !important;
        }

        .custom-datepicker-popper {
          z-index: 1000 !important;
        }

        .custom-datepicker-calendar {
          border: none !important;
          border-radius: 16px !important;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
          background: rgba(255, 255, 255, 0.95) !important;
          backdrop-filter: blur(20px) !important;
          font-family: inherit !important;
        }

        .react-datepicker__header {
          background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%) !important;
          border-bottom: none !important;
          border-radius: 12px 12px 0 0 !important;
          color: white !important;
          padding: 20px 50px 16px 50px !important;
          position: relative !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
        }

        .react-datepicker__current-month {
          color: white !important;
          font-weight: 700 !important;
          font-size: 18px !important;
          margin-bottom: 8px !important;
          text-align: center !important;
          position: relative !important;
          width: 100% !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }

        .react-datepicker__day-names {
          margin-top: 8px !important;
          width: 100% !important;
          display: flex !important;
          justify-content: space-around !important;
        }

        .react-datepicker__day-name {
          font-weight: 600 !important;
          font-size: 13px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.5px !important;
          width: 32px !important;
          display: inline-block !important;
          text-align: center !important;
        }

        .react-datepicker__navigation {
          top: 20px;
        }

        .react-datepicker__navigation:hover {
          transform: scale(1.1) !important;
        }

        .react-datepicker__day {
          border-radius: 8px !important;
          margin: 2px !important;
          width: 32px !important;
          height: 32px !important;
          line-height: 32px !important;
          color: #374151 !important;
          font-weight: 500 !important;
          transition: all 0.2s ease !important;
          display: inline-block !important;
          text-align: center !important;
        }

        .react-datepicker__day:hover {
          background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%) !important;
          color: white !important;
          transform: scale(1.05) !important;
        }

        .react-datepicker__day--selected {
          background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%) !important;
          color: white !important;
          font-weight: 600 !important;
        }

        .react-datepicker__day--today {
          background: rgba(124, 58, 237, 0.1) !important;
          color: #7c3aed !important;
          font-weight: 600 !important;
        }

        .react-datepicker__day--keyboard-selected {
          background: transparent !important;
          color: #374151 !important;
        }
        
        .react-datepicker__day--keyboard-selected:hover {
          background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%) !important;
          color: white !important;
        }

        .react-datepicker__day--outside-month {
          color: #d1d5db !important;
        }

        .react-datepicker__time-container {
          border-left: 1px solid #e5e7eb !important;
          background: white !important;
        }

        .react-datepicker__time-box {
          background: white !important;
        }

        .react-datepicker__header--time {
          background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%) !important;
          color: white !important;
          font-weight: 600 !important;
          padding: 8px !important;
          border-radius: 0 12px 0 0 !important;
        }

        .react-datepicker__header--time .react-datepicker-time__header {
          color: white !important;
          font-weight: 700 !important;
          font-size: 14px !important;
        }

        .react-datepicker__time-list-item {
          padding: 8px 16px !important;
          transition: all 0.2s ease !important;
          color: #374151 !important;
        }

        .react-datepicker__time-list-item:hover {
          background: rgba(124, 58, 237, 0.1) !important;
          color: #7c3aed !important;
        }

        .react-datepicker__time-list-item--selected {
          background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%) !important;
          color: white !important;
          font-weight: 600 !important;
        }

        .react-datepicker__triangle {
          display: none !important;
        }

        .react-datepicker__week {
          display: flex !important;
          justify-content: space-around !important;
          align-items: center !important;
        }
      `}</style>
    </div>
  )
}