import { NextRequest } from 'next/server'
import { requireSystemAdmin } from '@/lib/systemAdminAuth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    await requireSystemAdmin()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '25')
    const search = searchParams.get('search') || ''

    const skip = (page - 1) * limit

    // Build search condition
    const searchCondition = search ? {
      OR: [
        {
          name: {
            contains: search,
            mode: 'insensitive' as const
          }
        },
        {
          email: {
            contains: search,
            mode: 'insensitive' as const
          }
        }
      ]
    } : {}

    // Get users with pagination and search
    const [users, totalUsers] = await Promise.all([
      prisma.user.findMany({
        where: searchCondition,
        select: {
          id: true,
          email: true,
          name: true,
          systemAdmin: true,
          emailVerified: true,
          createdAt: true,
          _count: {
            select: {
              memberships: true,
              timeEntries: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.user.count({
        where: searchCondition
      })
    ])

    const totalPages = Math.ceil(totalUsers / limit)

    return Response.json({
      success: true,
      users,
      totalUsers,
      totalPages,
      currentPage: page
    })
  } catch (error) {
    if (error instanceof Response) {
      return error
    }
    
    console.error('Users fetch error:', error)
    return Response.json({ 
      error: 'Failed to fetch users' 
    }, { status: 500 })
  }
}