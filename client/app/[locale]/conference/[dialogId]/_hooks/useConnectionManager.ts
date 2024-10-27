// hooks/useConnectionManager.ts

import { useEffect } from 'react'
import { useWebRTCSignal } from './useWebRTCSignal'
import { SocketService } from '../_services/socket.service'
import { WebRTCService } from '../_services/webrtc.service'
import { WebRTCSignal } from '../types/media'

interface UseConnectionManagerProps {
  dialogId: string;
  userId?: number;
  stream?: MediaStream;
  onUserJoined: (userId: string) => void;
  onUserLeft: (userId: string) => void;
  onSignal: (userId: string, signal: WebRTCSignal) => void;
  getParticipants: (participants: string[]) => void;
  webRTCService: WebRTCService;
  socketService: SocketService;
}

/**
 * Хук для управления соединениями конференции
 * Обрабатывает подключение/отключение участников и управляет жизненным циклом соединений
 */
export function useConnectionManager(props: UseConnectionManagerProps) {
  const {
    dialogId,
    userId,
    stream,
    onUserJoined,
    onUserLeft,
    onSignal,
    getParticipants,
    webRTCService,
    socketService,
  } = props

  const { handleSignal, createConnection } = useWebRTCSignal({
    stream,
    onSignal,
    webRTCService,
    socketService,
  })

  useEffect(() => {
    if (!dialogId) return

    const guestId = `guest_${Math.random().toString(36).substr(2, 9)}`

    // Подключаемся к сокет-серверу
    const socket = socketService.connect('http://localhost:3001/conference', {
      dialogId,
      userId: userId ?? guestId,
    })

    // Обработка присоединения нового участника
    socket.on('user:joined', async (newUserId: string) => {
      onUserJoined(newUserId)
      // Создаем новое соединение и отправляем offer
      await createConnection(newUserId, true)
    })

    // Обработка ухода участника
    socket.on('user:left', (userId: string) => {
      onUserLeft(userId)
      webRTCService.closePeerConnection(userId)
    })

    // Обработка сигналов WebRTC
    socket.on('signal', ({ userId: id, signal }) => handleSignal(id, signal))
    socket.on('room:participants', getParticipants)

    // eslint-disable-next-line consistent-return
    return () => {
      webRTCService.closeAllConnections()
      socketService.disconnect()
    }
  }, [
    dialogId,
    userId,
    onUserJoined,
    onUserLeft,
    getParticipants,
    handleSignal,
    createConnection,
    webRTCService,
    socketService,
  ])
}
