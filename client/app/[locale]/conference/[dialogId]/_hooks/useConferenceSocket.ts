// hooks/useConferenceSocket.ts

import { useRef } from 'react'
import { useConnectionManager } from './useConnectionManager'
import { SocketService } from '../_services/socket.service'
import { WebRTCService } from '../_services/webrtc.service'
import { UseConferenceSocketProps, WebRTCSignal } from '../types/media'

export function useConferenceSocket(props: UseConferenceSocketProps) {
  const webRTCService = useRef(new WebRTCService())
  const socketService = useRef(new SocketService())

  // Управление соединениями
  useConnectionManager({
    ...props,
    webRTCService: webRTCService.current,
    socketService: socketService.current,
  })

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
