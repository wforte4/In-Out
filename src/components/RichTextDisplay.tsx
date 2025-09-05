'use client'

import React from 'react'

interface RichTextDisplayProps {
  content: string
  className?: string
}

export default function RichTextDisplay({ content, className = '' }: RichTextDisplayProps) {
  if (!content || content.trim() === '' || content === '<p><br></p>') {
    return null
  }

  return (
    <div 
      className={`rich-text-display ${className}`}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}