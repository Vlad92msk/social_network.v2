import { DialogEvents } from '../../../../../../store/events/dialog-events-enum'

export const sendMessage = (dialogId: string | null, message: any) => ({
  type: 'WEBSOCKET_SEND_MESSAGE',
  payload: {
    event: DialogEvents.SEND_MESSAGE,
    data: { dialogId, message },
  },
})

export const joinToDialog = (dialogId: string) => ({
  type: 'WEBSOCKET_JOIN_DIALOG',
  payload: {
    event: DialogEvents.JOIN_DIALOG,
    data: { dialogId },
  },
})
