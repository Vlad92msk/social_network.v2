'use client'

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
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

export function WebRTCProvider({ children }: { children: React.ReactNode }) {
  const connectionsRef = useRef(new Map<string, RTCPeerConnection>())
  const streamsRef = useRef(new Map<string, MediaStream>())
  const webRTCServiceRef = useRef<WebRTCService>(new WebRTCService())

  const addStream = (userId: string, stream: MediaStream) => {
    if (streamsRef.current.get(userId)?.id === stream.id) {
      console.log('Stream already exists, skipping update')
      return
    }
    console.log('Adding stream:', { userId, streamId: stream.id })
    streamsRef.current.set(userId, stream)
    console.log('streamsRef', streamsRef.current)
  }

  const addConnection = (userId: string, connection: RTCPeerConnection) => {
    console.log('Adding connection:', userId)
    connectionsRef.current.set(userId, connection)
  }

  const removeConnection = (userId: string) => {
    const connection = connectionsRef.current.get(userId)
    if (connection) {
      connection.close()
      connectionsRef.current.delete(userId)
      console.log('Removed connection:', userId)
    }
  }

  const removeStream = (userId: string) => {
    const stream = streamsRef.current.get(userId)
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      streamsRef.current.delete(userId)
      console.log('Removed stream:', userId)
    }
  }

  const getConnection = useCallback((userId: string) => connectionsRef.current.get(userId), [])

  const getStream = useCallback((userId: string) => {
    const stream = streamsRef.current.get(userId)
    console.log('WebRTCContext: Getting stream', {
      userId,
      exists: !!stream,
      streamId: stream?.id,
    })
    return stream
  }, [])

  const value = useMemo(() => ({
    addConnection,
    getConnection,
    removeConnection,
    addStream,
    getStream,
    removeStream,
    webRTCService: webRTCServiceRef.current,
  }), [addConnection, getConnection, removeConnection, addStream, getStream, removeStream])

  return (
    <WebRTCContext.Provider value={value}>
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
