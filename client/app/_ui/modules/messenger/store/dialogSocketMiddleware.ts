import { AnyAction, Middleware } from '@reduxjs/toolkit'
import { Socket } from 'socket.io-client'
import { createSocket } from '@ui/modules/messenger/store/utils'
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
    socket = createSocket({
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
    socket.on(DialogEvents.USER_TYPING, (payload: { dialogId: string, userId: number, isTyping: boolean }) => {
      store.dispatch(MessengerSliceActions.exitUserTyping(payload))
    })

    socket.on(DialogEvents.UPDATED_FIXED_MESSAGES, (payload: { dialog_id: string, new_fixed_messages: MessageEntity[]}) => {
      store.dispatch(MessengerSliceActions.updateFixedMessages(payload))
    })

    socket.on(DialogEvents.UPDATE_DIALOG_INFO, (payload: { data: DialogEntity }) => {
      console.log('payload', payload)
      store.dispatch(MessengerSliceActions.updateDialogInfo(payload))
    })
  }

  if (!socket) return next(action)

  switch (action.type) {
    case MessengerSliceActions.setChattingPanelStatus.type: {
      if (action.payload === 'open') {
        store.dispatch(MessengerSliceActions.addUndoAction(MessengerSliceActions.setChattingPanelStatus('close')))
      } else if (action.payload === 'close') {
        const stack = store.getState().messenger.undoStack

        const lastUndoAction = stack[stack.length - 1]
        if (lastUndoAction.type === MessengerSliceActions.setChattingPanelStatus('close').type) {
          store.dispatch(MessengerSliceActions.removeLastUndoAction())
        }
      }
      break
    }
    case MessengerSliceActions.executeLastUndoAction.type: {
      // Получаем последнее действие отмены из стэка
      const state = store.getState().messenger
      const lastUndoAction = state.undoStack[state.undoStack.length - 1]
      if (lastUndoAction) {
        // Выполняем последнее действие
        store.dispatch(lastUndoAction)
      }
      break
    }

    case 'WEBSOCKET_SEND_MESSAGE': {
      const { event, data } = action.payload
      socket.emit(event, data)
      break
    }
    case 'WEBSOCKET_JOIN_DIALOG': {
      const { event, data } = action.payload
      if (data.dialogId) {
        socket.emit(event, data)
      }
      break
    }
    case 'WEBSOCKET_LEAVE_FROM_DIALOG': {
      const { event, data } = action.payload
      if (data.dialogId) {
        socket.emit(event, data)
      }
      break
    }
    case 'WEBSOCKET_START_TYPING_TO_DIALOG': {
      const { event, data } = action.payload
      if (data.dialogId) {
        socket.emit(event, data)
      }
      break
    }
    case 'WEBSOCKET_STOP_TYPING_TO_DIALOG': {
      const { event, data } = action.payload
      if (data.dialogId) {
        socket.emit(event, data)
      }
      break
    }
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
