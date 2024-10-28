import { AnyAction, Middleware } from '@reduxjs/toolkit'
import { Socket } from 'socket.io-client'
import { ConferenceSliceActions } from './conference.slice'
import { createSocket } from './createSocket.util'
import { RootReducer } from '../../../../../store/root.reducer'

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



    // Обработка присоединения нового участника
    socket.on('user:joined', async (newUserId: string) => {
      console.log('onUserJoined', newUserId)
      store.dispatch(ConferenceSliceActions.setUserJoined(newUserId))
      // Создаем новое соединение и отправляем offer
    })

    // Обработка ухода участника
    socket.on('user:left', (userId: string) => {
      store.dispatch(ConferenceSliceActions.setUserLeft(userId))
    })

    // Обработка сигналов WebRTC
    socket.on('signal', ({ userId: id, signal }) => {
      // store.dispatch(ConferenceSliceActions.setError('Socket connection error'))
      // handleSignal(id, signal)
    })

    socket.on('room:participants', (ids: string[]) => {
      store.dispatch(ConferenceSliceActions.setParticipants(ids))
      // handleSignal(id, signal)

    })
  }

  if (!socket) return next(action)

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
