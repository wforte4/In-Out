import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { sendEmailVerificationEmail } from '@/lib/email'
import { withRateLimit } from '@/lib/rateLimit'

const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex')
}

const createEmailVerificationToken = async (userId: string) => {
  const token = generateVerificationToken()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  await prisma.emailVerificationToken.create({
    data: {
      token,
      userId,
      expiresAt
    }
  })

  return token
}

async function handleSignup(request: NextRequest) {
  try {
    const { email, password, name, organizationName, organizationCode, invitationToken } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    if (invitationToken) {
      const invitation = await prisma.invitation.findUnique({
        where: { token: invitationToken },
        include: { organization: true }
      })

      if (!invitation || invitation.status !== 'PENDING' || invitation.expiresAt < new Date()) {
        return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 400 })
      }

      if (invitation.email !== email) {
        return NextResponse.json({ error: 'Email does not match invitation' }, { status: 400 })
      }

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          emailVerified: false, // Explicitly set to false
          memberships: {
            create: {
              organizationId: invitation.organizationId,
              role: invitation.role
            }
          }
        }
      })

      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED' }
      })

      // Create and send email verification token
      const verificationToken = await createEmailVerificationToken(user.id)
      const emailResult = await sendEmailVerificationEmail(email, verificationToken, name || 'User')
      
      if (!emailResult.success) {
        console.error('Failed to send verification email:', emailResult.error)
      }

      return NextResponse.json({ 
        message: 'User created and invitation accepted. Please check your email to verify your account.', 
        userId: user.id,
        organizationName: invitation.organization.name,
        requiresVerification: true
      })
    }

    if (organizationCode) {
      const org = await prisma.organization.findUnique({
        where: { code: organizationCode }
      })

      if (!org) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 400 })
      }

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          emailVerified: false,
          memberships: {
            create: {
              organizationId: org.id,
              role: 'EMPLOYEE'
            }
          }
        }
      })

      // Create and send email verification token
      const verificationToken = await createEmailVerificationToken(user.id)
      const emailResult = await sendEmailVerificationEmail(email, verificationToken, name || 'User')
      
      if (!emailResult.success) {
        console.error('Failed to send verification email:', emailResult.error)
      }

      return NextResponse.json({ 
        message: 'User created and added to organization. Please check your email to verify your account.', 
        userId: user.id,
        requiresVerification: true
      })
    }

    if (organizationName) {
      const orgCode = organizationName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 8) + Math.random().toString(36).substring(2, 6)

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          emailVerified: false,
          ownedOrganizations: {
            create: {
              name: organizationName,
              code: orgCode
            }
          }
        }
      })

      const org = await prisma.organization.findFirst({
        where: { ownerId: user.id }
      })

      await prisma.membership.create({
        data: {
          userId: user.id,
          organizationId: org!.id,
          role: 'ADMIN'
        }
      })

      // Create and send email verification token
      const verificationToken = await createEmailVerificationToken(user.id)
      const emailResult = await sendEmailVerificationEmail(email, verificationToken, name || 'User')
      
      if (!emailResult.success) {
        console.error('Failed to send verification email:', emailResult.error)
      }

      return NextResponse.json({ 
        message: 'User and organization created. Please check your email to verify your account.', 
        userId: user.id, 
        organizationCode: orgCode,
        requiresVerification: true
      })
    }

    return NextResponse.json({ error: 'Must provide either organizationName or organizationCode' }, { status: 400 })

  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const POST = withRateLimit(handleSignup, 'auth')