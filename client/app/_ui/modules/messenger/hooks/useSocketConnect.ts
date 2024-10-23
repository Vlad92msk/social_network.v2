import { useEffect } from 'react'
import { useDispatch } from 'react-redux'

export const useSocketConnect = () => {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch({ type: 'WEBSOCKET_CONNECT' })

    return () => {
      dispatch({ type: 'WEBSOCKET_DISCONNECT' })
    }
  }, [dispatch])
}
