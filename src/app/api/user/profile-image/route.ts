import { NextRequest, NextResponse } from 'next/server'
/* eslint-disable @typescript-eslint/no-require-imports */
const { getServerSession } = require('next-auth')
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile } from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.formData()
    const file: File | null = data.get('profileImage') as unknown as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create unique filename
    const fileExtension = path.extname(file.name)
    const fileName = `${session.user.id}-${Date.now()}${fileExtension}`
    const filePath = path.join(process.cwd(), 'public', 'uploads', 'profiles', fileName)

    // Ensure upload directory exists
    const fs = require('fs')
    const uploadDir = path.dirname(filePath)
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    // Save file
    await writeFile(filePath, buffer)

    // Update user profile image in database
    const profileImageUrl = `/uploads/profiles/${fileName}`
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { profileImage: profileImageUrl }
    })

    return NextResponse.json({ 
      message: 'Profile image updated successfully',
      profileImage: updatedUser.profileImage
    })

  } catch (error) {
    console.error('Upload profile image error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current profile image
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { profileImage: true }
    })

    if (user?.profileImage) {
      // Delete file from filesystem
      const fs = require('fs')
      const filePath = path.join(process.cwd(), 'public', user.profileImage)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    }

    // Remove profile image from database
    await prisma.user.update({
      where: { id: session.user.id },
      data: { profileImage: null }
    })

    return NextResponse.json({ message: 'Profile image removed successfully' })

  } catch (error) {
    console.error('Delete profile image error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}