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
      store.dispatch(ConferenceSliceActions.setConnected(true))
    })

    socket.on('disconnect', () => {
      store.dispatch(ConferenceSliceActions.setConnected(false))
    })

    socket.on('connect_error', (error) => {
      store.dispatch(ConferenceSliceActions.setError('Socket connection error'))
    })

    socket.on('user:left', (userId: string) => {
      store.dispatch(ConferenceSliceActions.setUserLeft(userId))
    })

    socket.on('user:joined', (newUserId: string) => {
      store.dispatch(ConferenceSliceActions.setUserJoined(newUserId))
    })

    socket.on('room:participants', (ids: string[]) => {
      store.dispatch(ConferenceSliceActions.setParticipants(ids))
    })

    socket.on('signal', ({ userId, signal }) => {
      store.dispatch(ConferenceSliceActions.addSignal({ userId, signal }))
    })

    socket.on('signal:sent', (info) => {
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
    case ConferenceSliceActions.sendSignal.type: {
      const { targetUserId, signal } = action.payload

      socket.emit('signal', { targetUserId, signal })
      break
    }
    default: return next(action)
  }

  return next(action)
}
