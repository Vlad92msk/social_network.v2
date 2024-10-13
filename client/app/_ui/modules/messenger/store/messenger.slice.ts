import { createAsyncThunk, createSelector, PayloadAction } from '@reduxjs/toolkit'
import { CreatePublicationContextProps } from '@ui/components/create-publication'
import { getSocket } from '@ui/modules/messenger/store/socket.connect'
import { DialogEntity, DialogShortDto, MessageEntity } from '../../../../../../swagger/dialogs/interfaces-dialogs'
import { UserInfoDto } from '../../../../../../swagger/userInfo/interfaces-userInfo'
import { DialogEvents } from '../../../../../store/events/dialog-events-enum'
import { RootReducer } from '../../../../../store/root.reducer'
import { PaginationResponse } from '../../../../../store/types/request'
import { sliceBuilder } from '../../../../../store/utils/other'

export interface MessengerSliceState {
  isConnected: boolean;
  error: string | null;

  // ID открытого диалога
  currentDialogId: string
  // Пользователь, который выбран для диалога (с которым еще нет диалога)
  targetNewUserToDialog?: UserInfoDto
  currentDialog?: DialogEntity
  shortDialogs?: DialogShortDto[]

  messages: Record<string, PaginationResponse<MessageEntity[]>> // Словарь сообщений по диалогам
  participants: Record<string, any[]>; // Участники по диалогам
  activeParticipants: Record<string, number[]>; // Активные пользователи
}

export const messengerInitialState: MessengerSliceState = {
  currentDialogId: '',
  targetNewUserToDialog: undefined,
  currentDialog: undefined,

  messages: {},
  participants: {},
  activeParticipants: {},
  isConnected: false,
  error: null,
}

export const { actions: MessengerSliceActions, reducer: messengerReducer } = sliceBuilder(
  ({ createSlice, setState }) => createSlice({
    name: '[MESSENGER]',
    initialState: messengerInitialState,
    reducers: {
      setCurrentDialogId: setState<MessengerSliceState, string>('currentDialogId'),
      setTargetUserToDialog: setState<MessengerSliceState, UserInfoDto>('targetNewUserToDialog'),

      setShortDialogs: setState<MessengerSliceState, DialogShortDto[]>('shortDialogs'),

      receiveNeqDialog: (state, action: PayloadAction<DialogShortDto>) => {
        state.shortDialogs = (state.shortDialogs || []).concat(action.payload)
      },

      updateShortDialog: (state, action: PayloadAction<DialogShortDto>) => {
        state.shortDialogs = (state.shortDialogs || []).map((dialog) => {
          if (dialog.id !== action.payload.id) return dialog
          return action.payload
        })
      },

      setMessages: (state, action: PayloadAction<{ dialogId: string, message: MessageEntity }>) => {
        const { message, dialogId } = action.payload
        state.messages[dialogId].data.push(message)
      },

      setDialogHistory: (state, action: PayloadAction<{ dialog: DialogEntity, messages: PaginationResponse<MessageEntity[]>, activeParticipants: number[] }>) => {
        const { dialog, messages, activeParticipants } = action.payload
        state.currentDialog = dialog
        state.messages[dialog.id] = messages
        state.participants[dialog.id] = dialog.participants
        state.activeParticipants[dialog.id] = activeParticipants
      },

      setConnected: (state, action: PayloadAction<boolean>) => {
        state.isConnected = action.payload
      },
      setError: (state, action: PayloadAction<string>) => {
        state.error = action.payload
      },
    },
  }),
)

const selectSelf = (state: RootReducer) => state.messenger
const selectCurrentDialogId = createSelector(selectSelf, (profileState) => profileState.currentDialogId)

const selectCurrentDialogMessages = createSelector(
  [selectSelf, selectCurrentDialogId],
  (messenger, currentDialogId) => {
    if (!currentDialogId || !messenger.messages[currentDialogId]) return ({ data: [], paginationInfo: null })
    return messenger.messages[currentDialogId]
  },
)

export const MessengerSelectors = {
  selectCurrentDialogId: createSelector(selectSelf, (profileState) => profileState.currentDialogId),
  selectTargetNewUserToDialog: createSelector(selectSelf, (profileState) => profileState.targetNewUserToDialog),
  selectDialogList: createSelector(selectSelf, (profileState) => profileState.shortDialogs),
  selectCurrentDialog: createSelector(selectSelf, (messenger) => messenger.currentDialog),
  selectCurrentDialogMessages,
}


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
