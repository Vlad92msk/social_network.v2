'use client'

import React, {
  createContext, PropsWithChildren, useCallback, useContext, useMemo, useRef, useState,
} from 'react'
import { WebRTCService } from '../_services/webrtc.service'

interface WebRTCContextType {
  addConnection: (userId: string, connection: RTCPeerConnection) => void;
  getConnection: (userId: string) => RTCPeerConnection | undefined;
  removeConnection: (userId: string) => void;
  addStream: (userId: string, stream: MediaStream) => void;
  getStream: (userId: string) => MediaStream | undefined;
  removeStream: (userId: string) => void;
  webRTCService: WebRTCService;
}

const WebRTCContext = createContext<WebRTCContextType | null>(null)

export function WebRTCProvider(props: PropsWithChildren) {
  const { children } = props

  const connectionsRef = useRef(new Map<string, RTCPeerConnection>())
  const streamsRef = useRef(new Map<string, MediaStream>())
  const webRTCServiceRef = useRef<WebRTCService>(new WebRTCService())

  const addStream = useCallback((userId: string, stream: MediaStream) => {
    if (streamsRef.current.get(userId)?.id === stream.id) {
      return
    }
    streamsRef.current.set(userId, stream)
  }, [])

  const addConnection = useCallback((userId: string, connection: RTCPeerConnection) => {
    connectionsRef.current.set(userId, connection)
  }, [])

  const removeConnection = useCallback((userId: string) => {
    const connection = connectionsRef.current.get(userId)
    if (connection) {
      connection.close()
      connectionsRef.current.delete(userId)
    }
  }, [])

  const removeStream = useCallback((userId: string) => {
    const stream = streamsRef.current.get(userId)
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      streamsRef.current.delete(userId)
    }
  }, [])

  const getConnection = useCallback((userId: string) => connectionsRef.current.get(userId), [])

  const getStream = useCallback((userId: string) => streamsRef.current.get(userId), [])

  return (
    // eslint-disable-next-line react/jsx-no-constructed-context-values
    <WebRTCContext.Provider value={{
      addConnection,
      getConnection,
      removeConnection,
      addStream,
      getStream,
      removeStream,
      webRTCService: webRTCServiceRef.current,
    }}
    >
      {children}
    </WebRTCContext.Provider>
  )
}

export function useWebRTC() {
  const context = useContext(WebRTCContext)
  if (!context) {
    throw new Error('useWebRTC must be used within a WebRTCProvider')
  }
  return context
}
