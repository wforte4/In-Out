import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const organizationId = searchParams.get('organizationId')

    if (userId && userId !== session.user.id) {
      const membership = await prisma.membership.findFirst({
        where: {
          userId: session.user.id,
          organizationId: organizationId || undefined,
          role: 'ADMIN'
        }
      })

      if (!membership) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        userId: userId || session.user.id
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        clockIn: 'desc'
      }
    })

    return NextResponse.json({ timeEntries })

  } catch (error) {
    console.error('Get time entries error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}