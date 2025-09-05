import { useAppDispatch } from '../store/hooks'
import { 
  showSuccess, 
  showError, 
  showInfo, 
  showWarning, 
  showSnackbar, 
  hideSnackbar 
} from '../store/slices/snackbarSlice'

export const useSnackbar = () => {
  const dispatch = useAppDispatch()

  return {
    success: (message: string, duration?: number) => 
      dispatch(showSuccess({ message, duration })),
    
    error: (message: string, duration?: number) => 
      dispatch(showError({ message, duration })),
    
    info: (message: string, duration?: number) => 
      dispatch(showInfo({ message, duration })),
    
    warning: (message: string, duration?: number) => 
      dispatch(showWarning({ message, duration })),
    
    show: (message: string, type: 'success' | 'error' | 'info' | 'warning', duration?: number) =>
      dispatch(showSnackbar({ message, type, duration })),
    
    hide: () => dispatch(hideSnackbar())
  }
}