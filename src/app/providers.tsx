'use client'

import { SessionProvider } from 'next-auth/react'
import { Provider } from 'react-redux'
import { store } from '../store'
import GlobalSnackbar from '../components/GlobalSnackbar'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <SessionProvider>
        {children}
        <GlobalSnackbar />
      </SessionProvider>
    </Provider>
  )
}