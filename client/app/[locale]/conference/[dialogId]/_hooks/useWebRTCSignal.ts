// hooks/useWebRTCSignal.ts

import { useCallback } from 'react'
import { SocketService } from '../_services/socket.service'
import { WebRTCService } from '../_services/webrtc.service'
import { WebRTCSignal } from '../types/media'

interface UseWebRTCSignalProps {
  stream?: MediaStream;
  onSignal: (userId: string, signal: WebRTCSignal) => void;
  webRTCService: WebRTCService;
  socketService: SocketService;
}

/**
 * Хук для обработки WebRTC сигналов
 * Управляет установкой P2P соединений и обменом SDP/ICE сигналами
 */
export function useWebRTCSignal(props: UseWebRTCSignalProps) {
  const { stream, onSignal, webRTCService, socketService } = props

  /**
   * Преобразует RTCSessionDescriptionInit (внутренний формат WebRTC)
   * в наш формат WebRTCSignal для отправки через сокеты
   */
  const createSDPSignal = useCallback((description: RTCSessionDescriptionInit): WebRTCSignal => {
    if (description.type !== 'offer' && description.type !== 'answer') {
      throw new Error('Invalid SDP type')
    }
    return {
      type: description.type,
      sdp: description.sdp || '',
    }
  }, [])

  /**
   * Создает новое WebRTC соединение с участником
   */
  const createConnection = useCallback(async (
    userId: string,
    isInitiator: boolean = false,
  ) => {
    console.log('____11_____111__')
    const pc = await webRTCService.createPeerConnection(
      userId,
      stream,
      // Callback для отправки ICE кандидатов
      (candidate) => {
        socketService.sendSignal(userId, {
          type: 'ice-candidate',
          candidate,
        })
      },
      // Callback для обработки входящего медиа потока
      (trackStream) => {
        console.log('mmmmmmmmm')
        onSignal(userId, {
          type: 'stream',
          stream: trackStream,
        })
      },
    )

    // Если мы инициатор, создаем и отправляем offer
    if (isInitiator) {
      const offer = await webRTCService.createOffer(pc)
      socketService.sendSignal(userId, createSDPSignal(offer))
    }

    return pc
  }, [stream, webRTCService, socketService, onSignal, createSDPSignal])

  /**
   * Обработка входящих WebRTC сигналов
   * Это основная функция, которая управляет установкой P2P соединения
   */
  const handleSignal = useCallback(async (userId: string, webRTCSignal: WebRTCSignal) => {
    let pc = webRTCService.getPeerConnection(userId)

console.log('pc___', pc)
    try {
      // Создаем соединение, если его еще нет
      if (!pc) {
        pc = await createConnection(userId)
      }

      // Обработка SDP сигналов
      if (webRTCSignal.type === 'offer' || webRTCSignal.type === 'answer') {
        await pc.setRemoteDescription({
          type: webRTCSignal.type,
          sdp: webRTCSignal.sdp,
        })

        // Если получили offer, создаем и отправляем answer
        if (webRTCSignal.type === 'offer') {
          const answer = await webRTCService.createAnswer(pc)
          socketService.sendSignal(userId, createSDPSignal(answer))
        }
      }
      // Обработка ICE кандидатов
      else if (webRTCSignal.type === 'ice-candidate') {
        await pc.addIceCandidate(webRTCSignal.candidate)
      }
    } catch (error) {
      console.error('Error handling signal:', error)
    }
  }, [webRTCService, createConnection, socketService, createSDPSignal])

  return {
    handleSignal,
    createConnection,
  }
}
