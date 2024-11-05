'use client'

import { createContext, useContext } from 'react'
import { useSelector } from 'react-redux'
import { useMediaStreamContext } from '@ui/components/media-stream/context/MediaStreamContext'
import { useConnectionMonitor, useParticipantsAndStream, useWebRTCManager } from './hooks-for-context'
import { webRTCInitialState } from './initialState'
import { WebRTCState } from './types'
import { ConferenceSelectors } from '../_store/selectors'

type WebRTCContextValue = WebRTCState

const WebRTCContext = createContext<WebRTCContextValue>(webRTCInitialState)

export function WebRTCProvider({ children, currentUserId, dialogId }: { children: React.ReactNode; currentUserId: string, dialogId: string }) {
  const { stream: localStream } = useMediaStreamContext()
  const participants = useSelector(ConferenceSelectors.selectUsers)

  const { state, webRTCManager } = useWebRTCManager(currentUserId, dialogId)

  useParticipantsAndStream(webRTCManager, participants, localStream)
  useConnectionMonitor(webRTCManager, participants, currentUserId)

  if (!webRTCManager) return null

  return (
    <WebRTCContext.Provider value={state}>
      {children}
    </WebRTCContext.Provider>
  )
}

export const useWebRTCContext = () => {
  const context = useContext(WebRTCContext)
  if (!context) {
    throw new Error('useWebRTC must be used within WebRTCProvider')
  }
  return context
}
