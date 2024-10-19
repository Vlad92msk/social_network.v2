import { PayloadAction } from '@reduxjs/toolkit'
import { DialogEntity, DialogShortDto, MessageEntity } from '../../../../../../swagger/dialogs/interfaces-dialogs'
import { UserInfoDto } from '../../../../../../swagger/userInfo/interfaces-userInfo'
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

  typing: Record<string, Record<number, boolean>> // Отслеживание печати
  activeParticipants: Record<string, number[]> // Активные пользователи
}

export const messengerInitialState: MessengerSliceState = {
  currentDialogId: '',
  targetNewUserToDialog: undefined,
  currentDialog: undefined,

  chatingPanelStatus: 'close',
  drawerStatus: 'open',

  typing: {},
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
      setTargetUserToDialog: setState<MessengerSliceState, UserInfoDto | undefined>('targetNewUserToDialog'),

      setShortDialogs: setState<MessengerSliceState, DialogShortDto[]>('shortDialogs'),

      setDialogHistory: (state, action: PayloadAction<{ dialog: DialogEntity, activeParticipants: number[] }>) => {
        const { dialog, activeParticipants } = action.payload
        if (!state.currentDialogId) {
          state.currentDialogId = dialog.id
        }
        state.currentDialog = dialog
        state.activeParticipants[dialog.id] = activeParticipants
      },

      setConnected: (state, action: PayloadAction<boolean>) => {
        state.isConnected = action.payload
      },
      setError: (state, action: PayloadAction<string>) => {
        state.error = action.payload
      },

      exitUserTyping: (state, action: PayloadAction<{ dialogId: string, userId: number, isTyping: boolean }>) => {
        const { dialogId, userId, isTyping } = action.payload
        state.typing[dialogId] = {
          ...state.typing[dialogId],
          [userId]: isTyping,
        }
      },

      updateFixedMessages: (state, action: PayloadAction<{ dialog_id: string, new_fixed_messages: MessageEntity[] }>) => {
        const { new_fixed_messages } = action.payload
        if (state.currentDialog) {
          state.currentDialog.fixed_messages = new_fixed_messages
        }
      },

      exitUpdateUserStatus: (state, action: PayloadAction<{ dialogId: string, userId: number, status: UserStatus }>) => {
        const { status, userId, dialogId } = action.payload
        if (status === UserStatus.Offline) {
          state.activeParticipants[dialogId] = state.activeParticipants[dialogId]?.filter((id) => id !== userId)
        } else {
          state.activeParticipants[dialogId].push(userId)
        }
      },

      setChattingPanelStatus: (state, action: PayloadAction<'open' | 'close'>) => {
        state.chatingPanelStatus = action.payload
        if (action.payload === 'close') {
          state.currentDialogId = ''
          state.currentDialog = undefined
          state.targetNewUserToDialog = undefined
        }
      },
      setDrawerStatus: (state) => {
        state.drawerStatus = state.drawerStatus === 'open' ? 'close' : 'open'
      },
    },
  }),
)
