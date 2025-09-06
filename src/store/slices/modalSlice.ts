import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ComponentType } from 'react'

export interface ModalProps {
  id: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: ComponentType<any>
  props?: Record<string, unknown>
  onClose?: () => void
  backdropClick?: 'close' | 'ignore'
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

interface ModalState {
  modals: ModalProps[]
}

const initialState: ModalState = {
  modals: []
}

export const modalSlice = createSlice({
  name: 'modal',
  initialState,
  reducers: {
    showModal: (state, action: PayloadAction<ModalProps>) => {
      state.modals.push({
        backdropClick: 'close',
        size: 'md',
        ...action.payload
      })
    },
    hideModal: (state, action: PayloadAction<string>) => {
      state.modals = state.modals.filter(modal => modal.id !== action.payload)
    },
    hideAllModals: (state) => {
      state.modals = []
    },
    updateModalProps: (state, action: PayloadAction<{ id: string; props: Record<string, unknown> }>) => {
      const modal = state.modals.find(m => m.id === action.payload.id)
      if (modal) {
        modal.props = { ...modal.props, ...action.payload.props }
      }
    }
  }
})

export const { showModal, hideModal, hideAllModals, updateModalProps } = modalSlice.actions
export default modalSlice.reducer