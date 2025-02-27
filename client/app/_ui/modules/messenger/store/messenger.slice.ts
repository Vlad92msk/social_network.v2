import { PayloadAction } from '@reduxjs/toolkit'
import { DialogEntity, DialogShortDto, MessageEntity } from '../../../../../../swagger/dialogs/interfaces-dialogs'
import { UserInfoDto } from '../../../../../../swagger/userInfo/interfaces-userInfo'
import { sliceBuilder } from '../../../../../store/utils/other'
import { UserStatus } from '../../../../types/user-status'

export enum SelectDialogType {
  PRIVATE ='private',
  PUBLIC = 'public'
}

export interface MessengerSliceState {
  isConnected: boolean
  error: string | null

  drawerStatus: 'open' | 'close'
  chatingPanelStatus: 'open' | 'close'
  infoPanelStatus: 'open' | 'close'
  selectType: SelectDialogType

  // ID открытого диалога
  currentDialogId: string
  // Пользователь, который выбран для диалога (с которым еще нет диалога)
  targetNewUserToDialog?: UserInfoDto
  currentDialog?: DialogEntity
  shortDialogs?: DialogShortDto[]

  // Отслеживание печати
  typing: Record<string, Record<number, boolean>>
  // Активные пользователи
  activeParticipants: Record<string, number[]>
  activeConference: Record<string, boolean>

  undoStack: PayloadAction<any>[]; // Стек для хранения отменяющих событий
}

export const messengerInitialState: MessengerSliceState = {
  currentDialogId: '',
  targetNewUserToDialog: undefined,
  currentDialog: undefined,

  selectType: SelectDialogType.PUBLIC,

  chatingPanelStatus: 'close',
  drawerStatus: 'open',
  infoPanelStatus: 'close',

  typing: {},
  activeParticipants: {},
  isConnected: false,
  error: null,

  activeConference: {},

  undoStack: [],
}

export const { actions: MessengerSliceActions, reducer: messengerReducer } = sliceBuilder(
  ({ createSlice, setState }) => createSlice({
    name: '[MESSENGER]',
    initialState: messengerInitialState,
    reducers: {
      setCurrentDialogId: setState<MessengerSliceState, string>('currentDialogId'),
      setTargetUserToDialog: setState<MessengerSliceState, UserInfoDto | undefined>('targetNewUserToDialog'),

      setShortDialogs: setState<MessengerSliceState, DialogShortDto[]>('shortDialogs'),
      setSelectType: setState<MessengerSliceState, SelectDialogType>('selectType'),

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

      setActiveConference: (state, action: PayloadAction<{ dialogId: string, active: boolean }>) => {
        const { dialogId, active } = action.payload
        state.activeConference[dialogId] = active
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

      updateDialogInfo: (state, action: PayloadAction<{ data: DialogEntity }>) => {
        const { data } = action.payload
        if (state.currentDialog) {
          state.currentDialog.title = data.title
          state.currentDialog.description = data.description
          state.currentDialog.image = data.image
          state.currentDialog.type = data.type
          state.currentDialog.participants = data.participants
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
      setInfoPanelStatus: (state) => {
        state.infoPanelStatus = state.infoPanelStatus === 'open' ? 'close' : 'open'
      },

      addUndoAction: (state, action: PayloadAction<any>) => {
        state.undoStack.push(action.payload)
      },
      removeLastUndoAction: (state) => {
        state.undoStack.pop()
      },
      executeLastUndoAction: (state) => state,
    },
  }),
)
