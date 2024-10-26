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
    if (!dialogId) {
      console.warn('dialogId is not set, skipping socket connection')
      return
    }

    console.log('Attempting to connect to socket with dialogId:', dialogId)

    socket.current = io('http://localhost:3001/conference', {
      path: '/socket.io',
      query: { dialogId },
    })

    socket.current.on('connect', () => {
      console.log('Connected to socket server')
    })

    socket.current.on('connect_error', (err) => {
      console.error('Socket connection error:', err)
    })

    socket.current.on('user:joined', onUserJoined)
    socket.current.on('user:left', onUserLeft)
    socket.current.on('signal', onSignal)

    return () => {
      console.log('Disconnecting socket')
      if (socket.current) {
        socket.current.disconnect()
      }
    }
  }, [dialogId, onUserJoined, onUserLeft, onSignal])

  // Метод для отправки сигналов
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
