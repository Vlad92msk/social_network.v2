import { createSelector } from '@reduxjs/toolkit'
import { RootReducer } from '../../../../../store/root.reducer'
import { sliceBuilder } from '../../../../../store/utils/other'

export interface MessengerSliceState {
    currentDialogId: string
}

export const messengerInitialState: MessengerSliceState = {
  currentDialogId: '',
}

export const { actions: MessengerSliceActions, reducer: messengerReducer } = sliceBuilder(
  ({ createSlice, setState }) => createSlice({
    name: '[MESSENGER]',
    initialState: messengerInitialState,
    reducers: {
      setCurrentDialogId: setState<MessengerSliceState, string>('currentDialogId'),
    },
  }),
)

const selectSelf = (state: RootReducer) => state.messenger

export const MessengerSelectors = {
  selectСurrentDialogId: createSelector(
    [selectSelf],
    (profileState) => profileState.currentDialogId,
  ),
}
