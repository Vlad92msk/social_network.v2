'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useMediaStreamContext } from '@ui/components/media-stream/MediaStream'
import { sendSignal } from '../_store/conferenceSocketMiddleware'
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


export function WebRTCProvider({ children, currentUserId }: { children: React.ReactNode; currentUserId: string }) {
  const { stream: localStream } = useMediaStreamContext()
  const [streams, setStreams] = useState<Record<string, MediaStream>>({})
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<Record<string, 'connecting' | 'connected' | 'disconnected'>>({})

  const participants = useSelector(ConferenceSelectors.selectUsers)
  const dialogId = useSelector(ConferenceSelectors.selectConferenceId)

  const peerConnections = useRef<Record<string, RTCPeerConnection>>({})

  const createPeerConnection = useCallback((targetUserId: string) => {
    if (peerConnections.current[targetUserId]) {
      console.log(`Reusing existing connection for ${targetUserId}`)
      return peerConnections.current[targetUserId]
    }

    console.log(`Creating new peer connection for ${targetUserId}`)
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
      ],
      // Добавляем обязательные медиа-форматы
      sdpSemantics: 'unified-plan',
    })

    // Добавляем логирование состояний
    peerConnection.oniceconnectionstatechange = () => {
      const state = peerConnection.iceConnectionState
      console.log(`ICE Connection State for ${targetUserId}:`, state)
      if (state === 'failed') {
        console.log('Attempting to restart ICE')
        peerConnection.restartIce()
      }
    }

    peerConnection.onsignalingstatechange = () => {
      console.log(`Signaling State for ${targetUserId}:`, peerConnection.signalingState)
    }

    // Обновляем состояние соединения
    peerConnection.onconnectionstatechange = () => {
      console.log(`Connection state changed for ${targetUserId}:`, peerConnection.connectionState)
      if (peerConnection.connectionState === 'failed') {
        // Попробуем переподключиться
        console.log(`Attempting to reconnect with ${targetUserId}`)
        peerConnection.restartIce()
      }
      setConnectionStatus((prev) => ({
        ...prev,
        [targetUserId]: peerConnection.connectionState as any,
      }))
    }

    // Добавляем локальные треки
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        console.log(`Adding ${track.kind} track to connection with ${targetUserId}`)
        const sender = peerConnection.addTrack(track, localStream)

        // Устанавливаем параметры для видео
        if (track.kind === 'video') {
          const params = sender.getParameters()
          if (!params.degradationPreference) {
            params.degradationPreference = 'maintain-framerate'
            sender.setParameters(params)
          }
        }
      })
    }

    // Обработка ICE кандидатов
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log(`Sending ICE candidate to ${targetUserId}`)
        sendSignal({
          targetUserId,
          signal: {
            type: 'ice-candidate',
            payload: event.candidate,
          },
          dialogId,
        })
      }
    }

    // Обработка входящих стримов
    peerConnection.ontrack = (event) => {
      console.log(`Received track from ${targetUserId}:`, event.track.kind)

      if (event.streams && event.streams[0]) {
        console.log(`Setting stream for ${targetUserId}`)
        setStreams((prev) => ({
          ...prev,
          [targetUserId]: event.streams[0],
        }))
      }
    }

    peerConnections.current[targetUserId] = peerConnection
    return peerConnection
  }, [localStream, dialogId])

  // Инициация исходящего соединения
  const initiateConnection = useCallback(async (targetUserId: string) => {
    console.log('Initiating connection with:', targetUserId)

    if (!localStream || !dialogId) {
      console.error('Missing requirements:', { hasLocalStream: !!localStream, dialogId })
      return
    }

    try {
      setIsConnecting(true)
      const peerConnection = createPeerConnection(targetUserId)

      const offer = await peerConnection.createOffer()
      await peerConnection.setLocalDescription(offer)

      console.log(`Sending offer to ${targetUserId}`)
      sendSignal({
        targetUserId,
        signal: {
          type: 'offer',
          // @ts-ignore
          payload: offer,
        },
        dialogId,
      })
    } catch (error) {
      console.error('Error in initiateConnection:', error)
      if (peerConnections.current[targetUserId]) {
        peerConnections.current[targetUserId].close()
        delete peerConnections.current[targetUserId]
      }
    } finally {
      setIsConnecting(false)
    }
  }, [createPeerConnection, dialogId, localStream])

  // Обработка входящих сигналов
  const handleSignal = useCallback(async (senderId: string, signal: any, targetUserId: string) => {
    console.log(`Handling signal from ${senderId}:`, signal.type)

    try {
      const peerConnection = createPeerConnection(senderId)

      switch (signal.type) {
        case 'offer':
          console.log(`Processing offer from ${senderId}`)
          // Убедимся, что соединение в правильном состоянии
          if (peerConnection.signalingState !== 'stable') {
            console.log('Resetting signaling state')
            await Promise.all([
              peerConnection.setLocalDescription({ type: 'rollback' }),
              peerConnection.setRemoteDescription(new RTCSessionDescription(signal.payload))
            ])
          } else {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(signal.payload))
          }

          console.log('Creating answer')
          const answer = await peerConnection.createAnswer()
          console.log('Setting local description')
          await peerConnection.setLocalDescription(answer)

          console.log(`Sending answer to ${senderId}`)
          sendSignal({
            targetUserId: senderId,
            signal: {
              type: 'answer',
              payload: answer,
            },
            dialogId,
          })
          break

        case 'answer':
          console.log(`Processing answer from ${senderId}`)
          await peerConnection.setRemoteDescription(new RTCSessionDescription(signal.payload))
          break

        case 'ice-candidate':
          console.log(`Processing ICE candidate from ${senderId}`)
          if (signal.payload.candidate) {
            try {
              await peerConnection.addIceCandidate(new RTCIceCandidate(signal.payload))
            } catch (e) {
              if (!peerConnection.remoteDescription) {
                console.log('Queuing ICE candidate until remote description is set')
                // Можно добавить очередь ICE кандидатов здесь, если нужно
              } else {
                throw e
              }
            }
          }
          break
      }
    } catch (error) {
      console.error(`Error handling signal from ${senderId}:`, error)
      // Пробуем пересоздать соединение в случае ошибки
      if (peerConnections.current[senderId]) {
        console.log(`Recreating connection with ${senderId} after error`)
        peerConnections.current[senderId].close()
        delete peerConnections.current[senderId]
        // Если это был offer, можно попробовать переподключиться
        if (signal.type === 'offer') {
          handleSignal(senderId, signal, targetUserId)
        }
      }
    }
  }, [createPeerConnection, dialogId])

  // Подключение к новым участникам
  useEffect(() => {
    if (!localStream || !dialogId) return

    participants.forEach((participantId) => {
      if (participantId !== currentUserId && !peerConnections.current[participantId]) {
        console.log(`Initiating connection with new participant: ${participantId}`)
        initiateConnection(participantId)
      }
    })
  }, [participants, currentUserId, initiateConnection, localStream, dialogId])

  // Очистка при отключении участников
  useEffect(() => {
    Object.keys(peerConnections.current).forEach((participantId) => {
      if (!participants.includes(participantId)) {
        console.log(`Cleaning up connection with ${participantId}`)
        peerConnections.current[participantId]?.close()
        delete peerConnections.current[participantId]

        setStreams((prev) => {
          const newStreams = { ...prev }
          delete newStreams[participantId]
          return newStreams
        })

        setConnectionStatus((prev) => {
          const newStatus = { ...prev }
          delete newStatus[participantId]
          return newStatus
        })
      }
    })
  }, [participants])

  // Обновление локального стрима
  useEffect(() => {
    if (localStream) {
      Object.entries(peerConnections.current).forEach(([userId, pc]) => {
        pc.getSenders().forEach((sender) => {
          const track = localStream.getTracks().find((t) => t.kind === sender.track?.kind)
          if (track) {
            console.log(`Updating ${track.kind} track for connection with ${userId}`)
            sender.replaceTrack(track)
          }
        })
      })
    }
  }, [localStream])

  return (
    <WebRTCContext.Provider value={{
      streams,
      isConnecting,
      connectionStatus,
      handleSignal, // Экспортируем функцию handleSignal
    }}
    >
      {children}
    </WebRTCContext.Provider>
  )
}

export const useWebRTCContext = () => useContext(WebRTCContext)
