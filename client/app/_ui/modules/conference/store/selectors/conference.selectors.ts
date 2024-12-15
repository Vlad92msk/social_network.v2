import { createSelector } from '@reduxjs/toolkit'
import { RootReducer } from '../../../../../../store/root.reducer'

const selectSelf = (state: RootReducer) => state.conference

export const selectSpeakingUsers = createSelector(selectSelf, (messenger) => messenger.speakingUsers)
