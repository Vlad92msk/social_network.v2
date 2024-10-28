'use client'

// contexts/WebRTCContext.tsx
import React, { createContext, useCallback, useContext, useMemo, useRef } from 'react'
import { WebRTCService } from '../_services/webrtc.service'

interface WebRTCContextType {
  // Методы для управления соединениями
  addConnection: (userId: string, connection: RTCPeerConnection) => void;
  getConnection: (userId: string) => RTCPeerConnection | undefined;
  removeConnection: (userId: string) => void;

  // Методы для управления потоками
  addStream: (userId: string, stream: MediaStream) => void;
  getStream: (userId: string) => MediaStream | undefined;
  removeStream: (userId: string) => void;

  // WebRTC сервис
  webRTCService: WebRTCService;
}

const WebRTCContext = createContext<WebRTCContextType | null>(null)

export function WebRTCProvider({ children }: { children: React.ReactNode }) {
  // Используем useRef для хранения соединений и потоков, так как нам не нужен ререндер при их изменении
  const connectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map())
  const streamsRef = useRef<Map<string, MediaStream>>(new Map())
  const webRTCServiceRef = useRef<WebRTCService>(new WebRTCService())

  // Методы для управления соединениями
  const addConnection = useCallback((userId: string, connection: RTCPeerConnection) => {
    connectionsRef.current.set(userId, connection)
  }, [])

  const getConnection = useCallback((userId: string) => connectionsRef.current.get(userId), [])

  const removeConnection = useCallback((userId: string) => {
    const connection = connectionsRef.current.get(userId)
    if (connection) {
      connection.close()
      connectionsRef.current.delete(userId)
    }
  }, [])

  // Методы для управления потоками
  const addStream = useCallback((userId: string, stream: MediaStream) => {
    streamsRef.current.set(userId, stream)
  }, [])

  const getStream = useCallback((userId: string) => streamsRef.current.get(userId), [])

  const removeStream = useCallback((userId: string) => {
    const stream = streamsRef.current.get(userId)
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      streamsRef.current.delete(userId)
    }
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

// Хук для использования контекста
export function useWebRTC() {
  const context = useContext(WebRTCContext)
  if (!context) {
    throw new Error('useWebRTC must be used within a WebRTCProvider')
  }
  return context
}
