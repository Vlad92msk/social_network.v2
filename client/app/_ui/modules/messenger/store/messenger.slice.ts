import { createSelector } from '@reduxjs/toolkit'
import { UserInfoDto } from '../../../../../../swagger/userInfo/interfaces-userInfo'
import { RootReducer } from '../../../../../store/root.reducer'
import { sliceBuilder } from '../../../../../store/utils/other'

export interface MessengerSliceState {
  // ID открытого диалога
  currentDialogId: string
  // Пользователь, который выбран для диалога (с которым еще нет диалога)
  targetNewUserToDialog?: UserInfoDto
}

export const messengerInitialState: MessengerSliceState = {
  currentDialogId: '',
  targetNewUserToDialog: undefined,
}

export const { actions: MessengerSliceActions, reducer: messengerReducer } = sliceBuilder(
  ({ createSlice, setState }) => createSlice({
    name: '[MESSENGER]',
    initialState: messengerInitialState,
    reducers: {
      setCurrentDialogId: setState<MessengerSliceState, string>('currentDialogId'),
      setTargetUserToDialog: setState<MessengerSliceState, UserInfoDto>('targetNewUserToDialog'),
    },
  }),
)

const selectSelf = (state: RootReducer) => state.messenger

export const MessengerSelectors = {
  selectCurrentDialogId: createSelector(selectSelf, (profileState) => profileState.currentDialogId),
  selectTargetNewUserToDialog: createSelector(selectSelf, (profileState) => profileState.targetNewUserToDialog),
}
