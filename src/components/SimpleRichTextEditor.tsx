'use client'

import React, { useRef, useCallback, useEffect } from 'react'

interface SimpleRichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export default function SimpleRichTextEditor({
  value,
  onChange,
  placeholder = "Enter description...",
  className = "",
  disabled = false
}: SimpleRichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)

  const formatText = useCallback((command: string, value?: string) => {
    if (disabled) return
    document.execCommand(command, false, value)
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }, [onChange, disabled])

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }, [onChange])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (disabled) return
    
    // Handle common shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault()
          formatText('bold')
          break
        case 'i':
          e.preventDefault()
          formatText('italic')
          break
        case 'u':
          e.preventDefault()
          formatText('underline')
          break
      }
    }
  }, [formatText, disabled])

  // Update content when value prop changes
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || ''
    }
  }, [value])

  const buttonClass = "p-2 rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors text-slate-600 hover:text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"

  return (
    <div className={`simple-rich-text-editor border border-slate-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-purple-500 transition-all duration-200 ${className}`}>
      {!disabled && (
        <div className="flex items-center gap-1 p-2 bg-slate-50 border-b border-slate-300">
          <button
            type="button"
            onClick={() => formatText('bold')}
            className={buttonClass}
            title="Bold (Ctrl+B)"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 4h8a4 4 0 0 1 4 4 0 0 1-4 4H6z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h9a4 4 0 0 1 4 4 0 0 1-4 4H6z" />
            </svg>
          </button>
          
          <button
            type="button"
            onClick={() => formatText('italic')}
            className={buttonClass}
            title="Italic (Ctrl+I)"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 4h-9M14 20H5M15 4L9 20" />
            </svg>
          </button>
          
          <button
            type="button"
            onClick={() => formatText('underline')}
            className={buttonClass}
            title="Underline (Ctrl+U)"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 4v8a4 4 0 0 0 8 0V4M6 20h12" />
            </svg>
          </button>
          
          <div className="w-px h-6 bg-slate-300 mx-1" />
          
          <button
            type="button"
            onClick={() => formatText('insertUnorderedList')}
            className={buttonClass}
            title="Bullet List"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <button
            type="button"
            onClick={() => formatText('insertOrderedList')}
            className={buttonClass}
            title="Numbered List"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2V7a2 2 0 00-2-2H9z" />
            </svg>
          </button>
          
          <div className="w-px h-6 bg-slate-300 mx-1" />
          
          <button
            type="button"
            onClick={() => formatText('removeFormat')}
            className={buttonClass}
            title="Clear Formatting"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      
      <div
        ref={editorRef}
        contentEditable={!disabled}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        className={`p-4 min-h-[100px] max-h-[300px] overflow-y-auto focus:outline-none ${
          disabled ? 'bg-slate-50 cursor-not-allowed' : 'bg-white'
        }`}
        style={{
          fontSize: '14px',
          lineHeight: '1.5',
          color: disabled ? '#64748b' : '#1e293b'
        }}
        suppressContentEditableWarning={true}
        data-placeholder={placeholder}
      />
      
      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #94a3b8;
          cursor: text;
        }
        
        [contenteditable] ul, [contenteditable] ol {
          margin: 8px 0;
          padding-left: 20px;
        }
        
        [contenteditable] li {
          margin: 4px 0;
        }
        
        [contenteditable] p {
          margin: 8px 0;
        }
        
        [contenteditable] strong {
          font-weight: 600;
        }
        
        [contenteditable]:focus {
          outline: none;
        }
      `}</style>
    </div>
  )
}