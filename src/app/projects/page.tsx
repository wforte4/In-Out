import { checkAdminAccess } from '../../lib/adminAuth'
import ProjectsWrapper from './ProjectsWrapper'

export default async function Projects() {
  // Server-side admin check - will redirect if no access
  const { adminOrganizations } = await checkAdminAccess()

  // Convert to the format expected by the client component
  const organizations = adminOrganizations.map(org => ({
    id: org.id,
    name: org.name,
    code: org.code
  }))

  return <ProjectsWrapper initialOrganizations={organizations} />
}