import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { sendEmailVerificationEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'Verification token is required' }, { status: 400 })
    }

    // Find the verification token
    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: true }
    })

    if (!verificationToken) {
      return NextResponse.json({ error: 'Invalid verification token' }, { status: 400 })
    }

    if (verificationToken.used) {
      return NextResponse.json({ error: 'Verification token has already been used' }, { status: 400 })
    }

    if (verificationToken.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Verification token has expired' }, { status: 400 })
    }

    // Update user as verified and mark token as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: verificationToken.userId },
        data: { 
          emailVerified: true,
          emailVerifiedAt: new Date()
        }
      }),
      prisma.emailVerificationToken.update({
        where: { id: verificationToken.id },
        data: { used: true }
      })
    ])

    return NextResponse.json({ 
      message: 'Email verified successfully', 
      user: {
        id: verificationToken.user.id,
        email: verificationToken.user.email,
        name: verificationToken.user.name,
        emailVerified: true
      }
    })

  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Resend verification email
export async function PUT(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.emailVerified) {
      return NextResponse.json({ error: 'Email is already verified' }, { status: 400 })
    }

    // Delete any existing unused tokens
    await prisma.emailVerificationToken.deleteMany({
      where: {
        userId: user.id,
        used: false
      }
    })

    // Create new verification token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    await prisma.emailVerificationToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt
      }
    })

    // Send verification email
    const emailResult = await sendEmailVerificationEmail(email, token, user.name || 'User')
    
    if (!emailResult.success) {
      console.error('Failed to resend verification email:', emailResult.error)
      return NextResponse.json({ error: 'Failed to send verification email' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Verification email sent successfully'
    })

  } catch (error) {
    console.error('Resend verification error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}