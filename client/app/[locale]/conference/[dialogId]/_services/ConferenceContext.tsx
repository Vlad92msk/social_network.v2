'use client'

import { createContext, useContext, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { useMediaStreamContext } from '@ui/components/media-stream/context/MediaStreamContext'
import { useConnectionMonitor, useParticipantsAndStream, useWebRTCManager } from './hooks-for-context'
import { WebRTCState } from './types'
import { ConferenceSelectors } from '../_store/selectors'

interface WebRTCContextValue extends WebRTCState {
  startScreenSharing: () => Promise<MediaStream | undefined>;
  stopScreenSharing: () => void;
  isScreenSharingSupported: boolean;
}

const WebRTCContext = createContext<WebRTCContextValue | null>(null)

export function WebRTCProvider({ children, currentUserId, dialogId }: { children: React.ReactNode; currentUserId: string, dialogId: string }) {
  const { stream: localStream } = useMediaStreamContext()
  const participants = useSelector(ConferenceSelectors.selectUsers)

  const { state, webRTCManager } = useWebRTCManager(currentUserId, dialogId)

  // Проверяем поддержку screen sharing
  const isScreenSharingSupported = useMemo(() => typeof navigator !== 'undefined'
      && 'mediaDevices' in navigator
      && 'getDisplayMedia' in navigator.mediaDevices, [])

  useParticipantsAndStream(webRTCManager, participants, localStream)
  useConnectionMonitor(webRTCManager, participants, currentUserId)

  const contextValue = useMemo(() => ({
    ...state,
    isScreenSharingSupported,
    startScreenSharing: () => webRTCManager.startScreenSharing(),
    stopScreenSharing: () => webRTCManager.stopScreenSharing(),
  }), [state, isScreenSharingSupported, webRTCManager])

  if (!webRTCManager) return null

  return (
    <WebRTCContext.Provider value={contextValue}>
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
