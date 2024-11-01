'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useMediaStreamContext } from '@ui/components/media-stream/MediaStream'
import { ConferenceSliceActions } from '../_store/conference.slice'
import { ConferenceSelectors } from '../_store/selectors'
import { selectConferenceId } from '../_store/selectors/conference.selectors'

interface WebRTCContextValue {
  streams: Record<string, MediaStream>;
  isConnecting: boolean;
  connectionStatus: Record<string, 'connecting' | 'connected' | 'disconnected'>;
}

const WebRTCContext = createContext<WebRTCContextValue>({
  streams: {},
  isConnecting: false,
  connectionStatus: {},
})

// Конфигурация STUN/TURN серверов
const RTCConfiguration: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
  ],
}

export function WebRTCProvider({ children, currentUserId }: { children: React.ReactNode; currentUserId: string }) {
  const dispatch = useDispatch()
  const { stream: localStream } = useMediaStreamContext()
  const [streams, setStreams] = useState<Record<string, MediaStream>>({})
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<Record<string, 'connecting' | 'connected' | 'disconnected'>>({})

  const participants = useSelector(ConferenceSelectors.selectUsers)
  const dialogId = useSelector(ConferenceSelectors.selectConferenceId)
  console.log('participants', participants)

  // Храним peer connections в ref чтобы избежать проблем с замыканиями
  const peerConnections = useRef<Record<string, RTCPeerConnection>>({})

  // Создание нового peer connection
  const createPeerConnection = useCallback((targetUserId: string) => {
    if (peerConnections.current[targetUserId]) {
      return peerConnections.current[targetUserId]
    }

    const peerConnection = new RTCPeerConnection(RTCConfiguration)

    // Добавляем локальные треки
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream)
      })
    }

    console.log('__peerConnection___', peerConnection)

    // Обработка ICE кандидатов
    peerConnection.onicecandidate = (event) => {
      console.log('__event.candidate.event___', event)
      if (event.candidate) {
        console.log('__event.candidate___')
        dispatch(ConferenceSliceActions.sendSignal({
          targetUserId,
          signal: {
            type: 'ice-candidate',
            // @ts-ignore
            payload: event.candidate,
          },
          dialogId,
        }))
      }
    }

    // Обработка изменения состояния соединения
    peerConnection.onconnectionstatechange = () => {
      setConnectionStatus((prev) => ({
        ...prev,
        [targetUserId]: peerConnection.connectionState as any,
      }))
    }

    // Обработка входящих стримов
    peerConnection.ontrack = (event) => {
      setStreams((prev) => ({
        ...prev,
        [targetUserId]: event.streams[0],
      }))
    }

    peerConnections.current[targetUserId] = peerConnection
    return peerConnection
  }, [localStream, dispatch, dialogId])

  // Инициация исходящего соединения
  const initiateConnection = useCallback(async (targetUserId: string) => {
    console.log('Чтото делаем', targetUserId)
    try {
      setIsConnecting(true)
      const peerConnection = createPeerConnection(targetUserId)
      console.log('peerConnection', peerConnection)
      const offer = await peerConnection.createOffer()
      await peerConnection.setLocalDescription(offer)
      console.log('Отправляем офер', {
        targetUserId,
        signal: {
          type: 'offer',
          // @ts-ignore
          payload: offer,
        },
        dialogId,
      })
      dispatch(ConferenceSliceActions.sendSignal({
        targetUserId,
        signal: {
          type: 'offer',
          // @ts-ignore
          payload: offer,
        },
        dialogId,
      }))
    } catch (error) {
      console.error('Error creating offer:', error)
    } finally {
      setIsConnecting(false)
    }
  }, [createPeerConnection, dialogId, dispatch])

  // Обработка входящих сигналов
  const handleSignal = useCallback(async (senderId: string, signal: any, targetUserId: string) => {
    const peerConnection = createPeerConnection(senderId)

    try {
      switch (signal.type) {
        case 'offer':
          await peerConnection.setRemoteDescription(new RTCSessionDescription(signal.payload))
          const answer = await peerConnection.createAnswer()
          await peerConnection.setLocalDescription(answer)

          dispatch(ConferenceSliceActions.sendSignal({
            targetUserId,
            signal: {
              type: 'answer',
              // @ts-ignore
              payload: answer,
            },
            dialogId,
          }))
          break

        case 'answer':
          await peerConnection.setRemoteDescription(new RTCSessionDescription(signal.payload))
          break

        case 'ice-candidate':
          if (peerConnection.remoteDescription) {
            await peerConnection.addIceCandidate(new RTCIceCandidate(signal.payload))
          }
          break
      }
    } catch (error) {
      console.error('Error handling signal:', error)
    }
  }, [createPeerConnection, dispatch])

  // Подключение к новым участникам
  useEffect(() => {
    participants.forEach((participant) => {
      if (participant !== currentUserId && !peerConnections.current[participant]) {
        console.log('___111___')
        initiateConnection(participant)
      }
    })
  }, [participants, currentUserId, initiateConnection])

  // Очистка при отключении участников
  useEffect(() => {
    Object.keys(peerConnections.current).forEach((participantId) => {
      if (!participants.find((p) => p === participantId)) {
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
      Object.values(peerConnections.current).forEach((pc) => {
        pc.getSenders().forEach((sender) => {
          const track = localStream.getTracks().find((t) => t.kind === sender.track?.kind)
          if (track) {
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
    }}
    >
      {children}
    </WebRTCContext.Provider>
  )
}

export const useWebRTCContext = () => useContext(WebRTCContext)
