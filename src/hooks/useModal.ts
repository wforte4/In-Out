import { useAppDispatch } from '../store/hooks'
import { showModal, hideModal, hideAllModals, updateModalProps } from '../store/slices/modalSlice'
import { ComponentType } from 'react'

export const useModal = () => {
  const dispatch = useAppDispatch()

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    show: <T extends Record<string, any>>(
      id: string,
      component: ComponentType<T>,
      props?: T,
      options?: {
        onClose?: () => void
        backdropClick?: 'close' | 'ignore'
        size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
      }
    ) => {
      dispatch(showModal({
        id,
        component,
        props,
        ...options
      }))
    },

    hide: (id: string) => dispatch(hideModal(id)),

    hideAll: () => dispatch(hideAllModals()),

    updateProps: (id: string, props: Record<string, unknown>) => 
      dispatch(updateModalProps({ id, props }))
  }
}