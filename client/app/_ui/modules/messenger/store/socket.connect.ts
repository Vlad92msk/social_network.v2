import { io, Socket } from 'socket.io-client'
// import { DialogEvents } from './events'; // Импортируй свои события
// import { ClientToServerEvents, ServerToClientEvents } from './types'; // Опиши типы событий

// let socket: Socket<ClientToServerEvents, ServerToClientEvents>;
let socket: Socket

export interface SocketConnectProps {
  profile_id?: number
  user_info_id?: number
  user_public_id?: string
}

export const connectSocket = (props: SocketConnectProps) => {
  const { profile_id, user_info_id, user_public_id } = props

  if (socket && socket.connected) return socket

  if (!socket) {
    socket = io('http://localhost:3001/dialog', {
      path: '/socket.io',
      auth: { profile_id, user_info_id, user_public_id },
    })
  }
  return socket
}

export const createSocket = (props: SocketConnectProps) => {
  const { profile_id, user_info_id, user_public_id } = props

  return io('http://localhost:3001/dialog', {
    path: '/socket.io',
    auth: { profile_id, user_info_id, user_public_id },
  })
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
  }
}

export const getSocket = () => socket
