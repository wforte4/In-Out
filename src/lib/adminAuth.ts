/* eslint-disable @typescript-eslint/no-require-imports */
const { getServerSession } = require('next-auth')
import { authOptions } from './auth'
import { prisma } from './prisma'
import { redirect } from 'next/navigation'

export async function checkAdminAccess() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        memberships: {
          where: { role: 'ADMIN' },
          include: { organization: true }
        }
      }
    })

    if (!user || user.memberships.length === 0) {
      redirect('/dashboard')
    }

    return {
      user,
      adminOrganizations: user.memberships.map(m => m.organization)
    }
  } catch (error) {
    console.error('Error checking admin access:', error)
    redirect('/dashboard')
  }
}

export async function checkProjectAccess(projectId: string) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        organization: {
          include: {
            memberships: {
              where: { 
                userId: session.user.id,
                role: 'ADMIN'
              }
            }
          }
        }
      }
    })

    if (!project || project.organization.memberships.length === 0) {
      redirect('/projects')
    }

    return project
  } catch (error) {
    console.error('Error checking project access:', error)
    redirect('/projects')
  }
}