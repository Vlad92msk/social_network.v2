// hooks/useConferenceSocket.ts
import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

interface UseConferenceSocketProps {
  dialogId: string
  onUserJoined: (userId: string) => void
  onUserLeft: (userId: string) => void
  onSignal: (userId: string, signal: any) => void
}

export function useConferenceSocket({
  dialogId,
  onUserJoined,
  onUserLeft,
  onSignal,
}: UseConferenceSocketProps) {
  const socket = useRef<Socket | null>(null)

  useEffect(() => {
    // Подключаемся к серверу
    socket.current = io('http://localhost:3001/conference', {
      path: '/socket.io',
      query: { dialogId },
    })

    // Обработчики событий
    socket.current.on('user:joined', onUserJoined)
    socket.current.on('user:left', onUserLeft)
    socket.current.on('signal', onSignal)

    return () => {
      if (socket.current) {
        socket.current.disconnect()
      }
    }
  }, [dialogId, onUserJoined, onUserLeft, onSignal])

  // Методы для отправки сигналов
  const sendSignal = (targetUserId: string, signal: any) => {
    socket.current?.emit('signal', {
      targetUserId,
      signal,
    })
  }

  return {
    sendSignal,
  }
}
