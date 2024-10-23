import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { MessengerSliceActions } from '../store/messenger.slice'

/**
 * Обработка отмены событий по Escape
 */
export const useKeyboardEvents = () => {
  const dispatch = useDispatch()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        dispatch(MessengerSliceActions.executeLastUndoAction())
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [dispatch])
}
