'use client'

import { useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'

interface ProfileImageUploadProps {
  currentImage?: string | null
  onImageUpdate?: (imageUrl: string | null) => void
  onNotification?: (message: string, type: 'success' | 'error' | 'info') => void
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export default function ProfileImageUpload({
  currentImage,
  onImageUpdate,
  onNotification,
  size = 'lg',
  className = ''
}: ProfileImageUploadProps) {
  const { data: session, update: updateSession } = useSession()
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16', 
    lg: 'w-24 h-24',
    xl: 'w-32 h-32'
  }

  const iconSizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10', 
    xl: 'w-12 h-12'
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Upload file
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('profileImage', file)

      const response = await fetch('/api/user/profile-image', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload image')
      }

      // Update session to reflect new profile image
      await updateSession()
      
      // Call callback if provided
      if (onImageUpdate) {
        onImageUpdate(data.profileImage)
      }

      if (onNotification) {
        onNotification('Profile image updated successfully!', 'success')
      }

    } catch (error) {
      console.error('Upload error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload image'
      if (onNotification) {
        onNotification(errorMessage, 'error')
      }
      // Reset preview on error
      setPreviewUrl(currentImage || null)
    } finally {
      setUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveImage = async () => {
    setUploading(true)
    try {
      const response = await fetch('/api/user/profile-image', {
        method: 'DELETE'
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to remove image')
      }

      setPreviewUrl(null)
      await updateSession()
      
      if (onImageUpdate) {
        onImageUpdate(null)
      }

      if (onNotification) {
        onNotification('Profile image removed successfully!', 'success')
      }

    } catch (error) {
      console.error('Remove error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove image'
      if (onNotification) {
        onNotification(errorMessage, 'error')
      }
    } finally {
      setUploading(false)
    }
  }

  const getInitials = () => {
    const name = session?.user?.name || session?.user?.email || ''
    return name.charAt(0).toUpperCase()
  }

  return (
    <div className={`relative ${className}`}>
      <div className={`${sizeClasses[size]} relative group cursor-pointer`} onClick={() => fileInputRef.current?.click()}>
        <div className={`${sizeClasses[size]} rounded-2xl overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center`}>
          {previewUrl ? (
            <Image 
              src={previewUrl} 
              alt="Profile" 
              width={128}
              height={128}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className={`text-white font-bold ${size === 'sm' ? 'text-sm' : size === 'md' ? 'text-lg' : size === 'lg' ? 'text-xl' : 'text-2xl'}`}>
              {getInitials()}
            </span>
          )}
        </div>
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          {uploading ? (
            <svg className={`${iconSizeClasses[size]} text-white animate-spin`} fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className={`${iconSizeClasses[size]} text-white`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
        </div>
      </div>

      {/* Remove button */}
      {previewUrl && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleRemoveImage()
          }}
          disabled={uploading}
          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors disabled:opacity-50"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />
    </div>
  )
}