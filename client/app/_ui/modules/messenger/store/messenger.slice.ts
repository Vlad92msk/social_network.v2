import { PayloadAction } from '@reduxjs/toolkit'
import { DialogEntity, DialogShortDto, MessageEntity } from '../../../../../../swagger/dialogs/interfaces-dialogs'
import { UserInfoDto } from '../../../../../../swagger/userInfo/interfaces-userInfo'
import { PaginationResponse } from '../../../../../store/types/request'
import { sliceBuilder } from '../../../../../store/utils/other'
import { UserStatus } from '../../../../types/user-status'

export interface MessengerSliceState {
  isConnected: boolean
  error: string | null

  drawerStatus: 'open' | 'close'
  chatingPanelStatus: 'open' | 'close'
  // ID открытого диалога
  currentDialogId: string
  // Пользователь, который выбран для диалога (с которым еще нет диалога)
  targetNewUserToDialog?: UserInfoDto
  currentDialog?: DialogEntity
  shortDialogs?: DialogShortDto[]

  messages: Record<string, PaginationResponse<MessageEntity[]>> // Словарь сообщений по диалогам
  participants: Record<string, any[]> // Участники по диалогам
  activeParticipants: Record<string, number[]> // Активные пользователи
}

export const messengerInitialState: MessengerSliceState = {
  currentDialogId: '',
  targetNewUserToDialog: undefined,
  currentDialog: undefined,

  chatingPanelStatus: 'close',
  drawerStatus: 'open',

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
        if (!state.currentDialogId) {
          state.currentDialogId = dialog.id
        }
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
      removeDialog: (state, action: PayloadAction<{ removedDialogId: string }>) => {
        state.shortDialogs = state.shortDialogs?.filter(({ id }) => id !== action.payload.removedDialogId)
        state.currentDialogId = ''
        state.currentDialog = undefined
        state.targetNewUserToDialog = undefined
        delete state.messages[action.payload.removedDialogId]
        delete state.participants[action.payload.removedDialogId]
      },
      exitDialog: (state, action: PayloadAction<{ exitDialogId: string }>) => {
        state.shortDialogs = state.shortDialogs?.filter(({ id }) => id !== action.payload.exitDialogId)
      },

      exitUpdateUserStatus: (state, action: PayloadAction<{ dialogId: string, userId: number, status: UserStatus }>) => {
        const { status, userId, dialogId } = action.payload
        console.log('action.payload', action.payload)
        if (status === UserStatus.Offline) {
          state.activeParticipants[dialogId] = state.activeParticipants[dialogId]?.filter((id) => id !== userId)
        } else {
          state.activeParticipants[dialogId].push(userId)
        }
      },

      setChattingPanelStatus: (state, action: PayloadAction<'open' | 'close'>) => {
        state.chatingPanelStatus = action.payload
      },
      setDrawerStatus: (state) => {
        state.drawerStatus = state.drawerStatus === 'open' ? 'close' : 'open'
      },
    },
  }),
)
