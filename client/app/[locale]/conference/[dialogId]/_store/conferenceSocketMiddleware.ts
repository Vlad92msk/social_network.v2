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
      // console.log('Connected to conference server')
      store.dispatch(ConferenceSliceActions.setConnected(true))
    })

    socket.on('disconnect', () => {
      // console.log('Disconnected from conference server')
      store.dispatch(ConferenceSliceActions.setConnected(false))
    })

    socket.on('connect_error', (error) => {
      // console.error('Socket connection error:', error)
      store.dispatch(ConferenceSliceActions.setError('Socket connection error'))
    })

    socket.on('user:left', (userId: string) => {
      // console.log('User left:', userId)
      store.dispatch(ConferenceSliceActions.setUserLeft(userId))
    })

    socket.on('user:joined', (newUserId: string) => {
      // console.log('User joined:', newUserId)
      store.dispatch(ConferenceSliceActions.setUserJoined(newUserId))
    })

    socket.on('room:participants', (ids: string[]) => {
      // console.log('Room participants:', ids)
      store.dispatch(ConferenceSliceActions.setParticipants(ids))
    })

    socket.on('signal', ({ userId, signal }) => {
      // console.log('Received signal:', {
      //   from: userId,
      //   type: signal.type,
      //   timestamp: new Date().toISOString(),
      // })
      store.dispatch(ConferenceSliceActions.addSignal({ userId, signal }))
    })

    socket.on('signal:sent', (info) => {
      // console.log('Signal sent confirmation:', info)
    })
  }

  if (!socket) return next(action)

  if (action.type === ConferenceSliceActions.sendSignal.type) {
    const { targetUserId, signal } = action.payload
    // console.log('Sending signal:', {
    //   to: targetUserId,
    //   type: signal.type,
    //   timestamp: new Date().toISOString(),
    // })
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
