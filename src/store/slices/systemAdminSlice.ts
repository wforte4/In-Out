import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { httpClient } from '../../lib/httpClient'

interface SystemStats {
  totalUsers: number
  totalOrganizations: number
  totalTimeEntries: number
  totalProjects: number
  systemAdmins: number
}

interface User {
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

interface UsersResponse {
  users: User[]
  totalUsers: number
  totalPages: number
  currentPage: number
}

interface SystemAdminState {
  isSystemAdmin: boolean
  verificationLoading: boolean
  stats: SystemStats | null
  statsLoading: boolean
  users: UsersResponse | null
  usersLoading: boolean
  searchQuery: string
  currentPage: number
  error: string | null
}

const initialState: SystemAdminState = {
  isSystemAdmin: false,
  verificationLoading: true,
  stats: null,
  statsLoading: false,
  users: null,
  usersLoading: false,
  searchQuery: '',
  currentPage: 1,
  error: null
}

// Async thunks
export const verifySystemAdmin = createAsyncThunk(
  'systemAdmin/verifySystemAdmin',
  async (_, { rejectWithValue }) => {
    try {
      const response = await httpClient.get('/api/wolverine/verify')
      if (!response.success) {
        throw new Error('Not authorized as system admin')
      }
      return true
    } catch {
      return rejectWithValue('System admin verification failed')
    }
  }
)

export const fetchSystemStats = createAsyncThunk(
  'systemAdmin/fetchSystemStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await httpClient.get<{ stats: SystemStats }>('/api/wolverine/stats')
      if (!response.success) {
        throw new Error('Failed to fetch stats')
      }
      return response.data!.stats
    } catch {
      return rejectWithValue('Failed to fetch system stats')
    }
  }
)

export const fetchUsers = createAsyncThunk(
  'systemAdmin/fetchUsers',
  async ({ page = 1, search = '', limit = 25 }: { page?: number; search?: string; limit?: number }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      })
      
      if (search.trim()) {
        params.append('search', search.trim())
      }

      const response = await httpClient.get<UsersResponse>(`/api/wolverine/users?${params}`)
      if (!response.success) {
        throw new Error('Failed to fetch users')
      }
      return { users: response.data!, page, search }
    } catch {
      return rejectWithValue('Failed to fetch users')
    }
  }
)

const systemAdminSlice = createSlice({
  name: 'systemAdmin',
  initialState,
  reducers: {
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload
      state.currentPage = 1
    },
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
    resetState: () => initialState
  },
  extraReducers: (builder) => {
    builder
      // Verify system admin
      .addCase(verifySystemAdmin.pending, (state) => {
        state.verificationLoading = true
        state.error = null
      })
      .addCase(verifySystemAdmin.fulfilled, (state) => {
        state.verificationLoading = false
        state.isSystemAdmin = true
      })
      .addCase(verifySystemAdmin.rejected, (state, action) => {
        state.verificationLoading = false
        state.isSystemAdmin = false
        state.error = action.payload as string
      })
      
      // Fetch system stats
      .addCase(fetchSystemStats.pending, (state) => {
        state.statsLoading = true
        state.error = null
      })
      .addCase(fetchSystemStats.fulfilled, (state, action) => {
        state.statsLoading = false
        state.stats = action.payload
      })
      .addCase(fetchSystemStats.rejected, (state, action) => {
        state.statsLoading = false
        state.error = action.payload as string
      })
      
      // Fetch users
      .addCase(fetchUsers.pending, (state) => {
        state.usersLoading = true
        state.error = null
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.usersLoading = false
        state.users = action.payload.users
        state.currentPage = action.payload.page
        state.searchQuery = action.payload.search
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.usersLoading = false
        state.error = action.payload as string
      })
  }
})

export const { setSearchQuery, setCurrentPage, clearError, resetState } = systemAdminSlice.actions
export default systemAdminSlice.reducer