// hooks/useConferenceSocket.ts

import { useCallback, useEffect, useRef } from 'react'
import { SocketService } from '../_services/socket.service'
import { WebRTCService } from '../_services/webrtc.service'
import { UseConferenceSocketProps, WebRTCSignal } from '../types/media'

export function useConferenceSocket(props: UseConferenceSocketProps) {
  const {
    dialogId,
    userId,
    stream,
    onUserJoined,
    onUserLeft,
    onSignal,
    getParticipants,
  } = props

  // Используем useRef для сохранения экземпляров сервисов между рендерами
  // Это нужно, чтобы не создавать новые экземпляры при каждом рендере
  const webRTCService = useRef(new WebRTCService())
  const socketService = useRef(new SocketService())

  // Генерируем случайный ID для гостей
  const guestUserId = useRef<string>(`guest_${Math.random().toString(36).substr(2, 9)}`)

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
   * Обработка входящих WebRTC сигналов
   * Это основная функция, которая управляет установкой P2P соединения
   */
  const handleSignal = useCallback(async (user_id: string, webRTCSignal: WebRTCSignal) => {
    // Получаем существующее соединение или создаем новое
    let pc = webRTCService.current.getPeerConnection(user_id)

    if (!pc) {
      // Создаем новое WebRTC соединение
      pc = await webRTCService.current.createPeerConnection(
        user_id,
        stream,
        // Callback для отправки ICE кандидатов
        (candidate) => {
          socketService.current.sendSignal(user_id, {
            type: 'ice-candidate',
            candidate,
          })
        },
        // Callback для обработки входящего медиа потока
        (track_stream) => {
          onSignal(user_id, {
            type: 'stream',
            stream: track_stream,
          })
        },
      )
    }

    try {
      // Обработка SDP сигналов (offer/answer)
      if (webRTCSignal.type === 'offer' || webRTCSignal.type === 'answer') {
        // Устанавливаем описание удаленного пира
        await pc.setRemoteDescription({
          type: webRTCSignal.type,
          sdp: webRTCSignal.sdp,
        })

        // Если получили offer, нужно создать и отправить answer
        if (webRTCSignal.type === 'offer') {
          const answer = await webRTCService.current.createAnswer(pc)
          socketService.current.sendSignal(user_id, createSDPSignal(answer))
        }
      }
      // Обработка ICE кандидатов
      else if (webRTCSignal.type === 'ice-candidate') {
        await pc.addIceCandidate(webRTCSignal.candidate)
      }
    } catch (error) {
      console.error('Error handling signal:', error)
    }
  }, [stream, createSDPSignal, onSignal])

  // Основной эффект для установки соединений
  useEffect(() => {
    if (!dialogId) return

    // Сохраняем ссылки на сервисы внутри эффекта для правильной очистки
    const webRTCServiceCurrent = webRTCService.current
    const socketServiceCurrent = socketService.current

    // Подключаемся к сокет-серверу
    const socket = socketServiceCurrent.connect('http://localhost:3001/conference', {
      dialogId,
      userId: userId ?? guestUserId.current,
    })

    // Обработка события присоединения нового участника
    socket.on('user:joined', async (newUserId: string) => {
      onUserJoined(newUserId)

      // Создаем новое WebRTC соединение с участником
      const pc = await webRTCServiceCurrent.createPeerConnection(
        newUserId,
        stream,
        // Callback для отправки ICE кандидатов
        (candidate) => {
          socketServiceCurrent.sendSignal(newUserId, {
            type: 'ice-candidate',
            candidate,
          })
        },
        // Callback для обработки входящего медиа потока
        (track_stream) => {
          onSignal(newUserId, {
            type: 'stream',
            stream: track_stream,
          })
        },
      )

      // Создаем и отправляем offer новому участнику
      const offer = await webRTCServiceCurrent.createOffer(pc)
      socketServiceCurrent.sendSignal(newUserId, createSDPSignal(offer))
    })

    // Обработка ухода участника
    socket.on('user:left', (user_id: string) => {
      onUserLeft(user_id)
      webRTCServiceCurrent.closePeerConnection(user_id)
    })

    // Обработка входящих сигналов
    socket.on('signal', ({ userId: id, signal }) => handleSignal(id, signal))

    // Получение списка участников
    socket.on('room:participants', getParticipants)

    // Функция очистки при размонтировании
    // eslint-disable-next-line consistent-return
    return () => {
      webRTCServiceCurrent.closeAllConnections()
      socketServiceCurrent.disconnect()
    }
  }, [dialogId, userId, stream, handleSignal, onUserJoined, onUserLeft, onSignal, getParticipants, createSDPSignal])

  // Возвращаем методы для использования в компоненте
  return {
    // Метод для отправки WebRTC сигналов
    sendSignal: (targetUserId: string, signal: WebRTCSignal) => {
      socketService.current.sendSignal(targetUserId, signal)
    },
    // Метод для отправки текстовых сообщений (опционально)
    sendMessage: (message: string) => {
      socketService.current.sendMessage(message)
    },
  }
}
