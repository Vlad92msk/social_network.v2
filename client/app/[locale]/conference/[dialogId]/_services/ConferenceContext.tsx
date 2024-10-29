'use client'

import React, { createContext, useCallback, useContext, useState } from 'react'

interface WebRTCContextState {
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  getStream: (participantId: string) => MediaStream | null;
  setLocalStream: (stream: MediaStream) => void;
  updateRemoteStream: (userId: string, stream: MediaStream) => void;
  removeRemoteStream: (userId: string) => void;
}

const WebRTCContext = createContext<WebRTCContextState | null>(null)

export function WebRTCProvider({ children }: { children: React.ReactNode }) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map())

  const updateRemoteStream = useCallback((userId: string, stream: MediaStream) => {
    setRemoteStreams((prev) => {
      const newStreams = new Map(prev)
      newStreams.set(userId, stream)
      return newStreams
    })
  }, [])

  const removeRemoteStream = useCallback((userId: string) => {
    setRemoteStreams((prev) => {
      const newStreams = new Map(prev)
      newStreams.delete(userId)
      return newStreams
    })
  }, [])

  const getStream = useCallback((participantId: string) => {
    if (participantId === 'local') return localStream
    return remoteStreams.get(participantId) || null
  }, [localStream, remoteStreams])

  return (
    <WebRTCContext.Provider
      value={{
        localStream,
        remoteStreams,
        getStream,
        setLocalStream,
        updateRemoteStream,
        removeRemoteStream,
      }}
    >
      {children}
    </WebRTCContext.Provider>
  )
}

export const useWebRTCContext = () => {
  const context = useContext(WebRTCContext)
  if (!context) {
    throw new Error('useWebRTCContext must be used within a WebRTCProvider')
  }
  return context
}
