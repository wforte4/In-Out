'use client'

import { SessionProvider } from 'next-auth/react'
import { Provider } from 'react-redux'
import { store } from '../store'
import GlobalSnackbar from '../components/GlobalSnackbar'
import GlobalModalManager from '../components/GlobalModalManager'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <SessionProvider>
        {children}
        <GlobalSnackbar />
        <GlobalModalManager />
      </SessionProvider>
    </Provider>
  )
}