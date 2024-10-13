import { io } from 'socket.io-client'

export interface SocketConnectProps {
  profile_id?: number
  user_info_id?: number
  user_public_id?: string
}

export const createSocket = (props: SocketConnectProps) => {
  const { profile_id, user_info_id, user_public_id } = props

  return io('http://localhost:3001/dialog', {
    path: '/socket.io',
    auth: { profile_id, user_info_id, user_public_id },
  })
}
