import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface SnackbarState {
  show: boolean
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  duration: number
}

const initialState: SnackbarState = {
  show: false,
  message: '',
  type: 'info',
  duration: 5000
}

export interface ShowSnackbarPayload {
  message: string
  type: SnackbarState['type']
  duration?: number
}

const snackbarSlice = createSlice({
  name: 'snackbar',
  initialState,
  reducers: {
    showSnackbar: (state, action: PayloadAction<ShowSnackbarPayload>) => {
      state.show = true
      state.message = action.payload.message
      state.type = action.payload.type
      state.duration = action.payload.duration ?? 5000
    },
    hideSnackbar: (state) => {
      state.show = false
      state.message = ''
      state.type = 'info'
    },
    showSuccess: (state, action: PayloadAction<{ message: string; duration?: number }>) => {
      state.show = true
      state.message = action.payload.message
      state.type = 'success'
      state.duration = action.payload.duration ?? 5000
    },
    showError: (state, action: PayloadAction<{ message: string; duration?: number }>) => {
      state.show = true
      state.message = action.payload.message
      state.type = 'error'
      state.duration = action.payload.duration ?? 5000
    },
    showInfo: (state, action: PayloadAction<{ message: string; duration?: number }>) => {
      state.show = true
      state.message = action.payload.message
      state.type = 'info'
      state.duration = action.payload.duration ?? 5000
    },
    showWarning: (state, action: PayloadAction<{ message: string; duration?: number }>) => {
      state.show = true
      state.message = action.payload.message
      state.type = 'warning'
      state.duration = action.payload.duration ?? 5000
    }
  }
})

export const {
  showSnackbar,
  hideSnackbar,
  showSuccess,
  showError,
  showInfo,
  showWarning
} = snackbarSlice.actions

export default snackbarSlice.reducer