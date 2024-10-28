import { AnyAction, Middleware } from '@reduxjs/toolkit'
import { Socket } from 'socket.io-client'
import { RootReducer } from '../../../../../store/root.reducer'
import { ConferenceSliceActions } from './conference.slice'
import { createSocket } from './createSocket.util'

let socket: Socket | null = null

export const getSocket = () => socket

export const conferenceSocketMiddleware: Middleware<{}, RootReducer> = (store) => (next) => (action: AnyAction) => {
  const { profile } = store.getState().profile

  if (action.type === '[CONFERENCE]/WEBSOCKET_CONNECT' && !socket && profile) {
    socket = createSocket({
      userId: profile.user_info.id,
      dialogId: action.payload.conferenceId,
    })
    store.dispatch(ConferenceSliceActions.setConferenceId(action.payload.conferenceId))

    socket.on('connect', () => {
      console.log('connected to conference')
      store.dispatch(ConferenceSliceActions.setConnected(true))
    })

    socket.on('disconnect', () => {
      console.log('disconnected from conference')
      store.dispatch(ConferenceSliceActions.setConnected(false))
    })

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      store.dispatch(ConferenceSliceActions.setError('Socket connection error'))
    })

    socket.on('user:left', (userId: string) => {
      store.dispatch(ConferenceSliceActions.setUserLeft(userId))
    })

    // Обработка присоединения нового участника (только один обработчик)
    socket.on('user:joined', (newUserId: string) => {
      store.dispatch(ConferenceSliceActions.setUserJoined(newUserId))
    })

    socket.on('room:participants', (ids: string[]) => {
      store.dispatch(ConferenceSliceActions.setParticipants(ids))
    })

    socket.on('signal', ({ userId, signal }) => {
      store.dispatch(ConferenceSliceActions.addSignal({ userId, signal }))
    })
  }

  if (!socket) return next(action)

  if (action.type === '[CONFERENCE]/SEND_SIGNAL') {
    const { targetUserId, signal } = action.payload
    socket.emit('signal', { targetUserId, signal })
  }

  switch (action.type) {
    case '[CONFERENCE]/WEBSOCKET_DISCONNECT': {
      socket.disconnect()
      socket = null
      store.dispatch(ConferenceSliceActions.setConnected(false))
      break
    }
    default: return next(action)
  }

  return next(action)
}
