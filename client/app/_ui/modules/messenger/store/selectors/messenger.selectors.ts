import { createSelector } from '@reduxjs/toolkit'
import { RootReducer } from '../../../../../../store/root.reducer'

const selectSelf = (state: RootReducer) => state.messenger

export const selectChatingPanelStatus = createSelector(selectSelf, (messenger) => messenger.chatingPanelStatus)
export const selectDrawerStatus = createSelector(selectSelf, (messenger) => messenger.drawerStatus)

export const selectCurrentDialogId = createSelector(selectSelf, (messenger) => messenger.currentDialogId)

export const selectCurrentDialogMessages = createSelector(
  [selectSelf, selectCurrentDialogId],
  (messenger, currentDialogId) => {
    if (!currentDialogId || !messenger.messages[currentDialogId]) return ({ data: [], paginationInfo: null })
    return messenger.messages[currentDialogId]
  },
)

export const selectTargetNewUserToDialog = createSelector(selectSelf, (messenger) => messenger.targetNewUserToDialog)
export const selectDialogList = createSelector(selectSelf, (messenger) => messenger.shortDialogs)
export const selectCurrentDialog = createSelector(selectSelf, (messenger) => messenger.currentDialog)
export const selectCurrentDialogFixedMessages = createSelector(selectCurrentDialog, (currentDialog) => currentDialog?.fixed_messages || [])

export const selectCurrentDialogActiveParticipants = createSelector(
  [selectSelf, selectCurrentDialogId],
  (messenger, id) => messenger.activeParticipants[id],
)
