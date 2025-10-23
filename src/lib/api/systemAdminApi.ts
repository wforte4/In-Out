import { httpClient } from '../httpClient'

export interface SystemStats {
  totalUsers: number
  totalOrganizations: number
  totalTimeEntries: number
  totalProjects: number
  systemAdmins: number
}

export interface User {
  id: string
  email: string
  name: string | null
  systemAdmin: boolean
  emailVerified: boolean
  createdAt: string
  _count: {
    memberships: number
    timeEntries: number
  }
}

export interface UsersResponse {
  users: User[]
  totalUsers: number
  totalPages: number
  currentPage: number
}

export interface FetchUsersParams {
  page?: number
  search?: string
  limit?: number
}

export const systemAdminApi = {
  async verifySystemAdmin(): Promise<boolean> {
    const response = await httpClient.get('/api/wolverine/verify')
    return response.success
  },

  async getSystemStats(): Promise<SystemStats> {
    const response = await httpClient.get<{ stats: SystemStats }>('/api/wolverine/stats')
    if (!response.success || !response.data) {
      throw new Error('Failed to fetch system stats')
    }
    return response.data.stats
  },

  async getUsers({ page = 1, search = '', limit = 25 }: FetchUsersParams = {}): Promise<UsersResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    })
    
    if (search.trim()) {
      params.append('search', search.trim())
    }

    const response = await httpClient.get<UsersResponse>(`/api/wolverine/users?${params}`)
    if (!response.success || !response.data) {
      throw new Error('Failed to fetch users')
    }
    return response.data
  }
}