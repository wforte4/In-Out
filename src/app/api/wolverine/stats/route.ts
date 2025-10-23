import { requireSystemAdmin } from '@/lib/systemAdminAuth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    await requireSystemAdmin()

    // Get system-wide statistics
    const [
      totalUsers,
      totalOrganizations, 
      totalTimeEntries,
      totalProjects,
      systemAdmins
    ] = await Promise.all([
      prisma.user.count(),
      prisma.organization.count(),
      prisma.timeEntry.count(),
      prisma.project.count(),
      prisma.user.count({ where: { systemAdmin: true } })
    ])

    const stats = {
      totalUsers,
      totalOrganizations,
      totalTimeEntries,
      totalProjects,
      systemAdmins
    }

    return Response.json({ 
      success: true,
      stats
    })
  } catch (error) {
    if (error instanceof Response) {
      return error
    }
    
    console.error('System stats error:', error)
    return Response.json({ 
      error: 'Failed to fetch system statistics' 
    }, { status: 500 })
  }
}