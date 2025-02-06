import { AnyAction, Middleware } from '@reduxjs/toolkit'
import { Socket } from 'socket.io-client'
import { createSocketDialog } from '@ui/modules/messenger/store/utils'
import { MessengerSliceActions } from './messenger.slice'
import { DialogEntity, MessageEntity } from '../../../../../../swagger/dialogs/interfaces-dialogs'
import { DialogEvents } from '../../../../../store/events/dialog-events-enum'
import { RootReducer } from '../../../../../store/root.reducer'
import { UserStatus } from '../../../../types/user-status'

let socket: Socket | null = null

export const getSocket = () => socket

export const dialogSocketMiddleware: Middleware<{}, RootReducer> = (store) => (next) => (action: AnyAction) => {
  const { profile } = store.getState().profile

  if (action.type === 'WEBSOCKET_CONNECT' && !socket && profile) {
    socket = createSocketDialog({
      user_info_id: profile.user_info.id,
      user_public_id: profile.user_info.public_id,
      profile_id: profile.id,
    })

    // Настройка обработчиков событий сокета
    socket.on('connect', () => {
      console.log('connected to messenger')
      store.dispatch(MessengerSliceActions.setConnected(true))
    })

    socket.on('disconnect', () => {
      console.log('disconnected from messenger')
      store.dispatch(MessengerSliceActions.setConnected(false))
    })
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      store.dispatch(MessengerSliceActions.setError('Socket connection error'))
    })

    socket.on(DialogEvents.DIALOG_HISTORY, (history: { dialog: DialogEntity; activeParticipants: number[] }) => {
      store.dispatch(MessengerSliceActions.setDialogHistory(history))
    })

    socket.on(DialogEvents.USER_STATUS_CHANGED, (payload: { dialogId: string, userId: number, status: UserStatus }) => {
      store.dispatch(MessengerSliceActions.exitUpdateUserStatus(payload))
    })

    socket.on('conference:status', (payload) => {
      store.dispatch(MessengerSliceActions.setActiveConference(payload))
    })
  }

  if (!socket) return next(action)

  switch (action.type) {
    case 'WEBSOCKET_SEND_MESSAGE': {
      const { event, data } = action.payload
      socket.emit(event, data)
      break
    }
//...
    case 'WEBSOCKET_DISCONNECT': {
      socket.disconnect()
      socket = null
      store.dispatch(MessengerSliceActions.setConnected(false))
      break
    }
    default: return next(action)
  }
  return next(action)
}
