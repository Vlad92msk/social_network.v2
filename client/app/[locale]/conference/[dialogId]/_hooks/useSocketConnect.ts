import { useEffect } from 'react'
import { useDispatch } from 'react-redux'

export const useConferenceSocketConnect = ({ conferenceId }: { conferenceId: string }) => {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch({ type: '[CONFERENCE]/WEBSOCKET_CONNECT', payload: { conferenceId } })

    return () => {
      dispatch({ type: '[CONFERENCE]/WEBSOCKET_DISCONNECT', payload: { conferenceId } })
    }
  }, [conferenceId, dispatch])
}
