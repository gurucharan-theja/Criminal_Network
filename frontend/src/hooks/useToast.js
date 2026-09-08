import useUIStore from '../store/useUIStore'

/**
 * useToast — convenience hook for showing toast notifications.
 *
 * Usage:
 *   const toast = useToast()
 *   toast.success('Entity saved!')
 *   toast.error('Upload failed')
 *   toast.warning('High risk detected')
 *   toast.info('Processing...')
 */
const useToast = () => {
  const { success, error, warning, info, dismissToast } = useUIStore()
  return { success, error, warning, info, dismiss: dismissToast }
}

export default useToast
