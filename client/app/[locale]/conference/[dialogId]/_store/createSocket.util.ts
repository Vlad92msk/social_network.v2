import { io } from 'socket.io-client'

export interface SocketConnectProps {
  dialogId?: string
  userId?: number
}

export const createSocket = (props: SocketConnectProps) => {
  const { dialogId, userId } = props
  const guestId = `guest_${Math.random().toString(36).substr(2, 9)}`

  return io('http://localhost:3001/conference', {
    path: '/socket.io',
    query: {
      dialogId,
      userId: userId ?? guestId,
    },
  })
}
