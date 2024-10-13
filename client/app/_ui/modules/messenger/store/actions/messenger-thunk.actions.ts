import { DialogEvents } from '../../../../../../store/events/dialog-events-enum'

/**
 * Отправить сообщение
 */
export const sendMessage = (dialogId: string | null, message: any) => ({
  type: 'WEBSOCKET_SEND_MESSAGE',
  payload: {
    event: DialogEvents.SEND_MESSAGE,
    data: { dialogId, message },
  },
})

/**
 * Присоединиться к диалогу
 */
export const joinToDialog = (dialogId: string) => ({
  type: 'WEBSOCKET_JOIN_DIALOG',
  payload: {
    event: DialogEvents.JOIN_DIALOG,
    data: { dialogId },
  },
})

/**
 * Удалить диалог
 */
export const removeDialog = (dialogId: string) => ({
  type: 'WEBSOCKET_REMOVE_DIALOG',
  payload: {
    event: DialogEvents.REMOVE_DIALOG,
    data: { dialogId },
  },
})

/**
 * Выйти из даилога (вообще из участников)
 */
export const exitFromDialog = (dialogId: string) => ({
  type: 'WEBSOCKET_EXIT_FROM_DIALOG',
  payload: {
    event: DialogEvents.EXIT_DIALOG,
    data: { dialogId },
  },
})

/**
 * Выйти из даилога
 */
export const leaveFromDialog = (dialogId: string) => ({
  type: 'WEBSOCKET_LEAVE_FROM_DIALOG',
  payload: {
    event: DialogEvents.EXIT_DIALOG,
    data: { dialogId },
  },
})
