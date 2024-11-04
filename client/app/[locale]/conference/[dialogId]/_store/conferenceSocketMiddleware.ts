import { AnyAction, Middleware } from '@reduxjs/toolkit'
import { Socket } from 'socket.io-client'
import { WebRTCSignal } from '../types/media'
import { ConferenceSliceActions } from './conference.slice'
import { createSocket } from './createSocket.util'
import { RootReducer } from '../../../../../store/root.reducer'

let socket: Socket | null = null

export const getSocket = () => socket

const DEBUG = true

function debugLog(message: string, data?: any) {
  if (DEBUG) {
    console.log(`[WebSocket] ${message}`, data || '')
  }
}

export const sendSignal = ({ signal, dialogId, targetUserId }: { targetUserId: string, signal: any, dialogId: string }) => {
  debugLog('Sending Signal', { to: targetUserId, type: signal.type })
  socket?.emit('signal', { targetUserId, signal, dialogId })
}

export type SendSignalType = typeof sendSignal

export const conferenceSocketMiddleware: Middleware<{}, RootReducer> = (store) => (next) => (action: AnyAction) => {
  const { profile } = store.getState().profile

  if (action.type === '[CONFERENCE]/WEBSOCKET_CONNECT' && !socket && profile) {
    socket = createSocket({
      userId: profile.user_info.id,
      dialogId: action.payload.conferenceId,
    })
    store.dispatch(ConferenceSliceActions.setConferenceId(action.payload.conferenceId))

    socket.on('connect', () => {
      debugLog('WebSocket Connected')
      store.dispatch(ConferenceSliceActions.setConnected(true))
    })

    socket.on('disconnect', () => {
      debugLog('WebSocket Disconnected')
      store.dispatch(ConferenceSliceActions.setConnected(false))
    })

    socket.on('connect_error', (error) => {
      debugLog('WebSocket Connection Error', error)
      store.dispatch(ConferenceSliceActions.setError('Socket connection error'))
    })

    socket.on('user:left', (userId: string) => {
      debugLog('User Left', userId)
      store.dispatch(ConferenceSliceActions.setUserLeft(userId))
    })

    socket.on('user:joined', (newUserId: string) => {
      debugLog('Подключился новый пользователь', newUserId)
      store.dispatch(ConferenceSliceActions.setUserJoined(newUserId))
    })

    socket.on('room:participants', (ids: string[]) => {
      debugLog('Room Participants Updated', ids)
      store.dispatch(ConferenceSliceActions.setParticipants(ids))
    })

    socket.on('room:info', (data) => {
      debugLog('Получили инф о комнате', data)
      store.dispatch(ConferenceSliceActions.setRoomInfo(data))
    })

    socket.on('signal', ({ userId, signal }) => {
      debugLog('Получили сигнал', { from: userId, type: signal.type })
      store.dispatch(ConferenceSliceActions.addSignal({ userId, signal }))
    })
  }

  if (!socket) return next(action)

  switch (action.type) {
    case '[CONFERENCE]/WEBSOCKET_DISCONNECT': {
      debugLog('Отключились')
      socket.disconnect()
      socket = null
      store.dispatch(ConferenceSliceActions.setConnected(false))
      break
    }
    default: return next(action)
  }

  return next(action)
}
