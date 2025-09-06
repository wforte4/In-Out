import { configureStore } from '@reduxjs/toolkit'
import snackbarReducer from './slices/snackbarSlice'
import modalReducer from './slices/modalSlice'

export const store = configureStore({
  reducer: {
    snackbar: snackbarReducer,
    modal: modalReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE', 'modal/showModal'],
        ignoredPaths: ['modal.modals']
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch