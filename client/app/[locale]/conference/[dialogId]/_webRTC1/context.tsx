'use client'

import { useMediaStreamContext } from '@ui/components/media-stream/context/MediaStreamContext'
import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from 'react'
import { useSelector } from 'react-redux'
import { WebRTCService } from './myWebRTC'
import { ConferenceSelectors } from '../_store/selectors'

interface WebRTCContextValue {
  streams: Record<string, MediaStream>;
  isConnecting: boolean;
  connectionStatus: Record<string, 'connecting' | 'connected' | 'disconnected'>;
  handleSignal: (senderId: string, signal: any, targetUserId: string) => Promise<void>;
}

const WebRTCContext = createContext<WebRTCContextValue>({
  streams: {},
  isConnecting: false,
  connectionStatus: {},
  handleSignal: async () => {},
})

interface WebRTCProviderProps {
  children: React.ReactNode;
  userId: string;
  roomId: string;
}

export function WebRTCProvider({ children, userId, roomId }: WebRTCProviderProps) {
  const { stream: localStream } = useMediaStreamContext()
  const participants = useSelector(ConferenceSelectors.selectUsers)

  const serviceRef = useRef<WebRTCService | null>(null)
  const [streams, setStreams] = useState<Record<string, MediaStream>>({})
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<Record<string, 'connecting' | 'connected' | 'disconnected'>>({})

  // Инициализация сервиса
  useEffect(() => {
    const service = new WebRTCService({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      debug: true,
    })

    service.initialize(userId, roomId)

    // Обработчики событий
    service.on('stream:added', ({ peerId, stream }) => {
      setStreams((prev) => ({ ...prev, [peerId]: stream }))
    })

    service.on('stream:removed', ({ peerId }) => {
      setStreams((prev) => {
        const next = { ...prev }
        delete next[peerId]
        return next
      })
    })

    service.on('peer:status', ({ peerId, status }) => {
      setConnectionStatus((prev) => ({ ...prev, [peerId]: status }))
    })

    service.on('connection:error', ({ error }) => {
      console.error('WebRTC connection error:', error)
    })

    service.on('signal:error', ({ error }) => {
      console.error('WebRTC signaling error:', error)
    })

    serviceRef.current = service

    return () => {
      service.removeAllListeners()
      // Очистка соединений
    }
  }, [userId, roomId])

  // Обработка изменений локального стрима
  useEffect(() => {
    const service = serviceRef.current
    if (service && localStream) {
      service.setLocalStream(localStream)
    }
  }, [localStream])

  // Обработка изменений списка участников
  useEffect(() => {
    const service = serviceRef.current
    if (!service || !roomId) return

    // Инициируем соединение только с новыми участниками
    participants.forEach((participantId) => {
      if (participantId !== userId) {
        setIsConnecting(true)
        service.initiateConnection(participantId)
          .finally(() => setIsConnecting(false))
      }
    })
  }, [participants, userId, roomId])

  const handleSignal = useCallback(async (senderId: string, signal: any, targetUserId: string) => {
    try {
      await serviceRef.current?.handleSignal(senderId, signal)
    } catch (error) {
      console.error('Error handling signal:', error)
    }
  }, [])

  const contextValue = useMemo(() => ({
    streams,
    isConnecting,
    connectionStatus,
    handleSignal,
  }), [streams, isConnecting, connectionStatus, handleSignal])

  return (
    <WebRTCContext.Provider value={contextValue}>
      {children}
    </WebRTCContext.Provider>
  )
}

export const useWebRTCContext = () => {
  const context = useContext(WebRTCContext)
  if (!context) {
    throw new Error('useWebRTCContext must be used within WebRTCProvider')
  }
  return context
}
