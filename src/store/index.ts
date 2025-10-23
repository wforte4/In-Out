import { configureStore } from '@reduxjs/toolkit'
import snackbarReducer from './slices/snackbarSlice'
import modalReducer from './slices/modalSlice'
import systemAdminReducer from './slices/systemAdminSlice'

export const store = configureStore({
  reducer: {
    snackbar: snackbarReducer,
    modal: modalReducer,
    systemAdmin: systemAdminReducer,
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