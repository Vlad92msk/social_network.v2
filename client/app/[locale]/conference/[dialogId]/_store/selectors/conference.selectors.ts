import { createSelector } from '@reduxjs/toolkit'
import { RootReducer } from '../../../../../../store/root.reducer'

const selectSelf = (state: RootReducer) => state.conference

export const selectIsConnected = createSelector(selectSelf, (messenger) => messenger.isConnected)
export const selectUsers = createSelector(selectSelf, (messenger) => messenger.users)
export const selectConferenceId = createSelector(selectSelf, (messenger) => messenger.conferenceId || '')
export const selectUserSignals = createSelector(selectSelf, (messenger) => messenger.userSignals)
