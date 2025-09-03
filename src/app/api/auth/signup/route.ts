import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
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

      return NextResponse.json({ 
        message: 'User created and invitation accepted', 
        userId: user.id,
        organizationName: invitation.organization.name
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
          memberships: {
            create: {
              organizationId: org.id,
              role: 'EMPLOYEE'
            }
          }
        }
      })

      return NextResponse.json({ message: 'User created and added to organization', userId: user.id })
    }

    if (organizationName) {
      const orgCode = organizationName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 8) + Math.random().toString(36).substring(2, 6)

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
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

      return NextResponse.json({ message: 'User and organization created', userId: user.id, organizationCode: orgCode })
    }

    return NextResponse.json({ error: 'Must provide either organizationName or organizationCode' }, { status: 400 })

  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}