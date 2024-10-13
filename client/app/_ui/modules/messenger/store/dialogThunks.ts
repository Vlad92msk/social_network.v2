import { AnyAction, Middleware } from '@reduxjs/toolkit'
import { createSocket } from '@ui/modules/messenger/store/socket.connect'
import { Socket } from 'socket.io-client'
import { DialogEntity, DialogShortDto, MessageEntity } from '../../../../../../swagger/dialogs/interfaces-dialogs'
import { DialogEvents } from '../../../../../store/events/dialog-events-enum'
import { RootReducer } from '../../../../../store/root.reducer'
import { PaginationResponse } from '../../../../../store/types/request'
import { MessengerSliceActions } from './messenger.slice'

let socket: Socket | null = null

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

    // Обработчики событий диалогов
    socket.on(DialogEvents.GET_DIALOGS, (userDialogs: DialogShortDto[]) => {
      store.dispatch(MessengerSliceActions.setShortDialogs(userDialogs))
    })

    socket.on(DialogEvents.NEW_DIALOG, (newDialog: DialogShortDto) => {
      store.dispatch(MessengerSliceActions.receiveNeqDialog(newDialog))
    })

    socket.on(DialogEvents.DIALOG_SHORT_UPDATED, (updatedDialog: DialogShortDto) => {
      store.dispatch(MessengerSliceActions.updateShortDialog(updatedDialog))
    })

    socket.on(DialogEvents.NEW_MESSAGE, ({ dialogId, message }: { dialogId: string; message: MessageEntity }) => {
      store.dispatch(MessengerSliceActions.setMessages({ dialogId, message }))
    })

    socket.on(DialogEvents.DIALOG_HISTORY, (history: { dialog: DialogEntity; messages: PaginationResponse<MessageEntity[]>; activeParticipants: number[] }) => {
      store.dispatch(MessengerSliceActions.setDialogHistory(history))
    })
  }

  // Обработка действий, связанных с WebSocket
  if (action.type === 'WEBSOCKET_SEND_MESSAGE' && socket) {
    const { event, data } = action.payload
    console.log('Отправляем сообщение:', data)
    socket.emit(event, data)
  } else if (action.type === 'WEBSOCKET_JOIN_DIALOG' && socket) {
    const { event, data } = action.payload
    console.log('Присоединяемся к диалогу:', data)
    socket.emit(event, data)
  } else if (action.type === 'WEBSOCKET_DISCONNECT') {
    if (socket) {
      socket.disconnect()
      socket = null
      store.dispatch(MessengerSliceActions.setConnected(false))
    }
  }
  return next(action)
}
